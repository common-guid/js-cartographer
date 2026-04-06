import path from 'node:path';
import fs from 'node:fs';
import { unminify } from '../../src/unminify.js';
import { WakaruSanitizer } from '../../src/services/sanitizer/index.js';
import babel from '../../src/plugins/babel/babel.js';
import prettier from '../../src/plugins/prettier.js';
import { geminiRename } from '../../src/plugins/gemini-rename.js';
import { env } from '../../src/env.js';
import { calculateRecoveryScore } from './score.js';
import { checkSnapshots } from './snapshot.js';

async function run() {
  const input = 'fixtures/webpack-hello-world/dist/bundle.js';
  const sourceMap = 'fixtures/webpack-hello-world/dist/bundle.js.map';
  const outputDir = 'testing/quality/output';
  const snapshotDir = 'testing/quality/snapshots';

  if (!fs.existsSync(input)) {
    console.error(`Input file not found: ${input}. Please run 'cd fixtures/webpack-hello-world && npm run build'`);
    process.exit(1);
  }

  if (!fs.existsSync(sourceMap)) {
    console.warn(`Source map not found: ${sourceMap}. Recovery score will be less accurate. Run 'npm run build:sourcemap' in the fixture dir.`);
  }

  console.log('[QUALITY] Running unminify pipeline on fixture...');
  
  const apiKey = env('GEMINI_API_KEY');
  if (!apiKey) {
    console.warn('[QUALITY] GEMINI_API_KEY not found. Skipping LLM rename phase (Dry Run).');
  }

  const sanitizer = new WakaruSanitizer({
    enabled: true,
    useHeuristicNaming: true
  });

  const plugins = [babel];
  if (apiKey) {
    plugins.push(geminiRename({
      apiKey,
      model: 'gemini-2.0-flash',
      contextWindowSize: 2000
    }));
  }
  plugins.push(prettier);

  // Cache check: Skip unminify if output exists and is not empty
  const hasExistingOutput = fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0;

  if (hasExistingOutput) {
    console.log(`[QUALITY] Using existing output in ${outputDir}. Skipping unminify pipeline.`);
    console.log(`[QUALITY] (To force a fresh run, delete the ${outputDir} directory)`);
  } else {
    console.log('[QUALITY] Output directory empty or missing. Running unminify pipeline on fixture...');
    
    // Ensure output directory exists and is empty
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    await unminify(input, outputDir, plugins, sanitizer);
  }

  console.log('\n[QUALITY] Calculating Source Map Recovery Score...');
  if (fs.existsSync(sourceMap)) {
    const scoreResult = await calculateRecoveryScore(outputDir, sourceMap);
    console.log(`\n--- RECOVERY SCORE: ${scoreResult.score.toFixed(2)}% ---`);
    console.log(`Matched: ${scoreResult.matchedCount} / ${scoreResult.totalCount}`);
    console.log(`Matched Names: ${scoreResult.matched.slice(0, 10).join(', ')}${scoreResult.matched.length > 10 ? '...' : ''}`);
    console.log(`Missing Names: ${scoreResult.missing.slice(0, 10).join(', ')}${scoreResult.missing.length > 10 ? '...' : ''}`);
  } else {
    console.log('Skipping recovery score (no source map).');
  }

  console.log('\n[QUALITY] Performing Snapshot Diffing...');
  await checkSnapshots(outputDir, snapshotDir);

  console.log('\n[QUALITY] Evaluation complete.');
}

run().catch(console.error);
