import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".hdr": "application/octet-stream",
  ".txt": "text/plain",
};
http
  .createServer(async (req, res) => {
    try {
      let name = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (name.split("/").some((part) => part.startsWith("."))) {
        res.writeHead(403).end();
        return;
      }
      if (name.endsWith("/")) name += "index.html";
      const file = resolve(root, "." + name);
      if (!file.startsWith(resolve(root) + sep)) {
        res.writeHead(403).end();
        return;
      }
      const content = await readFile(file);
      res.writeHead(200, {
        "Content-Type": mime[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 400).end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log("Portfolio preview: http://127.0.0.1:" + port),
  );
