const PAGE_SIZE = 24;
const SAVED_KEY = "abirs-academy-saved";

const elements = {
  grid: document.querySelector("[data-library-grid]"),
  search: document.querySelector("[data-library-search]"),
  searchClear: document.querySelector("[data-search-clear]"),
  gradeFilters: [...document.querySelectorAll("[data-library-filter]")],
  tierFilters: [...document.querySelectorAll("[data-tier-filter]")],
  savedFilter: document.querySelector("[data-saved-filter]"),
  savedCount: document.querySelector("[data-saved-count]"),
  summary: document.querySelector("[data-results-summary]"),
  empty: document.querySelector("[data-library-empty]"),
  error: document.querySelector("[data-library-error]"),
  clearButtons: [...document.querySelectorAll("[data-clear-filters], [data-empty-clear]")],
  retry: document.querySelector("[data-retry]"),
  loadMore: document.querySelector("[data-load-more]"),
  loadMoreWrap: document.querySelector("[data-load-more-wrap]"),
  toast: document.querySelector("[data-saved-toast]"),
  sidebar: document.querySelector("[data-sidebar]"),
  sidebarToggle: document.querySelector("[data-sidebar-toggle]"),
  sidebarScrim: document.querySelector("[data-sidebar-scrim]"),
};

const state = {
  grade: "all",
  tier: "all",
  savedOnly: false,
  query: "",
  page: 1,
  total: 0,
  hasMore: false,
  requestNumber: 0,
  controller: null,
};

let saved = new Set();
let searchTimer;
let toastTimer;

const initialParams = new URLSearchParams(window.location.search);
const initialGrade = initialParams.get("grade");
const initialTier = initialParams.get("tier");
if (initialGrade && /^(all|grade-[1-9])$/.test(initialGrade)) state.grade = initialGrade;
if (initialTier && new Set(["Foundation", "Higher"]).has(initialTier)) state.tier = initialTier;
state.savedOnly = initialParams.get("saved") === "true";
state.query = (initialParams.get("q") || "").trim().slice(0, 120);
elements.search.value = state.query;

try {
  const stored = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
  saved = new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : []);
} catch {
  saved = new Set();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#039;",
    '"': "&quot;",
  })[character]);
}

function pluralise(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
}

function persistSaved() {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...saved]));
  } catch {
    showToast("This browser could not save the resource.");
  }
}

function updateSavedUI() {
  elements.savedCount.textContent = saved.size;
  elements.savedFilter.setAttribute("aria-pressed", String(state.savedOnly));
  elements.savedFilter.classList.toggle("is-active", state.savedOnly);
  document.querySelectorAll("[data-save-resource]").forEach((button) => {
    const isSaved = saved.has(button.dataset.saveResource);
    button.classList.toggle("is-saved", isSaved);
    button.setAttribute("aria-pressed", String(isSaved));
    button.setAttribute("aria-label", isSaved ? "Remove from saved resources" : "Save this resource");
    button.title = isSaved ? "Remove from saved resources" : "Save this resource";
  });
}

function editorUrl(resource, type) {
  const params = new URLSearchParams({
    id: resource.id,
    type,
    title: resource.title,
  });
  return `pdf-studio.html?${params}`;
}

function cardTemplate(resource) {
  const isSaved = saved.has(resource.id);
  const topic = resource.topic || "General mathematics";
  const worksheet = resource.hasWorksheet
    ? `<a href="${editorUrl(resource, "worksheet")}" class="dash-btn dash-btn-primary" target="_blank" rel="noopener"><span aria-hidden="true">W</span> Study worksheet</a>`
    : "";
  const solution = resource.hasSolution
    ? `<a href="${editorUrl(resource, "solution")}" class="dash-btn" target="_blank" rel="noopener"><span aria-hidden="true">S</span> View solution</a>`
    : "";

  return `
    <article class="dash-card" data-resource-card="${escapeHtml(resource.id)}">
      <div class="dash-card-top">
        <span class="dash-card-grade">Grade ${escapeHtml(resource.grade)}</span>
        <button
          class="save-resource${isSaved ? " is-saved" : ""}"
          type="button"
          data-save-resource="${escapeHtml(resource.id)}"
          aria-pressed="${isSaved}"
          aria-label="${isSaved ? "Remove from saved resources" : "Save this resource"}"
          title="${isSaved ? "Remove from saved resources" : "Save this resource"}"
        ><span aria-hidden="true">&#9733;</span></button>
      </div>
      <p class="dash-card-topic">${escapeHtml(topic)}</p>
      <h2>${escapeHtml(resource.title)}</h2>
      <p class="dash-card-description">${escapeHtml(resource.description)}</p>
      <div class="dash-card-meta">
        <span>${escapeHtml(resource.tier)}</span>
        <span>${escapeHtml(resource.board)}</span>
      </div>
      <div class="dash-card-actions">${worksheet}${solution}</div>
    </article>`;
}

function skeletons() {
  return Array.from({ length: 8 }, () => `
    <div class="dash-card skeleton-card" aria-hidden="true">
      <span></span><span></span><span></span><span></span>
    </div>`).join("");
}

function updateFilterUI() {
  elements.gradeFilters.forEach((button) => {
    const active = button.dataset.libraryFilter === state.grade;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  elements.tierFilters.forEach((button) => {
    const active = button.dataset.tierFilter === state.tier;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const hasFilters = state.grade !== "all" || state.tier !== "all" || state.savedOnly || Boolean(state.query);
  document.querySelectorAll("[data-clear-filters]").forEach((button) => { button.hidden = !hasFilters; });
  elements.searchClear.hidden = !elements.search.value;
  updateSavedUI();
}

function updateFacets(data) {
  document.querySelector("[data-total-count]").textContent = data.catalogueTotal;
  document.querySelector("[data-grade-count='all']").textContent = data.catalogueTotal;
  document.querySelectorAll("[data-grade-count]").forEach((label) => {
    if (label.dataset.gradeCount === "all") return;
    const count = data.facets.grades[label.dataset.gradeCount] || 0;
    label.textContent = count;
    const button = label.closest("button");
    button.disabled = count === 0;
    if (count === 0) button.title = `No Grade ${label.dataset.gradeCount} resources are available yet`;
  });
  document.querySelectorAll("[data-tier-count]").forEach((label) => {
    const tier = label.dataset.tierCount;
    label.textContent = data.facets.tiers[tier] || 0;
  });
}

function updateResultState() {
  const visible = elements.grid.childElementCount;
  elements.summary.textContent = state.total
    ? `Showing ${visible} of ${state.total} matching ${pluralise(state.total, "resource")}`
    : "No matching resources";
  elements.empty.hidden = state.total !== 0;
  elements.grid.hidden = state.total === 0;
  elements.loadMoreWrap.hidden = !state.hasMore;
  elements.loadMore.disabled = false;
  elements.loadMore.textContent = "Load more resources";
}

function requestParams(page) {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (state.query) params.set("q", state.query);
  if (state.grade !== "all") params.set("grade", state.grade);
  if (state.tier !== "all") params.set("tier", state.tier);
  if (state.savedOnly) {
    params.set("savedOnly", "true");
    params.set("saved", [...saved].join(","));
  }
  return params;
}

async function loadResources({ append = false } = {}) {
  const requestNumber = ++state.requestNumber;
  state.controller?.abort();
  state.controller = new AbortController();
  elements.error.hidden = true;
  elements.grid.setAttribute("aria-busy", "true");

  if (!append) {
    elements.grid.hidden = false;
    elements.empty.hidden = true;
    elements.loadMoreWrap.hidden = true;
    elements.grid.innerHTML = skeletons();
  } else {
    elements.loadMore.disabled = true;
    elements.loadMore.textContent = "Loading...";
  }

  try {
    const response = await fetch(`/api/search?${requestParams(state.page)}`, {
      headers: { Accept: "application/json" },
      signal: state.controller.signal,
    });
    if (!response.ok) throw new Error(`Resource API returned ${response.status}`);
    const data = await response.json();
    if (requestNumber !== state.requestNumber) return;

    if (!append) elements.grid.innerHTML = "";
    elements.grid.insertAdjacentHTML("beforeend", data.results.map(cardTemplate).join(""));
    state.total = data.total;
    state.hasMore = data.hasMore;
    updateFacets(data);
    updateResultState();
    updateSavedUI();
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error(error);
    if (!append) elements.grid.innerHTML = "";
    elements.grid.hidden = true;
    elements.empty.hidden = true;
    elements.loadMoreWrap.hidden = true;
    elements.error.hidden = false;
    elements.summary.textContent = "Resource catalogue unavailable";
  } finally {
    if (requestNumber === state.requestNumber) elements.grid.setAttribute("aria-busy", "false");
  }
}

function resetAndLoad() {
  state.page = 1;
  updateFilterUI();
  loadResources();
}

function clearFilters() {
  clearTimeout(searchTimer);
  elements.search.value = "";
  state.query = "";
  state.grade = "all";
  state.tier = "all";
  state.savedOnly = false;
  resetAndLoad();
}

function closeSidebar({ restoreFocus = false } = {}) {
  document.body.classList.remove("sidebar-open");
  elements.sidebarToggle.setAttribute("aria-expanded", "false");
  elements.sidebarToggle.querySelector(".sr-only").textContent = "Open library filters";
  if (restoreFocus) elements.sidebarToggle.focus();
}

elements.gradeFilters.forEach((button) => {
  button.addEventListener("click", () => {
    state.grade = button.dataset.libraryFilter;
    resetAndLoad();
    closeSidebar();
  });
});

elements.tierFilters.forEach((button) => {
  button.addEventListener("click", () => {
    state.tier = button.dataset.tierFilter;
    resetAndLoad();
  });
});

elements.savedFilter.addEventListener("click", () => {
  state.savedOnly = !state.savedOnly;
  resetAndLoad();
  closeSidebar();
});

elements.search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  elements.searchClear.hidden = !elements.search.value;
  searchTimer = setTimeout(() => {
    state.query = elements.search.value.trim().slice(0, 120);
    resetAndLoad();
  }, 220);
});

elements.searchClear.addEventListener("click", () => {
  clearTimeout(searchTimer);
  elements.search.value = "";
  state.query = "";
  elements.search.focus();
  resetAndLoad();
});

elements.grid.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-resource]");
  if (!saveButton) return;
  const id = saveButton.dataset.saveResource;
  const wasSaved = saved.has(id);
  if (wasSaved) saved.delete(id); else saved.add(id);
  persistSaved();
  updateSavedUI();
  showToast(wasSaved ? "Removed from saved resources" : "Saved for later");
  if (state.savedOnly && wasSaved) resetAndLoad();
});

elements.loadMore.addEventListener("click", () => {
  if (!state.hasMore) return;
  state.page += 1;
  loadResources({ append: true });
});

elements.clearButtons.forEach((button) => button.addEventListener("click", clearFilters));
elements.retry.addEventListener("click", () => loadResources());

elements.sidebarToggle.addEventListener("click", () => {
  const open = elements.sidebarToggle.getAttribute("aria-expanded") !== "true";
  document.body.classList.toggle("sidebar-open", open);
  elements.sidebarToggle.setAttribute("aria-expanded", String(open));
  elements.sidebarToggle.querySelector(".sr-only").textContent = open ? "Close library filters" : "Open library filters";
  if (open) elements.sidebar.querySelector("button:not(:disabled)")?.focus();
});
elements.sidebarScrim.addEventListener("click", () => closeSidebar({ restoreFocus: true }));

document.addEventListener("keydown", (event) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    elements.search.focus();
  }
  if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
    closeSidebar({ restoreFocus: true });
  }
});

window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
  if (event.matches) closeSidebar();
});

updateFilterUI();
loadResources();
if (initialParams.get("focus") === "search") requestAnimationFrame(() => elements.search.focus());
