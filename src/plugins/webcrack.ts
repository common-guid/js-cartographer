import { webcrack as wc } from "webcrack";
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

  if (cracked.bundle) {
    return Array.from(cracked.bundle.modules.values()).map((m) => ({
      path: path.join(outputDir, m.path),
    }));
  }

  // If not a bundle, webcrack saves it as deobfuscated.js by default
  return [{ path: path.join(outputDir, "deobfuscated.js") }];
}
