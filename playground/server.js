import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? 8080);
const routes = new Map([
  ["/", "playground/index.html"],
  ["/styles.css", "playground/styles.css"],
  ["/app.js", "playground/app.js"],
  ["/runtime.js", "src/runtime.js"],
  ["/languages/af.json", "languages/af.json"],
  ["/languages/en.json", "languages/en.json"],
  ["/languages/zh.json", "languages/zh.json"],
]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = http.createServer((request, response) => {
  const relativePath = routes.get(new URL(request.url, "http://localhost").pathname);
  if (!relativePath) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const filePath = path.join(root, relativePath);
  response.writeHead(200, {
    "content-type": types[path.extname(filePath)] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Moedertaal playground: http://127.0.0.1:${port}`);
});
