import fs from 'node:fs';
import path from 'node:path';
import { SourceMapConsumer } from 'source-map';
import * as parser from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = (traverseModule as any).default || traverseModule;

export async function calculateRecoveryScore(outputDir: string, sourceMapPath: string) {
  const rawSourceMap = JSON.parse(fs.readFileSync(sourceMapPath, 'utf8'));
  
  return await SourceMapConsumer.with(rawSourceMap, null, async (consumer) => {
    const originalNames = new Set<string>();
    
    // Extract names that belong to our source files (not webpack internals)
    consumer.eachMapping((m) => {
      if (m.name && m.source && m.source.includes('./src/')) {
        originalNames.add(m.name);
      }
    });

    if (originalNames.size === 0) {
      // Fallback to all names if filtering failed
      rawSourceMap.names.forEach((n: string) => originalNames.add(n));
    }

    // Filter out common JS/Webpack boilerplate names that we don't care about
    const boilerplate = new Set(['__webpack_require__', 'exports', 'module', 'require', '__esModule', 'default']);
    boilerplate.forEach(name => originalNames.delete(name));

    const foundNames = new Set<string>();
    const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const code = fs.readFileSync(path.join(outputDir, file), 'utf8');
      try {
        const ast = parser.parse(code, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        });

        traverse(ast, {
          Identifier(path: any) {
            if (originalNames.has(path.node.name)) {
              foundNames.add(path.node.name);
            }
          },
        });
      } catch (e) {
        console.warn(`Could not parse ${file} for scoring:`, e);
      }
    }

    const matched = Array.from(originalNames).filter(name => foundNames.has(name));
    const missing = Array.from(originalNames).filter(name => !foundNames.has(name));
    
    const score = (matched.length / originalNames.size) * 100;

    return {
      score,
      matchedCount: matched.length,
      totalCount: originalNames.size,
      matched,
      missing,
    };
  });
}
