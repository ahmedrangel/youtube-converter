import { createServer } from "node:http";
import { createServerAdapter } from "@whatwg-node/server";
import { AutoRouter, cors, error } from "itty-router";
import { download } from "./utils/download.js";

const { preflight, corsify } = cors();
const router = AutoRouter({
  before: [preflight],
  catch: error,
  finally: [corsify]
});

router.get("/download?", download);
router.all("*", () =>
  Response.json({ success: false, error: "Route not found" }, { status: 404 })
);

const ittyServer = createServerAdapter((req, env, ctx) => router.fetch(req, env, ctx));
const httpServer = createServer(ittyServer);
httpServer.listen(3033);
console.info("Server running on http://localhost:3033");