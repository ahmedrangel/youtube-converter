import { readdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { createStorage } from "unstorage";
import s3Driver from "unstorage/drivers/s3";

loadEnvFile();

const storage = createStorage({
  driver: s3Driver({
    accessKeyId: process.env.R2_ACCES_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    endpoint: process.env.R2_ENDPOINT,
    bucket: "assets",
    region: "auto"
  })
});

export const useStorage = () => storage;

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