const libraryResources = [
  { id: "questions-by-topic", title: "GCSE questions by topic", collection: "start", type: "Topic directory", level: "Grades 1–9", source: "Maths Links", description: "Begin with a topic and open the original directory of questions, answers, videos and one-page guides.", url: "https://www.mathslinks.co.uk/gcse-questions-by-topic", priority: 1 },
  { id: "resource-finder", title: "Resource finder", collection: "start", type: "Search tool", level: "All GCSE", source: "Maths Links", description: "Search the original catalogue by topic or approximate grade when you already know the gap to work on.", url: "https://www.mathslinks.co.uk/resource-finder", priority: 2 },
  { id: "resource-organiser", title: "Resource organiser", collection: "start", type: "Planning tool", level: "All GCSE", source: "Maths Links", description: "Choose several topics and assemble a more focused set of resource links for later study.", url: "https://www.mathslinks.co.uk/resource-organiser", priority: 3 },
  { id: "how-to-use", title: "How to use Maths Links", collection: "start", type: "Study guide", level: "All learners", source: "Maths Links", description: "Read the directory creator’s suggested routes through topic questions, past papers and mixed practice.", url: "https://www.mathslinks.co.uk/how-to-use-mathslinks", priority: 4 },

  { id: "gcse-course", title: "GCSE maths course", collection: "learn", type: "Course", level: "GCSE", source: "Maths Links", description: "Follow focused lessons on high-value crossover ideas that appear across the major exam boards.", url: "https://www.mathslinks.co.uk/gcse-maths-course", priority: 10 },
  { id: "grade-one", title: "Grade 1 questions", collection: "learn", type: "Foundation", level: "Grade 1", source: "Maths Links", description: "Start with accessible foundation questions and routes for building secure mathematical basics.", url: "https://www.mathslinks.co.uk/worksheets/grade-1-questions", priority: 11 },
  { id: "crossover", title: "Crossover topics", collection: "learn", type: "Topic collection", level: "Grades 4–5", source: "Maths Links", description: "Concentrate on the topics that bridge Foundation and Higher tier and often decide a grade boundary.", url: "https://www.mathslinks.co.uk/worksheets/crossover-topics", priority: 12 },
  { id: "grade-nine", title: "Grade 9 questions", collection: "learn", type: "Higher challenge", level: "Grades 8–9", source: "Maths Links", description: "Open a collection of demanding higher-tier questions intended for top-grade preparation.", url: "https://www.mathslinks.co.uk/worksheets/grade-9-questions", priority: 13 },

  { id: "interleaving", title: "Interleaving resources", collection: "practice", type: "Mixed practice", level: "Grades 1–9", source: "Maths Links", description: "Switch between topics so you practise recognising the method as well as carrying it out.", url: "https://www.mathslinks.co.uk/interleaving-resources", priority: 20 },
  { id: "past-paper-questions", title: "Past-paper questions by topic", collection: "practice", type: "Exam questions", level: "GCSE", source: "Maths Links", description: "Practise exam-style questions grouped around a single topic before attempting complete papers.", url: "https://www.mathslinks.co.uk/past-paper-questions", priority: 21 },
  { id: "worksheets", title: "Worksheet collections", collection: "practice", type: "Worksheet hub", level: "KS2–GCSE", source: "Maths Links", description: "Open the main route to worksheet collections, providers and grade-focused practice.", url: "https://www.mathslinks.co.uk/worksheets", priority: 22 },
  { id: "grid-worksheets", title: "Grid worksheets", collection: "practice", type: "Printable practice", level: "Foundation", source: "Maths Links", description: "Use printable grid activities for short, repeatable practice with core number skills.", url: "https://www.mathslinks.co.uk/grids/grid-worksheets", priority: 23 },
  { id: "ks2-worksheets", title: "KS2 SATs worksheets", collection: "practice", type: "Primary practice", level: "KS2", source: "Maths Links", description: "Find worksheet routes intended for pupils preparing for Key Stage 2 mathematics assessments.", url: "https://www.mathslinks.co.uk/worksheets/ks2-sats-worksheets", priority: 24 },

  { id: "past-papers", title: "Past-paper hub", collection: "exams", type: "Exam directory", level: "GCSE", source: "Maths Links", description: "Choose an exam board and reach past papers, supporting tools and related exam resources.", url: "https://www.mathslinks.co.uk/past-papers", priority: 30 },
  { id: "edexcel", title: "Edexcel past papers", collection: "exams", type: "Exam board", level: "Foundation & Higher", source: "Pearson / Maths Links", description: "Open the Edexcel paper route with papers, mark schemes and related preparation links.", url: "https://www.mathslinks.co.uk/past-papers/edexcel-past-papers", priority: 31 },
  { id: "edexcel-tool", title: "Edexcel past-paper tool", collection: "exams", type: "Paper tool", level: "Foundation & Higher", source: "Maths Links", description: "Use the original interactive route for locating and working with Edexcel papers.", url: "https://www.mathslinks.co.uk/past-papers/edexcel-past-papers/edexcel-past-paper-tool", priority: 32 },
  { id: "half-papers", title: "Half exam papers", collection: "exams", type: "Timed practice", level: "GCSE", source: "Maths Links", description: "Build exam stamina with shorter paper sets when a full paper is too large for one session.", url: "https://www.mathslinks.co.uk/past-papers/edexcel-past-papers/half-exam-papers", priority: 33 },
  { id: "aqa", title: "AQA past papers", collection: "exams", type: "Exam board", level: "Foundation & Higher", source: "AQA / Maths Links", description: "Open the AQA paper route with papers, mark schemes and supporting preparation links.", url: "https://www.mathslinks.co.uk/past-papers/aqa-past-papers", priority: 34 },
  { id: "aqa-tool", title: "AQA past-paper tool", collection: "exams", type: "Paper tool", level: "Foundation & Higher", source: "Maths Links", description: "Use the original tool for navigating AQA GCSE maths papers more efficiently.", url: "https://www.mathslinks.co.uk/past-papers/aqa-past-papers/aqa-past-paper-tool", priority: 35 },
  { id: "ocr", title: "OCR past papers", collection: "exams", type: "Exam board", level: "Foundation & Higher", source: "OCR / Maths Links", description: "Open the OCR paper route and its linked assessment material at the original sources.", url: "https://www.mathslinks.co.uk/past-papers/ocr-past-papers", priority: 36 },
  { id: "eduqas", title: "Eduqas past papers", collection: "exams", type: "Exam board", level: "Foundation & Higher", source: "Eduqas / Maths Links", description: "Open the Eduqas paper route and related board-specific preparation resources.", url: "https://www.mathslinks.co.uk/past-papers/eduqas-past-papers", priority: 37 },
  { id: "ks2-papers", title: "KS2 SATs papers", collection: "exams", type: "National assessment", level: "KS2", source: "Maths Links", description: "Reach past Key Stage 2 mathematics papers and associated preparation material.", url: "https://www.mathslinks.co.uk/past-papers/ks2-sats-papers", priority: 38 },
  { id: "practice-papers", title: "GCSE practice papers", collection: "exams", type: "Practice paper", level: "Foundation & Higher", source: "Kenneth Stafford", description: "Use original practice-paper sets with hints and solutions for realistic exam preparation.", url: "https://www.mathslinks.co.uk/practice-papers", priority: 39 },
  { id: "boundaries", title: "GCSE grade boundaries", collection: "exams", type: "Exam information", level: "GCSE", source: "Exam boards / Maths Links", description: "Find routes to published grade-boundary information from the relevant exam boards.", url: "https://www.mathslinks.co.uk/gcse-grade-boundaries", priority: 40 },
  { id: "timetable", title: "GCSE maths timetable", collection: "exams", type: "Exam information", level: "GCSE", source: "Maths Links", description: "Check the current timetable page, then confirm dates with your school and exam board.", url: "https://www.mathslinks.co.uk/2026-gcse-timetable", priority: 41 },
  { id: "printed-papers", title: "Printed past papers", collection: "exams", type: "Print service", level: "GCSE", source: "Maths Links", description: "Review the original page for information about obtaining printed paper packs.", url: "https://www.mathslinks.co.uk/printed-past-papers", priority: 42 },

  { id: "grids", title: "Interactive maths grids", collection: "tools", type: "Interactive hub", level: "Foundation", source: "Maths Links", description: "Open a set of classroom-friendly grid activities designed for quick repeated practice.", url: "https://www.mathslinks.co.uk/grids", priority: 50 },
  { id: "four-operations", title: "Four-operations grid", collection: "tools", type: "Interactive grid", level: "Foundation", source: "Maths Links", description: "Practise addition, subtraction, multiplication and division through a flexible number grid.", url: "https://www.mathslinks.co.uk/grids/four-operations-grid", priority: 51 },
  { id: "rounding-grid", title: "Rounding grid", collection: "tools", type: "Interactive grid", level: "Foundation", source: "Maths Links", description: "Generate short rounding prompts for mental practice, teaching or retrieval work.", url: "https://www.mathslinks.co.uk/grids/rounding-grid", priority: 52 },
  { id: "fractions-grid", title: "Fractions grid", collection: "tools", type: "Interactive grid", level: "Foundation", source: "Maths Links", description: "Use a visual grid route for practising core fraction operations and understanding.", url: "https://www.mathslinks.co.uk/grids/fractions-grid", priority: 53 },
  { id: "quizzes", title: "Self-marking maths quizzes", collection: "tools", type: "Quick check", level: "GCSE", source: "Maths Links", description: "Check one topic quickly with short multiple-choice quizzes that mark responses on screen.", url: "https://www.mathslinks.co.uk/maths-quizzes", priority: 54 },

  { id: "maths-genie", title: "Maths Genie route", collection: "providers", type: "Resource provider", level: "GCSE", source: "Maths Genie / Maths Links", description: "Reach the directory route for Maths Genie worksheets, answers and topic resources.", url: "https://www.mathslinks.co.uk/worksheets/maths-genie", priority: 60 },
  { id: "corbett", title: "Corbettmaths route", collection: "providers", type: "Resource provider", level: "KS3–GCSE", source: "Corbettmaths / Maths Links", description: "Reach the directory route for Corbettmaths practice, textbook exercises and answers.", url: "https://www.mathslinks.co.uk/worksheets/corbett-maths", priority: 61 },
  { id: "five-a-day", title: "Corbett 5-a-day", collection: "providers", type: "Daily practice", level: "Numeracy–Higher", source: "Corbettmaths / Maths Links", description: "Use short daily mixed sets to maintain fluency across a range of difficulty levels.", url: "https://www.mathslinks.co.uk/worksheets/corbett-5-a-day", priority: 62 },
  { id: "first-class", title: "1st Class Maths route", collection: "providers", type: "Resource provider", level: "GCSE", source: "1st Class Maths / Maths Links", description: "Reach topic worksheets and exam-board-specific resources from 1st Class Maths.", url: "https://www.mathslinks.co.uk/worksheets/1st-class-maths", priority: 63 },
  { id: "metatutor", title: "Metatutor route", collection: "providers", type: "Resource provider", level: "GCSE", source: "Metatutor / Maths Links", description: "Open the Maths Links route into Metatutor’s topic-based learning resources.", url: "https://www.mathslinks.co.uk/worksheets/metatutor", priority: 64 },
  { id: "dr-austin", title: "Dr Austin Maths route", collection: "providers", type: "Resource provider", level: "GCSE", source: "Dr Austin Maths / Maths Links", description: "Reach carefully structured worksheets covering algebra, number, geometry and statistics.", url: "https://www.mathslinks.co.uk/worksheets/dr-austin", priority: 65 },
  { id: "maths-diy", title: "Maths DIY route", collection: "providers", type: "Resource provider", level: "GCSE", source: "Maths DIY / Maths Links", description: "Open the directory route for Maths DIY questions, answers and topic practice.", url: "https://www.mathslinks.co.uk/worksheets/maths-diy", priority: 66 },
  { id: "m4ths", title: "M4THS.com route", collection: "providers", type: "Resource provider", level: "GCSE", source: "M4THS.com / Maths Links", description: "Reach the directory route for M4THS.com learning and practice resources.", url: "https://www.mathslinks.co.uk/worksheets/m4ths-com", priority: 67 },
  { id: "maths-room", title: "The Maths Room route", collection: "providers", type: "Resource provider", level: "GCSE & IGCSE", source: "The Maths Room / Maths Links", description: "Open topic teaching and practice routes from The Maths Room through the original directory.", url: "https://www.mathslinks.co.uk/worksheets/the-maths-room", priority: 68 },
  { id: "maths-takeaway", title: "Maths Takeaway route", collection: "providers", type: "Resource provider", level: "GCSE", source: "Maths Takeaway / Maths Links", description: "Reach Maths Takeaway question and answer routes while keeping the original publisher visible.", url: "https://www.mathslinks.co.uk/worksheets/maths-takeaway", priority: 69 },
  { id: "rocket", title: "GCSE Maths Rocket route", collection: "providers", type: "Resource provider", level: "GCSE", source: "GCSE Maths Rocket / Maths Links", description: "Open focused GCSE worksheet routes from GCSE Maths Rocket through the directory.", url: "https://www.mathslinks.co.uk/worksheets/gcse-maths-rocket", priority: 70 },
  { id: "cognito", title: "Cognito route", collection: "providers", type: "Resource provider", level: "GCSE", source: "Cognito / Maths Links", description: "Reach Cognito learning pages and topic resources from the original Maths Links route.", url: "https://www.mathslinks.co.uk/worksheets/cognito", priority: 71 }
];

const grid = document.querySelector("[data-library-grid]");
const search = document.querySelector("[data-library-search]");
const sort = document.querySelector("[data-sort]");
const filters = [...document.querySelectorAll("[data-library-filter]")];
const routeButtons = [...document.querySelectorAll("[data-route]")];
const savedFilter = document.querySelector("[data-saved-filter]");
const resultCount = document.querySelector("[data-results-count]");
const empty = document.querySelector("[data-library-empty]");
const clearButtons = [...document.querySelectorAll("[data-clear-filters], [data-empty-clear]")];
const toast = document.querySelector("[data-saved-toast]");
let collection = "all";
let savedOnly = false;
let saved;
try {
  const storedRoutes = JSON.parse(localStorage.getItem("abirs-academy-saved") || "[]");
  saved = new Set(Array.isArray(storedRoutes) ? storedRoutes : []);
} catch {
  saved = new Set();
}
let toastTimer;

const collectionNames = {
  start: "Start here", learn: "Learn", practice: "Practice", exams: "Exam prep",
  tools: "Tool", providers: "Provider"
};

function safeText(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  })[character]);
}

function updateSavedUI() {
  document.querySelector("[data-saved-count]").textContent = saved.size;
  savedFilter.setAttribute("aria-pressed", String(savedOnly));
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function visibleResources() {
  const query = search.value.trim().toLowerCase();
  let items = libraryResources.filter((resource) => {
    const matchesCollection = collection === "all" || resource.collection === collection;
    const matchesSaved = !savedOnly || saved.has(resource.id);
    const searchable = `${resource.title} ${resource.description} ${resource.type} ${resource.level} ${resource.source}`.toLowerCase();
    return matchesCollection && matchesSaved && searchable.includes(query);
  });
  if (sort.value === "az") items.sort((a, b) => a.title.localeCompare(b.title));
  if (sort.value === "source") items.sort((a, b) => a.source.localeCompare(b.source) || a.title.localeCompare(b.title));
  if (sort.value === "recommended") items.sort((a, b) => a.priority - b.priority);
  return items;
}

function render() {
  const items = visibleResources();
  resultCount.textContent = items.length;
  empty.hidden = items.length > 0;
  grid.hidden = items.length === 0;
  document.querySelector("[data-clear-filters]").hidden = collection === "all" && !savedOnly && !search.value;
  grid.innerHTML = items.map((resource) => {
    const isSaved = saved.has(resource.id);
    return `
      <article class="library-item">
        <div class="library-item-top">
          <span class="library-item-type">${safeText(collectionNames[resource.collection])}</span>
          <button class="save-button${isSaved ? " is-saved" : ""}" type="button" data-save="${resource.id}" aria-pressed="${isSaved}" aria-label="${isSaved ? "Remove" : "Save"} ${safeText(resource.title)}">${isSaved ? "★" : "☆"}</button>
        </div>
        <h3>${safeText(resource.title)}</h3>
        <p>${safeText(resource.description)}</p>
        <div class="item-meta"><span>${safeText(resource.type)}</span><span>${safeText(resource.level)}</span></div>
        <div class="item-bottom">
          <small>${safeText(resource.source)}</small>
          <a href="${resource.url}" target="_blank" rel="noopener noreferrer">Open source <span aria-hidden="true">↗</span></a>
        </div>
      </article>`;
  }).join("");
  grid.querySelectorAll("[data-save]").forEach((button) => button.addEventListener("click", toggleSaved));
  updateSavedUI();
}

function toggleSaved(event) {
  const id = event.currentTarget.dataset.save;
  const resource = libraryResources.find((item) => item.id === id);
  if (saved.has(id)) {
    saved.delete(id);
    showToast(`Removed “${resource.title}” from saved routes`);
  } else {
    saved.add(id);
    showToast(`Saved “${resource.title}” on this device`);
  }
  localStorage.setItem("abirs-academy-saved", JSON.stringify([...saved]));
  render();
}

function setCollection(nextCollection, shouldScroll = false) {
  collection = nextCollection;
  savedOnly = false;
  filters.forEach((button) => button.classList.toggle("is-active", button.dataset.libraryFilter === collection));
  render();
  if (shouldScroll) document.querySelector("#library-browser").scrollIntoView({ behavior: "smooth" });
}

filters.forEach((button) => button.addEventListener("click", () => setCollection(button.dataset.libraryFilter)));
routeButtons.forEach((button) => button.addEventListener("click", () => setCollection(button.dataset.route, true)));
search.addEventListener("input", render);
sort.addEventListener("change", render);
savedFilter.addEventListener("click", () => { savedOnly = !savedOnly; render(); });
clearButtons.forEach((button) => button.addEventListener("click", () => {
  search.value = "";
  savedOnly = false;
  setCollection("all");
}));
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  }
});

document.querySelector("[data-total-count]").textContent = libraryResources.length;
document.querySelector("[data-count-for='all']").textContent = libraryResources.length;
["start", "learn", "practice", "exams", "tools", "providers"].forEach((name) => {
  document.querySelector(`[data-count-for='${name}']`).textContent = libraryResources.filter((item) => item.collection === name).length;
});

const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
});
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  menuToggle.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}));

const header = document.querySelector("[data-header]");
const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const observer = new IntersectionObserver((entries, revealObserver) => entries.forEach((entry) => {
  if (entry.isIntersecting) {
    entry.target.classList.add("is-visible");
    revealObserver.unobserve(entry.target);
  }
}), { threshold: .12 });
document.querySelectorAll(".reveal:not(.is-visible)").forEach((item) => observer.observe(item));
document.querySelector("[data-year]").textContent = new Date().getFullYear();
updateSavedUI();
render();
