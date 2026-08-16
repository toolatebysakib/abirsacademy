import { libraryResources } from "../functions/api/data.js";
import { onRequest as search } from "../functions/api/search.js";
import { onRequest as resource } from "../functions/api/resource.js";
import { calculateFitZoom, layoutWidthChanged, zoomChanged } from "../pdf-studio-utils.js";

const projectRoot = new URL("../", import.meta.url);

function assert(value: unknown, message = "Assertion failed"): asserts value {
  if (!value) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown) {
  const normalise = (value: unknown) => ArrayBuffer.isView(value) ? [...value as Uint8Array] : value;
  if (JSON.stringify(normalise(actual)) !== JSON.stringify(normalise(expected))) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function assertMatch(actual: string, expected: RegExp) {
  if (!expected.test(actual)) throw new Error(`Expected ${JSON.stringify(actual)} to match ${expected}`);
}

async function test(name: string, fn: () => void | Promise<void>) {
  await fn();
  console.log(`ok - ${name}`);
}

async function jsonResponse(path: string, method = "GET") {
  const response = await search({ request: new Request(`https://example.test${path}`, { method }) } as never);
  return { response, body: response.status === 200 && method !== "HEAD" ? await response.json() : null };
}

await test("catalogue data has unique usable records", () => {
  assertEquals(libraryResources.length, 462);
  assertEquals(new Set(libraryResources.map((item) => item.id)).size, libraryResources.length);
  assert(libraryResources.every((item) => item.title.trim() && item.topic.trim()));
  assert(libraryResources.every((item) => Number.isInteger(item.grade) && item.grade >= 1 && item.grade <= 9));
  assert(libraryResources.every((item) => item.worksheet_url || item.solution_url));
});

await test("search is paginated and includes facets", async () => {
  const { response, body } = await jsonResponse("/api/search");
  assertEquals(response.status, 200);
  assertEquals(body.results.length, 24);
  assertEquals(body.total, 462);
  assertEquals(body.catalogueTotal, 462);
  assertEquals(body.hasMore, true);
  assertEquals(body.facets.grades[1], 89);
  assertEquals(body.facets.tiers.Foundation + body.facets.tiers.Higher, 462);
});

await test("every resource is reachable through continuous pagination", async () => {
  const ids: string[] = [];
  for (let page = 1; page <= Math.ceil(libraryResources.length / 24); page += 1) {
    const { response, body } = await jsonResponse(`/api/search?page=${page}&limit=24`);
    assertEquals(response.status, 200);
    ids.push(...body.results.map((item: { id: string }) => item.id));
  }
  assertEquals(ids.length, libraryResources.length);
  assertEquals(new Set(ids).size, libraryResources.length);
});

await test("search filters grade, tier, text and saved ids", async () => {
  const grade = await jsonResponse("/api/search?grade=grade-8&limit=48");
  assertEquals(grade.body.total, 27);
  assert(grade.body.results.every((item: { grade: number }) => item.grade === 8));

  const text = await jsonResponse("/api/search?q=quadratic&limit=48");
  assert(text.body.total > 0);
  assert(text.body.results.every((item: { title: string; topic: string }) => `${item.title} ${item.topic}`.toLowerCase().includes("quadratic")));

  const saved = await jsonResponse("/api/search?savedOnly=true&saved=ws-math-g1-002,ws-math-g8-458&limit=48");
  assertEquals(saved.body.results.map((item: { id: string }) => item.id), ["ws-math-g1-002", "ws-math-g8-458"]);

  const noneSaved = await jsonResponse("/api/search?savedOnly=true");
  assertEquals(noneSaved.body.total, 0);
});

await test("search rejects invalid filters and methods", async () => {
  assertEquals((await jsonResponse("/api/search?grade=12")).response.status, 400);
  assertEquals((await jsonResponse("/api/search?tier=Unknown")).response.status, 400);
  assertEquals((await jsonResponse("/api/search", "POST")).response.status, 405);
  assertEquals((await jsonResponse("/api/search", "HEAD")).response.status, 200);
});

await test("resource endpoint validates requests", async () => {
  assertEquals((await resource({ request: new Request("https://example.test/api/resource") } as never)).status, 400);
  assertEquals((await resource({ request: new Request("https://example.test/api/resource?id=missing&type=worksheet") } as never)).status, 404);
  assertEquals((await resource({ request: new Request("https://example.test/api/resource?id=ws-math-g1-002&type=other") } as never)).status, 400);
  assertEquals((await resource({ request: new Request("https://example.test/api/resource", { method: "POST" }) } as never)).status, 405);
});

await test("resource endpoint proxies PDFs and forwards range headers", async () => {
  const originalFetch = globalThis.fetch;
  let forwardedRange = "";
  globalThis.fetch = (input, init) => {
    assertMatch(String(input), /^https:\/\/pub-[a-z0-9]+\.r2\.dev\/resources\/deep_resource_/);
    forwardedRange = new Headers(init?.headers).get("Range") || "";
    return Promise.resolve(new Response(new Uint8Array([37, 80, 68, 70]), {
      status: 206,
      headers: { "Content-Type": "application/pdf", "Content-Range": "bytes 0-3/4", "Accept-Ranges": "bytes" },
    }));
  };
  try {
    const request = new Request("https://example.test/api/resource?id=ws-math-g1-002&type=worksheet", { headers: { Range: "bytes=0-3" } });
    const response = await resource({ request } as never);
    assertEquals(response.status, 206);
    assertEquals(forwardedRange, "bytes=0-3");
    assertEquals(response.headers.get("Content-Type"), "application/pdf");
    assertEquals(response.headers.get("Content-Range"), "bytes 0-3/4");
    assertMatch(response.headers.get("Content-Disposition") || "", /^inline; filename=".+\.pdf"$/);
    assertEquals(new Uint8Array(await response.arrayBuffer()), new Uint8Array([37, 80, 68, 70]));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await test("new pages have unique ids and safe new-tab links", async () => {
  for (const filename of ["library.html", "pdf-studio.html"]) {
    const html = await Deno.readTextFile(new URL(filename, projectRoot));
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    assertEquals(new Set(ids).size, ids.length);
    for (const anchor of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
      assert(/\brel="[^"]*noopener/.test(anchor[0]), `${filename} contains an unsafe new-tab link`);
    }
  }
});

await test("PDF resources route through Study Studio and the local proxy", async () => {
  const libraryScript = await Deno.readTextFile(new URL("library-v8.js", projectRoot));
  const resourceFunction = await Deno.readTextFile(new URL("functions/api/resource.js", projectRoot));
  const homepageScript = await Deno.readTextFile(new URL("app.js", projectRoot));
  const headers = await Deno.readTextFile(new URL("_headers", projectRoot));
  assert(libraryScript.includes("pdf-studio.html?"));
  assert(!libraryScript.includes("r2.dev"));
  assert(!resourceFunction.includes("Response.redirect"));
  assert(resourceFunction.includes('"Content-Type": "application/pdf"'));
  assert(!homepageScript.includes("www.abirsacademy.pages.dev"));
  assert(headers.includes("worker-src 'self' blob:"));
});

await test("PDF Studio fit-to-width calculations ignore resize jitter", () => {
  assertEquals(calculateFitZoom(800, 1000), 0.8);
  assertEquals(calculateFitZoom(300, 1000), 0.55);
  assertEquals(calculateFitZoom(2000, 1000), 1.6);
  assertEquals(layoutWidthChanged(800, 800.4), false);
  assertEquals(layoutWidthChanged(800, 801), true);
  assertEquals(zoomChanged(0.8, 0.801), false);
  assertEquals(zoomChanged(0.8, 0.803), true);
});

await test("PDF Studio preserves active tools while stabilising renders", async () => {
  const html = await Deno.readTextFile(new URL("pdf-studio.html", projectRoot));
  const script = await Deno.readTextFile(new URL("pdf-studio.js", projectRoot));
  const styles = await Deno.readTextFile(new URL("pdf-studio.css", projectRoot));
  for (const tool of ["hand", "pen", "marker", "text", "eraser"]) {
    assert(html.includes(`data-tool="${tool}"`));
    assert(script.includes(`${tool}:`));
  }
  assert(!script.includes("state.draft = null;\n  state.drawing = false;"));
  assert(script.includes("state.renderedPage === state.page"));
  assert(script.includes("layoutWidthChanged(lastWorkspaceBoxWidth, boxWidth)"));
  assert(script.includes("getBoundingClientRect().width"));
  assert(script.includes("state.drawing || state.erasing || elements.textDialog.open"));
  assert(script.includes("getCoalescedEvents"));
  assert(script.includes('addEventListener("lostpointercapture", finishPointer)'));
  assert(script.includes("await documentToSave.save"));
  assert(styles.includes("scrollbar-gutter: stable both-edges"));
});

await test("static catalogue fallback is complete and does not expose storage URLs", async () => {
  const fallbackText = await Deno.readTextFile(new URL("catalogue.json", projectRoot));
  const fallback = JSON.parse(fallbackText);
  assertEquals(fallback.version, 1);
  assertEquals(fallback.resources.length, libraryResources.length);
  assertEquals(
    fallback.resources.map((item: { id: string }) => item.id),
    libraryResources.map((item) => item.id),
  );
  assert(!fallbackText.includes("r2.dev"));
  assert(!fallback.resources.some((item: Record<string, unknown>) => "worksheet_url" in item || "solution_url" in item));
});

await test("library uses automatic infinite scrolling with an accessible fallback", async () => {
  const html = await Deno.readTextFile(new URL("library.html", projectRoot));
  const script = await Deno.readTextFile(new URL("library-v8.js", projectRoot));
  assert(html.includes("data-infinite-sentinel"));
  assert(html.includes("data-infinite-status"));
  assert(script.includes("new IntersectionObserver"));
  assert(script.includes("rootMargin: \"700px 0px\""));
  assert(script.includes("infiniteScrollObserver.observe(elements.scrollSentinel)"));
  assert(script.includes("if (!(\"IntersectionObserver\" in window)) return"));
});

await test("maintained client mirror matches the live root", async () => {
  try {
    await Deno.stat(new URL("client/abirs-academy", projectRoot));
  } catch {
    return;
  }
  for (const filename of [
    "app.js", "index.html", "library.html", "library-v8.js", "dashboard.css", "catalogue.json",
    "pdf-studio.html", "pdf-studio.js", "pdf-studio.css", "pdf-studio-utils.js", "_headers",
    "functions/api/data.js", "functions/api/search.js", "functions/api/resource.js",
    "vendor/pdf.mjs", "vendor/pdf.worker.mjs", "vendor/pdf-lib.min.js",
  ]) {
    assertEquals(
      await Deno.readFile(new URL(filename, projectRoot)),
      await Deno.readFile(new URL(`client/abirs-academy/${filename}`, projectRoot)),
    );
  }
});
