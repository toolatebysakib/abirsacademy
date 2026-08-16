const resources = [
  {
    title: "GCSE worksheets by grade",
    category: "topic",
    tag: "Grades 1–8",
    description: "Browse the full collection of grade-organised worksheets and matched solutions.",
    source: "Abir's Academy",
    action: "Browse the library",
    url: "library.html"
  },
  {
    title: "Search the resource library",
    category: "topic",
    tag: "Search tool",
    description: "Find a topic, keyword, grade or tier without scanning hundreds of cards.",
    source: "Abir's Academy",
    action: "Start searching",
    url: "library.html?focus=search"
  },
  {
    title: "Build a revision pack",
    category: "practice",
    tag: "Saved resources",
    description: "Star useful worksheets, keep a focused shortlist and return to it on this device.",
    source: "Abir's Academy",
    action: "Open saved resources",
    url: "library.html?saved=true"
  },
  {
    title: "Foundation practice",
    category: "practice",
    tag: "Grades 1–5",
    description: "Build confidence with focused practice across the full Foundation route.",
    source: "Abir's Academy",
    action: "See Foundation work",
    url: "library.html?tier=Foundation"
  },
  {
    title: "Higher exam practice",
    category: "exam",
    tag: "Grades 6–8",
    description: "Move into demanding Higher-tier topics with worksheets and worked solutions.",
    source: "Abir's Academy",
    action: "See Higher work",
    url: "library.html?tier=Higher"
  },
  {
    title: "PDF Study Studio",
    category: "exam",
    tag: "Annotate & download",
    description: "Write, draw and highlight directly over a worksheet, then download your own copy.",
    source: "Abir's Academy",
    action: "Choose a PDF",
    url: "library.html"
  },
  {
    title: "Worked solutions",
    category: "practice",
    tag: "Check your method",
    description: "Open a matching solution beside most worksheets and learn from every correction.",
    source: "Abir's Academy",
    action: "Browse worksheets",
    url: "library.html"
  },
  {
    title: "One-hour study loop",
    category: "topic",
    tag: "Study guide",
    description: "Use recall, learning, practice and reflection to make one focused hour count.",
    source: "Abir's Academy",
    action: "See the study route",
    url: "#study-plan"
  },
  {
    title: "Desmos graphing calculator",
    category: "practice",
    tag: "Interactive tool",
    description: "Explore graphs, transformations and equations with a free interactive calculator.",
    source: "Desmos",
    action: "Open Desmos",
    url: "https://www.desmos.com/calculator"
  }
];

const resourceGrid = document.querySelector("[data-resource-grid]");
const searchInput = document.querySelector("[data-search]");
const filterButtons = [...document.querySelectorAll("[data-filter]")];
const emptyState = document.querySelector("[data-empty]");
let activeFilter = "all";

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  })[character]);
}

function renderResources() {
  const query = searchInput.value.trim().toLowerCase();
  const matches = resources.filter((resource) => {
    const inCategory = activeFilter === "all" || resource.category === activeFilter;
    const searchable = `${resource.title} ${resource.description} ${resource.tag} ${resource.source}`.toLowerCase();
    return inCategory && searchable.includes(query);
  });

  resourceGrid.innerHTML = matches.map((resource) => {
    const external = /^https?:\/\//.test(resource.url);
    return `
    <article class="resource-card">
      <div class="resource-card-top">
        <span class="resource-tag">${escapeHtml(resource.tag)}</span>
        <span class="resource-arrow" aria-hidden="true">↗</span>
      </div>
      <h3>${escapeHtml(resource.title)}</h3>
      <p>${escapeHtml(resource.description)}</p>
      <a href="${resource.url}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>
        ${escapeHtml(resource.action)} <span class="sr-only">: ${escapeHtml(resource.title)}</span>
      </a>
      <span class="resource-source">Source: ${escapeHtml(resource.source)}</span>
    </article>
  `;
  }).join("");

  emptyState.hidden = matches.length !== 0;
}

searchInput.addEventListener("input", renderResources);
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
    renderResources();
  });
});
renderResources();

const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  nav.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
});
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

const header = document.querySelector("[data-header]");
const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.13 });
document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const quizButtons = [...document.querySelectorAll("[data-answer]")];
const feedback = document.querySelector("[data-feedback]");
quizButtons.forEach((button) => {
  button.addEventListener("click", () => {
    quizButtons.forEach((item) => item.classList.remove("is-correct", "is-wrong"));
    const correct = button.dataset.answer === "21";
    button.classList.add(correct ? "is-correct" : "is-wrong");
    feedback.innerHTML = correct
      ? "<strong>Exactly.</strong> The sequence increases by 4 each time: 17 + 4 = 21."
      : "<strong>Try once more.</strong> Check the difference between each pair of neighbouring terms.";
  });
});

document.querySelector("[data-year]").textContent = new Date().getFullYear();
