import { libraryResources } from "../functions/api/data.js";

const resources = libraryResources.map((resource) => ({
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
}));

await Deno.writeTextFile(
  new URL("../catalogue.json", import.meta.url),
  `${JSON.stringify({ version: 1, resources })}\n`,
);
