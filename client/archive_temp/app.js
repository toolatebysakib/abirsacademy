const resources = [
  {
    title: "GCSE questions by topic",
    category: "topic",
    tag: "Foundation → Higher",
    description: "Browse a broad, grade-organised directory of question sets, answers, videos and guides.",
    source: "Maths Links · Kenneth Stafford",
    url: "https://www.mathslinks.co.uk/gcse-questions-by-topic"
  },
  {
    title: "Search the resource finder",
    category: "topic",
    tag: "Search tool",
    description: "Search the Maths Links catalogue by topic or approximate GCSE grade.",
    source: "Maths Links · Kenneth Stafford",
    url: "https://www.mathslinks.co.uk/resource-finder"
  },
  {
    title: "Build a revision pack",
    category: "practice",
    tag: "Planning tool",
    description: "Select several topics and organise links into a focused revision route.",
    source: "Maths Links · Kenneth Stafford",
    url: "https://www.mathslinks.co.uk/resource-organiser"
  },
  {
    title: "Interleaving practice",
    category: "practice",
    tag: "Mixed practice",
    description: "Switch between topics to practise recognising which mathematical method is needed.",
    source: "Maths Links · Kenneth Stafford",
    url: "https://www.mathslinks.co.uk/interleaving-resources"
  },
  {
    title: "GCSE past-paper routes",
    category: "exam",
    tag: "Exam prep",
    description: "Find past-paper routes for Edexcel, AQA, OCR, Eduqas and IGCSE qualifications.",
    source: "Maths Links · Kenneth Stafford",
    url: "https://www.mathslinks.co.uk/past-papers"
  },
  {
    title: "Practice papers",
    category: "exam",
    tag: "Timed practice",
    description: "Open the original publisher page for practice papers and worked solutions.",
    source: "Maths Links · Kenneth Stafford",
    url: "https://www.mathslinks.co.uk/practice-papers"
  },
  {
    title: "Topic quizzes",
    category: "practice",
    tag: "Quick check",
    description: "Use short, self-marking quizzes to check understanding before deeper practice.",
    source: "Maths Links · Kenneth Stafford",
    url: "https://www.mathslinks.co.uk/maths-quizzes"
  },
  {
    title: "How to use Maths Links",
    category: "topic",
    tag: "Study guide",
    description: "Read the creator’s own guidance for combining topic work, past papers and interleaving.",
    source: "Maths Links · Kenneth Stafford",
    url: "https://www.mathslinks.co.uk/how-to-use-mathslinks"
  },
  {
    title: "Desmos graphing calculator",
    category: "practice",
    tag: "Interactive tool",
    description: "Explore graphs, transformations and equations with a free interactive calculator.",
    source: "Desmos",
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

  resourceGrid.innerHTML = matches.map((resource) => `
    <article class="resource-card">
      <div class="resource-card-top">
        <span class="resource-tag">${escapeHtml(resource.tag)}</span>
        <span class="resource-arrow" aria-hidden="true">↗</span>
      </div>
      <h3>${escapeHtml(resource.title)}</h3>
      <p>${escapeHtml(resource.description)}</p>
      <a href="${resource.url}" target="_blank" rel="noopener noreferrer">
        Open original resource <span class="sr-only">: ${escapeHtml(resource.title)}</span>
      </a>
      <span class="resource-source">Source: ${escapeHtml(resource.source)}</span>
    </article>
  `).join("");

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
