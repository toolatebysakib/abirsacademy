import { libraryResources } from './data.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  const id = url.searchParams.get("id");
  const type = url.searchParams.get("type"); // 'worksheet' or 'solution'
  
  if (!id || !type) {
    return new Response("Missing parameters", { status: 400 });
  }

  // Find the resource in our secure backend array
  const resource = libraryResources.find(r => r.id === id);
  
  if (!resource) {
    return new Response("Resource not found", { status: 404 });
  }

  // Get the correct URL
  let targetUrl = null;
  if (type === "worksheet") {
    targetUrl = resource.worksheet_url;
  } else if (type === "solution") {
    targetUrl = resource.solution_url;
  }

  if (!targetUrl) {
    return new Response("Resource URL not available", { status: 404 });
  }

  // Perform a 302 redirect to the secure R2 link
  return Response.redirect(targetUrl, 302);
}
