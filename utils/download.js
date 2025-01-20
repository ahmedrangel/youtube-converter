import fs from "node:fs";
import path from "node:path";
import youtubeDL from "youtube-dl-exec";
import { error } from "itty-router";
import { sharedOptions, useStorage } from "./helpers.js";

const storage = useStorage();

export const download = async (req) => {
  const cdnBase = "https://cdn.ahmedrangel.com";
  const { url } = req.query;
  const { quality } = req.params;
  if (!url) return error(400, { error: "URL is required" });
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|live)\/|\S*?[?&]v=|shorts\/)?|youtu\.be\/)([a-zA-Z0-9_-]+)/;
  const id = url.match(regex)?.[1];
  if (!id) return error(400, { error: "Invalid URL" });
  const cacheKey = `videos/youtube/${id}.mp4`;
  const itemUrl = cdnBase + "/" + cacheKey + "?t=" + Date.now();
  const exists = await storage.hasItem(cacheKey);
  if (exists) return { url: itemUrl };
  console.log(`Downloading ${url}`);

  const info = await youtubeDL(url, {
    dumpJson: true,
    ...sharedOptions
  });

  // Know if horizontal or vertical video using resolution
  const width = info.width;
  const height = info.height;
  const type = width > height ? "horizontal" : "shorts";
  const qualityExists = info.formats.some((f) => f.format_note === `${quality}p`);
  const bestVideoFormatter = !qualityExists ? "ext=mp4" : type === "horizontal" ? `height<=${quality}` : `width<=${quality}`;
  const f = `bestvideo[${bestVideoFormatter}][vcodec^=avc1]+bestaudio[ext=m4a]`;
  const fileName = `${id}${qualityExists ? `-${quality}p` : ""}`;
  const tmp = path.resolve(`tmp/${fileName}`);

  // Download video
  await youtubeDL(url, {
    format: f,
    output: `${tmp}`,
    bufferSize: "16K",
    externalDownloader: "aria2c",
    externalDownloaderArgs: "-x 16 -s 16 -k 1M --file-allocation=none",
    mergeOutputFormat: "mp4",
    ...sharedOptions
  });

  const file = fs.readFileSync(`${tmp}.mp4`);
  const blob = new Blob([file], { type: "video/mp4" });
  // Delete tmp file
  fs.unlinkSync(`${tmp}.mp4`);

  await Promise.all([storage.setItemRaw(cacheKey, blob)]);

  return { url: itemUrl };
};