import fs from 'node:fs/promises';
import path from 'node:path';

// Helper to recursively find all .js files
export async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return files.flat().filter((f) => f.endsWith('.js') || f.endsWith('.ts'));
}
