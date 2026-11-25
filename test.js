import youtubeDL from "youtube-dl-exec";

const dl = await youtubeDL("https://www.youtube.com/watch?v=KxBkyOSRnfU", {
  dumpSingleJson: true,
  noCheckCertificates: true,
  noWarnings: true,
  preferFreeFormats: true,
  referer: "https://www.youtube.com/"
});

console.log(dl.formats.filter(format => format.acodec !== "none"));