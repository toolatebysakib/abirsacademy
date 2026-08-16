let libraryResources = [];

const grid = document.querySelector("[data-library-grid]");
const search = document.querySelector("[data-library-search]");
const sort = document.querySelector("[data-sort]");
const gradeFilters = [...document.querySelectorAll("[data-library-filter]")];
const tierFilters = [...document.querySelectorAll("[data-tier-filter]")];
const routeButtons = [...document.querySelectorAll(".nav-item[data-library-filter], [data-route]")];
const savedFilter = document.querySelector("[data-saved-filter]");
const resultCount = document.querySelector("[data-results-count]");
const empty = document.querySelector("[data-library-empty]");
const clearButtons = [...document.querySelectorAll("[data-clear-filters], [data-empty-clear]")];
const toast = document.querySelector("[data-saved-toast]");

let filterGrade = "all";
let filterTier = "all";
let filterSubject = "all";
let savedOnly = false;
let saved;
try {
  const storedRoutes = JSON.parse(localStorage.getItem("abirs-academy-saved") || "[]");
  saved = new Set(Array.isArray(storedRoutes) ? storedRoutes : []);
} catch {
  saved = new Set();
}
let toastTimer;

function safeText(value) {
  if (!value) return "";
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  })[character]);
}

function updateSavedUI() {
  if(document.querySelector("[data-saved-count]")) document.querySelector("[data-saved-count]").textContent = saved.size;
  if(savedFilter) savedFilter.setAttribute("aria-pressed", String(savedOnly));
}

function showToast(message) {
  if(!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

async function fetchResources() {
  const q = search ? search.value.trim() : "";
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (filterGrade !== "all") params.set("grade", filterGrade);
  if (filterTier !== "all") params.set("tier", filterTier);
  if (savedOnly) {
      params.set("savedOnly", "true");
      params.set("saved", Array.from(saved).join(','));
  }

  try {
      if (grid) grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #888;">Loading resources...</div>';
      const response = await fetch('/api/search?' + params.toString());
      if (!response.ok) throw new Error("API Error");
      return await response.json();
  } catch (err) {
      console.error(err);
      return { total: 0, results: [] };
  }
}

async function render() {
  const data = await fetchResources();
  const items = data.results || [];
  
  if (resultCount) resultCount.textContent = items.length;
  if (empty) empty.hidden = items.length > 0;
  if (grid) grid.hidden = items.length === 0;
  
  const hasActiveFilters = filterGrade !== "all" || filterTier !== "all" || filterSubject !== "all" || savedOnly || (search && search.value);
  const clearBtns = document.querySelectorAll("[data-clear-filters]");
  clearBtns.forEach(btn => btn.hidden = !hasActiveFilters);
  
  if (grid) {
      grid.innerHTML = "";
      grid.style.display = "grid";
      let html = "";
      items.forEach(resource => {
          const isSaved = saved.has(resource.id);
          const iconClass = resource.subject.toLowerCase().includes('sci') ? 'icon-sci' : 'icon-math';
          const iconChar = resource.subject.toLowerCase().includes('sci') ? '&#128300;' : '&#8721;';
          
          html += `
          <article class="dash-card reveal is-visible">
            <div class="dash-card-icon ${iconClass}">${iconChar}</div>
            <h3>${safeText(resource.title)}</h3>
            <div class="dash-card-meta">
              <span>&#128193;</span> ${safeText(resource.subject)}
            </div>
            <div class="dash-card-tier">
              <span>&#9873;</span> Grade ${resource.grade} ${parseInt(resource.grade) <= 5 ? "Foundation" : "Higher"}
            </div>
            <div class="dash-card-actions">
              ${resource.hasWorksheet ? `<a href="/api/resource?id=${resource.id}&type=worksheet" class="dash-btn" target="_blank">View Worksheet</a>` : ''}
              ${resource.hasSolution ? `<a href="/api/resource?id=${resource.id}&type=solution" class="dash-btn" target="_blank">View Solution</a>` : ''}
            </div>
          </article>`;
      });
      grid.innerHTML = html;
  }
}

function updateActiveFilter(buttons, activeValue, dataAttr) {
  buttons.forEach((button) => {
    const val = button.getAttribute(dataAttr);
    button.classList.toggle("is-active", val === activeValue);
  });
}

function setGradeFilter(value) { filterGrade = value; updateActiveFilter(gradeFilters, value, "data-library-filter"); render(); }
function setTierFilter(value) { filterTier = value; updateActiveFilter(tierFilters, value, "data-tier-filter"); render(); }

gradeFilters.forEach((button) => {
  button.addEventListener("click", () => setGradeFilter(button.getAttribute("data-library-filter")));
});
tierFilters.forEach((button) => {
  button.addEventListener("click", () => setTierFilter(button.getAttribute("data-tier-filter")));
});

routeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const route = button.getAttribute("data-library-filter") || button.getAttribute("data-route");
    if(route && route.startsWith("grade-")) {
        setGradeFilter(route);
    } else if (route === "all") {
        setGradeFilter("all");
    }
    if (search) search.value = "";
    savedOnly = false;
  });
});

if(search) search.addEventListener("input", render);
if(sort) sort.addEventListener("change", render);
if(savedFilter) savedFilter.addEventListener("click", () => { savedOnly = !savedOnly; render(); });

clearButtons.forEach((button) => button.addEventListener("click", () => {
  if (search) search.value = "";
  savedOnly = false;
  setGradeFilter("all");
  setTierFilter("all");
}));

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && search && document.activeElement !== search) {
    event.preventDefault();
    search.focus();
  }
});

// Update total counts silently
if (document.querySelector("[data-total-count]")) {
   // Because we are fetching asynchronously, we will just fetch everything once or hardcode the count for now
   document.querySelector("[data-total-count]").textContent = "462";
}

const header = document.querySelector("[data-header]");
const updateHeader = () => { if(header) header.classList.toggle("is-scrolled", window.scrollY > 12); }
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

if(document.querySelector("[data-year]")) document.querySelector("[data-year]").textContent = new Date().getFullYear();

updateSavedUI();
render();
