import { libraryResources } from "./data.js";

function text(message, status, extraHeaders = {}) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function safeFilename(resource, type) {
  const label = `${resource.title || resource.topic || "maths-resource"}-${type}`
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 100);
  return `${label || "maths-resource"}.pdf`;
}

export async function onRequest({ request }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return text("Method not allowed", 405, { Allow: "GET, HEAD" });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  const type = url.searchParams.get("type") || "";

  if (!id || !new Set(["worksheet", "solution"]).has(type)) {
    return text("Invalid resource request", 400);
  }

  const resource = libraryResources.find((item) => item.id === id);
  if (!resource) return text("Resource not found", 404);

  const targetUrl = type === "worksheet" ? resource.worksheet_url : resource.solution_url;
  if (!targetUrl) return text("Resource file not available", 404);

  const upstreamHeaders = new Headers();
  for (const header of ["Range", "If-None-Match", "If-Modified-Since"]) {
    const value = request.headers.get(header);
    if (value) upstreamHeaders.set(header, value);
  }

  let upstream;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers: upstreamHeaders,
      redirect: "follow",
      cf: { cacheEverything: true, cacheTtl: 86400 },
    });
  } catch {
    return text("The PDF could not be loaded right now", 502);
  }

  if (!upstream.ok && upstream.status !== 304) {
    return text(
      upstream.status === 404 ? "Resource file not found" : "The PDF could not be loaded right now",
      upstream.status === 404 ? 404 : 502,
    );
  }

  const headers = new Headers({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${safeFilename(resource, type)}"`,
    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    "X-Content-Type-Options": "nosniff",
  });
  for (const header of ["Accept-Ranges", "Content-Length", "Content-Range", "ETag", "Last-Modified"]) {
    const value = upstream.headers.get(header);
    if (value) headers.set(header, value);
  }

  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
