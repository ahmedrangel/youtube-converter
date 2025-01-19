import fs from "node:fs";
import path from "node:path";
import youtubeDL from "youtube-dl-exec";
import { error } from "itty-router";
import { sharedOptions, useStorage } from "./helpers.js";

const storage = useStorage();

const toMp4Blob = (buffer) => new Blob([buffer], { type: "video/mp4" });

export const download = async (req) => {
  const { url } = req.query;
  const { quality } = req.params;
  const cacheKey = `${encodeURIComponent(url)}:${encodeURIComponent(quality)}`;
  if (!url) return error(400, { error: "URL is required" });
  console.log(`Downloading ${url}`);

  // Check if video is cached
  const [cached, meta] = await Promise.all([storage.getItem(cacheKey), storage.getMeta(cacheKey)]);
  if (cached) {
    return new Response((toMp4Blob(Buffer.from(cached.data))), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${meta.title}.mp4"`
      }
    });
  }


  const info = await youtubeDL(url, {
    dumpJson: true,
    ...sharedOptions
  });

  // Know if horizontal or vertical video using resolution
  const width = info.width;
  const height = info.height;
  const type = width > height ? "horizontal" : "shorts";
  const qualityExists = info.formats.some((f) => f.format_note === `${quality}p`);
  const title = `${info.title.replaceAll("/", "")}`;
  const bestVideoFormatter = !qualityExists ? "ext=mp4" : type === "horizontal" ? `height<=${quality}` : `width<=${quality}`;
  const f = `bestvideo[${bestVideoFormatter}][vcodec^=avc1]+bestaudio[ext=m4a]`;
  // replace symbols with empty string
  const fileName = `${title}${qualityExists ? `-${quality}p` : ""}`.replaceAll(" ", "").replace(/[!?¿#@|]/g, "");
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
  // Delete tmp file
  fs.unlinkSync(`${tmp}.mp4`);
  await Promise.all([
    storage.setItem(cacheKey, file, { ttl: 86400 }),
    storage.setMeta(cacheKey, { title: encodeURIComponent(title) })
  ]);

  return new Response(toMp4Blob(file), {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(title)}.mp4"`
    }
  });
};