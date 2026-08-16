import { libraryResources } from './data.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Extract query parameters
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();
  const filterGrade = url.searchParams.get("grade") || "all";
  const filterTier = url.searchParams.get("tier") || "all";
  
  // Optionally filter by saved IDs if passed as a comma-separated list
  const savedParam = url.searchParams.get("saved");
  const savedIds = savedParam ? savedParam.split(',') : null;
  const savedOnly = url.searchParams.get("savedOnly") === "true";

  let results = libraryResources.filter((resource) => {
    // 1. Text Search Filter
    if (q) {
      const searchStr = `${resource.title} ${resource.topic} ${resource.subject} Grade ${resource.grade} ${resource.tier} ${resource.board} ${resource.description}`.toLowerCase();
      if (!searchStr.includes(q)) return false;
    }
    
    // 2. Grade Filter
    if (filterGrade !== "all") {
      if (resource.grade.toString() !== filterGrade.replace("grade-", "")) return false;
    }
    
    // 3. Tier Filter
    if (filterTier !== "all") {
      if (filterTier === "Foundation" && parseInt(resource.grade) > 5) return false;
      if (filterTier === "Higher" && parseInt(resource.grade) < 5) return false;
    }
    
    // 4. Saved Only Filter
    if (savedOnly && savedIds) {
      if (!savedIds.includes(resource.id)) return false;
    }
    
    return true;
  });

  // Map the results to remove actual URLs and only send lightweight metadata
  const mappedResults = results.map(r => ({
    id: r.id,
    grade: r.grade,
    tier: r.tier,
    board: r.board,
    subject: r.subject,
    topic: r.topic,
    title: r.title,
    description: r.description,
    hasWorksheet: !!r.worksheet_url,
    hasSolution: !!r.solution_url
  }));

  // Create JSON response
  return new Response(JSON.stringify({
    total: libraryResources.length,
    results: mappedResults
  }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60" // Optional short cache for fast repeat searches
    }
  });
}
