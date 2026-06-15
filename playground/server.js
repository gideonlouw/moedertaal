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
]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;

  if (pathname === "/languages") {
    const languages = fs.readdirSync(path.join(root, "languages"))
      .filter((fileName) => fileName.endsWith(".json"))
      .map((fileName) => JSON.parse(
        fs.readFileSync(path.join(root, "languages", fileName), "utf8"),
      ))
      .map(({ code, name }) => ({ code, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
    response.writeHead(200, {
      "content-type": types[".json"],
      "cache-control": "no-store",
    });
    response.end(JSON.stringify(languages));
    return;
  }

  const languageMatch = pathname.match(/^\/languages\/([a-z]{2})\.json$/u);
  const candidatePath = languageMatch
    ? `languages/${languageMatch[1]}.json`
    : routes.get(pathname);
  const relativePath = candidatePath && fs.existsSync(path.join(root, candidatePath))
    ? candidatePath
    : null;
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

export { server };
