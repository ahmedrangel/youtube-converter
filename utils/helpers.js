import { createStorage } from "unstorage";
import s3Driver from "unstorage/drivers/s3";

process.loadEnvFile();

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
  youtubeSkipDashManifest: true,
  noCheckCertificate: true,
  referer: "https://www.youtube.com/"
};