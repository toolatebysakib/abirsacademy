import { libraryResources } from "./data.js";

const MAX_PAGE_SIZE = 48;
const DEFAULT_PAGE_SIZE = 24;

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

function metadata(resource) {
  return {
    id: resource.id,
    grade: resource.grade,
    tier: resource.tier,
    board: resource.board,
    subject: resource.subject,
    topic: resource.topic,
    title: resource.title,
    description: resource.description,
    hasWorksheet: Boolean(resource.worksheet_url),
    hasSolution: Boolean(resource.solution_url),
  };
}

const gradeCounts = libraryResources.reduce((counts, resource) => {
  const key = String(resource.grade);
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

export async function onRequest({ request }) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json({ error: "Method not allowed" }, 405, { Allow: "GET, HEAD" });
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim().toLocaleLowerCase("en-GB").slice(0, 120);
  const grade = (url.searchParams.get("grade") || "all").replace(/^grade-/, "");
  const tier = url.searchParams.get("tier") || "all";
  const savedOnly = url.searchParams.get("savedOnly") === "true";
  const savedIds = new Set(
    (url.searchParams.get("saved") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, libraryResources.length),
  );
  const page = positiveInteger(url.searchParams.get("page"), 1);
  const limit = positiveInteger(url.searchParams.get("limit"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  if (grade !== "all" && !/^[1-9]$/.test(grade)) {
    return json({ error: "Invalid grade filter" }, 400);
  }
  if (!new Set(["all", "Foundation", "Higher"]).has(tier)) {
    return json({ error: "Invalid tier filter" }, 400);
  }

  const matches = libraryResources.filter((resource) => {
    if (savedOnly && !savedIds.has(resource.id)) return false;
    if (grade !== "all" && String(resource.grade) !== grade) return false;
    if (tier !== "all" && resource.tier !== tier) return false;

    if (query) {
      const searchable = [
        resource.title,
        resource.topic,
        resource.subject,
        `Grade ${resource.grade}`,
        resource.tier,
        resource.board,
        resource.description,
      ].join(" ").toLocaleLowerCase("en-GB");
      if (!searchable.includes(query)) return false;
    }

    return true;
  });

  const start = (page - 1) * limit;
  const results = matches.slice(start, start + limit).map(metadata);
  const payload = {
    total: matches.length,
    catalogueTotal: libraryResources.length,
    page,
    pageSize: limit,
    hasMore: start + results.length < matches.length,
    facets: {
      grades: gradeCounts,
      tiers: {
        Foundation: libraryResources.filter((resource) => resource.tier === "Foundation").length,
        Higher: libraryResources.filter((resource) => resource.tier === "Higher").length,
      },
    },
    results,
  };

  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return json(payload, 200, savedOnly ? { "Cache-Control": "private, no-store" } : {});
}
