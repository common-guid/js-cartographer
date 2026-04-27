import { webcrack as wc } from "webcrack";
import fs from "fs/promises";
import path from "path";

type File = {
  path: string;
};

export async function webcrack(
  code: string,
  outputDir: string
): Promise<File[]> {
  const cracked = await wc(code);
  await cracked.save(outputDir);

  const getFiles = async (dir: string): Promise<string[]> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        return entry.isDirectory() ? getFiles(fullPath) : fullPath;
      })
    );
    return files.flat();
  };

  const allFiles = await getFiles(outputDir);
  return allFiles
    .filter((file) => file.endsWith(".js"))
    .map((file) => ({ path: file }));
}
