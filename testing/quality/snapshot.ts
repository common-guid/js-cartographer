import fs from 'node:fs';
import path from 'node:path';
import * as diff from 'diff';
import { confirm } from '@inquirer/prompts';

export async function checkSnapshots(outputDir: string, snapshotDir: string) {
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }

  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.js'));
  let anyChange = false;

  for (const file of files) {
    const currentPath = path.join(outputDir, file);
    const snapshotPath = path.join(snapshotDir, file);
    const currentContent = fs.readFileSync(currentPath, 'utf8');

    if (!fs.existsSync(snapshotPath)) {
      console.log(`[SNAPSHOT] New file: ${file}. Creating initial snapshot...`);
      fs.writeFileSync(snapshotPath, currentContent);
      continue;
    }

    const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');

    if (currentContent !== snapshotContent) {
      anyChange = true;
      console.log(`\n[SNAPSHOT] Difference found in ${file}:`);
      
      const patch = diff.createPatch(file, snapshotContent, currentContent, 'previous', 'current');
      
      // Colorize the patch for better visibility (very basic)
      patch.split('\n').forEach(line => {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          console.log('\x1b[32m%s\x1b[0m', line); // Green
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          console.log('\x1b[31m%s\x1b[0m', line); // Red
        } else if (line.startsWith('@@')) {
          console.log('\x1b[36m%s\x1b[0m', line); // Cyan
        } else {
          console.log(line);
        }
      });

      const accept = await confirm({
        message: `Accept this change as the new snapshot for ${file}?`,
        default: false,
      });

      if (accept) {
        fs.writeFileSync(snapshotPath, currentContent);
        console.log(`[SNAPSHOT] Updated snapshot for ${file}.`);
      } else {
        console.log(`[SNAPSHOT] Kept previous snapshot for ${file}.`);
      }
    }
  }

  if (!anyChange) {
    console.log('[SNAPSHOT] All files match their snapshots.');
  }
}
