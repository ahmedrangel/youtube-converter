import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";
import youtubeDL from "youtube-dl-exec";
import { error } from "itty-router";
import { cleanDir, sharedOptions } from "./helpers.js";

export const download = async (req) => {
  try {
    // const { url, quality } = await req.json();
    const { url, quality } = req.query;
    if (!url) return error(400, { error: "URL is required" });
    if (!quality) return error(400, { error: "Quality is required" });

    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|live)\/|\S*?[?&]v=|shorts\/)?|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const id = url.match(regex)?.[1];
    if (!id) return error(400, { error: "Invalid URL" });

    console.log(`Downloading ${url}`);
    const info = await youtubeDL(url, {
      dumpJson: true,
      ...sharedOptions
    });

    // Know if horizontal or vertical video using resolution
    const width = info.width;
    const height = info.height;
    const type = width > height ? "horizontal" : "shorts";
    const qualityExists = info.formats.some(f => f.format_note === `${quality}p`);
    const bestVideoFormatter = !qualityExists ? "ext=mp4" : type === "horizontal" ? `height<=${quality}` : `width<=${quality}`;
    const format = `bestvideo[${bestVideoFormatter}][vcodec^=avc1]+bestaudio[ext=m4a]`;
    const fileName = `${id}${qualityExists ? `-${quality}p` : ""}`;
    const tmp = resolve(`tmp/${fileName}`);
    const infoPath = resolve(`tmp/${fileName}.info.json`);

    if (!ffmpegPath) throw new Error("FFmpeg is unavailable on this platform");

    await Promise.all([
      mkdir(resolve("tmp"), { recursive: true }),
      writeFile(infoPath, JSON.stringify(info))
    ]);

    try {
      // Reuse the extracted metadata instead of resolving the URL again.
      await youtubeDL("", {
        loadInfoJson: infoPath,
        format,
        output: tmp,
        mergeOutputFormat: "mp4",
        ffmpegLocation: ffmpegPath,
        concurrentFragments: 8,
        ...sharedOptions
      });

      const file = await readFile(`${tmp}.mp4`);
      const blob = new Blob([file], { type: "video/mp4" });

      return new Response(blob, {
        headers: { "Content-Type": blob.type }
      });
    } finally {
      await cleanDir("tmp", fileName);
    }
  } catch (err) {
    console.error(err);
    return error(500, { error: "An internal error occurred" });
  }
};