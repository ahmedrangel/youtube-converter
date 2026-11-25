import { readdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";

export const sharedOptions = {
  noWarnings: true,
  preferFreeFormats: true,
  noCheckCertificate: true,
  referer: "https://www.youtube.com/"
};

export const cleanDir = async (dir, fileName) => {
  const files = await readdir(resolve(dir));
  await Promise.all(
    files.map(async (file) => {
      if (file.includes(fileName)) { // Delete all files that contain the fileName
        await unlink(resolve(`${dir}/${file}`));
      }
    })
  );
};