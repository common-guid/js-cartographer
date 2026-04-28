import fs from 'node:fs/promises';
import path from 'node:path';

// Helper to recursively find all .js files
export async function getFiles(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map(async (dirent) => {
      const res = path.resolve(dir, dirent.name);
      if (dirent.isDirectory()) {
        return getFiles(res);
      }
      if (dirent.isFile() && (dirent.name.endsWith('.js') || dirent.name.endsWith('.ts'))) {
        return [res];
      }
      return [];
    })
  );
  return files.flat();
}
