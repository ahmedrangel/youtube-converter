import { createStorage } from "unstorage";
import redisDriver from "unstorage/drivers/redis";

const storage = createStorage(redisDriver({
  base: "cache",
  host: "localhost",
  port: 6379
}));

export const useStorage = () => storage;

export const sharedOptions = {
  noWarnings: true,
  preferFreeFormats: true,
  youtubeSkipDashManifest: true,
  noCheckCertificate: true,
  referer: "https://www.youtube.com/",
};