import { onRequest as searchResources } from "./functions/api/search.js";
import { onRequest as streamResource } from "./functions/api/resource.js";

const hostname = "127.0.0.1";
const port = 8788;
const root = Deno.cwd();

const contentTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

function extension(path: string) {
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot).toLowerCase();
}

function plainText(message: string, status: number, extraHeaders: HeadersInit = {}) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...extraHeaders },
  });
}

async function staticResponse(request: Request, url: URL) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return plainText("Method not allowed", 405, { Allow: "GET, HEAD" });
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return plainText("Invalid URL", 400);
  }

  if (pathname === "/") pathname = "/index.html";
  const segments = pathname.split("/").filter(Boolean);
  const blocked = new Set([".git", ".local-backups", ".env", "functions"]);
  if (!segments.length || segments.some((part) => part === ".." || blocked.has(part.toLowerCase()))) {
    return plainText("Not found", 404);
  }

  const separator = Deno.build.os === "windows" ? "\\" : "/";
  let filename = `${root}${separator}${segments.join(separator)}`;
  try {
    const info = await Deno.stat(filename);
    if (info.isDirectory) filename = `${filename}${separator}index.html`;
    const body = request.method === "HEAD" ? null : await Deno.readFile(filename);
    const fileInfo = await Deno.stat(filename);
    return new Response(body, {
      headers: {
        "Content-Type": contentTypes[extension(filename)] || "application/octet-stream",
        "Content-Length": String(fileInfo.size),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return plainText("Not found", 404);
    console.error(error);
    return plainText("Local server error", 500);
  }
}

Deno.serve({ hostname, port }, async (request) => {
  const url = new URL(request.url);
  if (url.pathname === "/api/search") return searchResources({ request } as never);
  if (url.pathname === "/api/resource") return streamResource({ request } as never);
  return staticResponse(request, url);
});

console.log(`Abir's Academy is ready at http://${hostname}:${port}/`);
