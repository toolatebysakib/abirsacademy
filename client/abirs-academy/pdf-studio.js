import * as pdfjsLib from "./vendor/pdf.mjs?v=6.2.108";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdf.worker.mjs?v=6.2.108", import.meta.url).href;

const params = new URLSearchParams(window.location.search);
const resourceId = params.get("id") || "";
const resourceType = params.get("type") || "";
const requestedTitle = (params.get("title") || "Maths resource").trim().slice(0, 160);
const validRequest = /^[a-z0-9-]{3,80}$/i.test(resourceId) && new Set(["worksheet", "solution"]).has(resourceType);
const resourceUrl = `/api/resource?id=${encodeURIComponent(resourceId)}&type=${encodeURIComponent(resourceType)}`;
const storageKey = `abirs-pdf-notes-v1:${resourceId}:${resourceType}`;

const elements = {
  title: document.querySelector("[data-document-title]"),
  saveStatus: document.querySelector("[data-save-status]"),
  previousPage: document.querySelector("[data-previous-page]"),
  nextPage: document.querySelector("[data-next-page]"),
  pageInput: document.querySelector("[data-page-input]"),
  pageCount: document.querySelector("[data-page-count]"),
  zoomOut: document.querySelector("[data-zoom-out]"),
  zoomIn: document.querySelector("[data-zoom-in]"),
  zoomValue: document.querySelector("[data-zoom-value]"),
  fitWidth: document.querySelector("[data-fit-width]"),
  undo: document.querySelector("[data-undo]"),
  redo: document.querySelector("[data-redo]"),
  download: document.querySelector("[data-download]"),
  downloadLabel: document.querySelector("[data-download-label]"),
  workspace: document.querySelector("[data-workspace]"),
  loading: document.querySelector("[data-loading]"),
  loadingDetail: document.querySelector("[data-loading-detail]"),
  error: document.querySelector("[data-pdf-error]"),
  errorDetail: document.querySelector("[data-error-detail]"),
  retry: document.querySelector("[data-pdf-retry]"),
  stage: document.querySelector("[data-page-stage]"),
  pdfCanvas: document.querySelector("[data-pdf-canvas]"),
  annotationCanvas: document.querySelector("[data-annotation-canvas]"),
  toolButtons: [...document.querySelectorAll("[data-tool]")],
  colours: [...document.querySelectorAll("[data-colour]")],
  customColour: document.querySelector("[data-custom-colour]"),
  toolSize: document.querySelector("[data-tool-size]"),
  sizeLabel: document.querySelector("[data-size-label]"),
  pageAnnotationCount: document.querySelector("[data-page-annotation-count]"),
  totalAnnotationCount: document.querySelector("[data-total-annotation-count]"),
  clearPage: document.querySelector("[data-clear-page]"),
  clearDocument: document.querySelector("[data-clear-document]"),
  textDialog: document.querySelector("[data-text-dialog]"),
  textForm: document.querySelector("[data-text-form]"),
  textInput: document.querySelector("[data-text-input]"),
  closeText: document.querySelector("[data-close-text]"),
  cancelText: document.querySelector("[data-cancel-text]"),
  toast: document.querySelector("[data-studio-toast]"),
};

const state = {
  pdf: null,
  loadingTask: null,
  renderTask: null,
  renderNumber: 0,
  page: 1,
  zoom: 1,
  autoFit: true,
  tool: "hand",
  colour: "#153dff",
  size: 3,
  sizes: { hand: 3, pen: 3, marker: 20, text: 18, eraser: 16 },
  annotations: {},
  draft: null,
  drawing: false,
  erasing: false,
  eraserChanged: false,
  pendingTextPoint: null,
  history: [],
  historyIndex: -1,
  exporting: false,
};

let toastTimer;
let resizeTimer;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2400);
}

function pageAnnotations(pageNumber = state.page) {
  return state.annotations[String(pageNumber)] || [];
}

function totalAnnotations() {
  return Object.values(state.annotations).reduce((total, items) => total + items.length, 0);
}

function validPoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
}

function sanitiseAnnotations(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const clean = {};
  for (const [page, items] of Object.entries(value).slice(0, 500)) {
    if (!/^\d+$/.test(page) || !Array.isArray(items)) continue;
    const accepted = [];
    for (const item of items.slice(0, 500)) {
      if (!item || !new Set(["pen", "marker", "text"]).has(item.type)) continue;
      const colour = /^#[0-9a-f]{6}$/i.test(item.colour) ? item.colour : "#153dff";
      const size = clamp(Number(item.size) || 3, 1, 60);
      if (item.type === "text" && validPoint(item) && typeof item.text === "string") {
        accepted.push({ id: String(item.id || crypto.randomUUID()), type: "text", colour, size, x: item.x, y: item.y, text: item.text.slice(0, 500) });
      }
      if ((item.type === "pen" || item.type === "marker") && Array.isArray(item.points)) {
        const points = item.points.slice(0, 5000).filter(validPoint).map(({ x, y }) => ({ x, y }));
        if (points.length) accepted.push({ id: String(item.id || crypto.randomUUID()), type: item.type, colour, size, points });
      }
    }
    if (accepted.length) clean[page] = accepted;
  }
  return clean;
}

function loadSavedAnnotations() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    state.annotations = sanitiseAnnotations(saved?.annotations);
    if (totalAnnotations()) elements.saveStatus.textContent = "Restored notes saved on this device";
  } catch {
    state.annotations = {};
  }
  const initial = JSON.stringify(state.annotations);
  state.history = [initial];
  state.historyIndex = 0;
  updateAnnotationSummary();
  updateHistoryButtons();
}

function persistAnnotations() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, updatedAt: Date.now(), annotations: state.annotations }));
    elements.saveStatus.textContent = totalAnnotations() ? "Notes saved on this device" : "Ready to study";
  } catch {
    elements.saveStatus.textContent = "Notes could not be autosaved";
    showToast("Your browser storage is full. Download your PDF to keep these notes.");
  }
}

function commitHistory() {
  const snapshot = JSON.stringify(state.annotations);
  if (snapshot === state.history[state.historyIndex]) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snapshot);
  if (state.history.length > 60) state.history.shift();
  state.historyIndex = state.history.length - 1;
  persistAnnotations();
  updateAnnotationSummary();
  updateHistoryButtons();
}

function restoreHistory(index) {
  if (index < 0 || index >= state.history.length) return;
  state.historyIndex = index;
  state.annotations = sanitiseAnnotations(JSON.parse(state.history[index]));
  persistAnnotations();
  updateAnnotationSummary();
  updateHistoryButtons();
  drawAnnotationLayer();
}

function updateHistoryButtons() {
  elements.undo.disabled = state.historyIndex <= 0;
  elements.redo.disabled = state.historyIndex >= state.history.length - 1;
}

function updateAnnotationSummary() {
  const pageCount = pageAnnotations().length;
  const documentCount = totalAnnotations();
  elements.pageAnnotationCount.textContent = pageCount;
  elements.totalAnnotationCount.textContent = documentCount;
  elements.clearPage.disabled = pageCount === 0;
  elements.clearDocument.disabled = documentCount === 0;
}

function wrapText(context, text, maxWidth) {
  const lines = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = words.shift();
    for (const word of words) {
      const candidate = `${line} ${word}`;
      if (context.measureText(candidate).width <= maxWidth) line = candidate;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines.slice(0, 18);
}

function drawTextAnnotation(context, annotation, width, height, sizeScale) {
  const fontSize = annotation.size * sizeScale;
  const x = annotation.x * width;
  const y = annotation.y * height;
  const maxWidth = Math.max(fontSize * 5, width - x - 12 * sizeScale);
  context.font = `600 ${fontSize}px "Segoe UI", Arial, sans-serif`;
  context.textBaseline = "top";
  context.lineJoin = "round";
  const lines = wrapText(context, annotation.text, maxWidth);
  const lineHeight = fontSize * 1.28;
  const textWidth = Math.min(maxWidth, Math.max(...lines.map((line) => context.measureText(line || " ").width)));
  const textHeight = Math.max(lineHeight, lines.length * lineHeight);
  const padding = 4 * sizeScale;
  context.fillStyle = "rgba(255,255,255,0.88)";
  context.fillRect(x - padding, y - padding, textWidth + padding * 2, textHeight + padding * 1.5);
  context.fillStyle = annotation.colour;
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight, maxWidth));
}

function drawStrokeAnnotation(context, annotation, width, height, sizeScale) {
  const points = annotation.points;
  if (!points.length) return;
  context.strokeStyle = annotation.colour;
  context.fillStyle = annotation.colour;
  context.globalAlpha = annotation.type === "marker" ? 0.3 : 1;
  context.lineWidth = annotation.size * sizeScale;
  context.lineCap = "round";
  context.lineJoin = "round";
  if (points.length === 1) {
    context.beginPath();
    context.arc(points[0].x * width, points[0].y * height, context.lineWidth / 2, 0, Math.PI * 2);
    context.fill();
    return;
  }
  context.beginPath();
  context.moveTo(points[0].x * width, points[0].y * height);
  for (let index = 1; index < points.length - 1; index += 1) {
    const point = points[index];
    const next = points[index + 1];
    context.quadraticCurveTo(point.x * width, point.y * height, ((point.x + next.x) / 2) * width, ((point.y + next.y) / 2) * height);
  }
  const last = points.at(-1);
  context.lineTo(last.x * width, last.y * height);
  context.stroke();
}

function drawAnnotations(context, annotations, width, height, sizeScale, draft = null) {
  context.save();
  for (const annotation of [...annotations, ...(draft ? [draft] : [])]) {
    context.save();
    if (annotation.type === "text") drawTextAnnotation(context, annotation, width, height, sizeScale);
    else drawStrokeAnnotation(context, annotation, width, height, sizeScale);
    context.restore();
  }
  context.restore();
}

function drawAnnotationLayer() {
  const canvas = elements.annotationCanvas;
  if (!canvas.width || !canvas.height) return;
  const context = canvas.getContext("2d");
  const ratio = canvas.width / Number.parseFloat(canvas.style.width || canvas.width);
  const width = Number.parseFloat(canvas.style.width);
  const height = Number.parseFloat(canvas.style.height);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  drawAnnotations(context, pageAnnotations(), width, height, state.zoom, state.draft);
  updateAnnotationSummary();
}

function setCanvasInteraction() {
  const drawingTool = state.tool !== "hand";
  elements.annotationCanvas.style.pointerEvents = drawingTool ? "auto" : "none";
  elements.annotationCanvas.style.cursor = ({ pen: "crosshair", marker: "crosshair", text: "text", eraser: "cell" })[state.tool] || "default";
}

function setTool(tool) {
  if (!state.sizes[tool]) return;
  state.sizes[state.tool] = state.size;
  state.tool = tool;
  state.size = state.sizes[tool];
  elements.toolSize.value = state.size;
  elements.sizeLabel.textContent = state.size;
  elements.toolSize.disabled = tool === "hand" || tool === "eraser";
  elements.toolButtons.forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  setCanvasInteraction();
}

function updatePageControls() {
  if (!state.pdf) return;
  elements.pageInput.value = state.page;
  elements.pageInput.max = state.pdf.numPages;
  elements.pageCount.textContent = state.pdf.numPages;
  elements.previousPage.disabled = state.page <= 1;
  elements.nextPage.disabled = state.page >= state.pdf.numPages;
  elements.zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;
  elements.zoomOut.disabled = state.zoom <= 0.55;
  elements.zoomIn.disabled = state.zoom >= 2.5;
}

async function renderPage() {
  if (!state.pdf) return;
  const renderNumber = ++state.renderNumber;
  if (state.renderTask) {
    try { state.renderTask.cancel(); } catch { /* The previous render already ended. */ }
  }
  state.draft = null;
  state.drawing = false;

  try {
    const page = await state.pdf.getPage(state.page);
    if (renderNumber !== state.renderNumber) return;
    const viewport = page.getViewport({ scale: state.zoom });
    const pixelBudget = 16_000_000;
    const ratio = Math.max(0.75, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(pixelBudget / (viewport.width * viewport.height))));

    for (const canvas of [elements.pdfCanvas, elements.annotationCanvas]) {
      canvas.width = Math.max(1, Math.floor(viewport.width * ratio));
      canvas.height = Math.max(1, Math.floor(viewport.height * ratio));
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
    }
    elements.stage.style.width = `${viewport.width}px`;
    elements.stage.style.height = `${viewport.height}px`;
    elements.stage.hidden = false;

    const context = elements.pdfCanvas.getContext("2d", { alpha: false });
    state.renderTask = page.render({
      canvasContext: context,
      viewport,
      transform: ratio === 1 ? null : [ratio, 0, 0, ratio, 0, 0],
      intent: "display",
    });
    await state.renderTask.promise;
    if (renderNumber !== state.renderNumber) return;
    elements.loading.hidden = true;
    drawAnnotationLayer();
    updatePageControls();
    setCanvasInteraction();
  } catch (error) {
    if (error?.name === "RenderingCancelledException") return;
    console.error(error);
    showError("This page could not be rendered. Try reloading the document.");
  }
}

async function fitToWidth() {
  if (!state.pdf) return;
  const page = await state.pdf.getPage(state.page);
  const base = page.getViewport({ scale: 1 });
  const workspacePadding = window.innerWidth <= 560 ? 30 : 80;
  state.zoom = clamp((elements.workspace.clientWidth - workspacePadding) / base.width, 0.55, 1.6);
  state.autoFit = true;
  await renderPage();
}

async function goToPage(pageNumber) {
  if (!state.pdf) return;
  const nextPage = clamp(Math.round(Number(pageNumber) || state.page), 1, state.pdf.numPages);
  if (nextPage === state.page) {
    updatePageControls();
    return;
  }
  state.page = nextPage;
  updateAnnotationSummary();
  await renderPage();
  elements.workspace.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function showError(message) {
  elements.loading.hidden = true;
  elements.stage.hidden = true;
  elements.error.hidden = false;
  elements.errorDetail.textContent = message;
  elements.download.disabled = true;
  elements.saveStatus.textContent = "PDF unavailable";
}

async function loadDocument() {
  if (!validRequest) {
    showError("This resource link is incomplete. Please open the PDF again from the resource library.");
    return;
  }

  elements.error.hidden = true;
  elements.loading.hidden = false;
  elements.loadingDetail.textContent = "Loading the PDF securely...";
  elements.stage.hidden = true;
  elements.title.textContent = requestedTitle;
  document.title = `${requestedTitle} | PDF Study Studio`;

  if (state.loadingTask) {
    try { await state.loadingTask.destroy(); } catch { /* Ignore cleanup errors. */ }
  }

  try {
    state.loadingTask = pdfjsLib.getDocument({
      url: resourceUrl,
      isEvalSupported: false,
      enableXfa: false,
    });
    state.loadingTask.onProgress = ({ loaded, total }) => {
      if (total > 0) elements.loadingDetail.textContent = `Loading PDF... ${Math.round((loaded / total) * 100)}%`;
    };
    state.pdf = await state.loadingTask.promise;
    state.page = 1;
    loadSavedAnnotations();
    elements.download.disabled = false;
    await fitToWidth();
  } catch (error) {
    console.error(error);
    showError("The file may be temporarily unavailable. Please try again in a moment.");
  }
}

function pointerPosition(event) {
  const bounds = elements.annotationCanvas.getBoundingClientRect();
  return {
    x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
    y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
  };
}

function pointSegmentDistance(point, start, end, width, height) {
  const px = point.x * width;
  const py = point.y * height;
  const x1 = start.x * width;
  const y1 = start.y * height;
  const x2 = end.x * width;
  const y2 = end.y * height;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const amount = clamp(((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(px - (x1 + amount * dx), py - (y1 + amount * dy));
}

function annotationHit(annotation, point, width, height) {
  if (annotation.type === "text") {
    const fontSize = annotation.size * state.zoom;
    const x = annotation.x * width;
    const y = annotation.y * height;
    const longestLine = Math.max(...annotation.text.split("\n").map((line) => line.length), 1);
    const estimatedWidth = Math.min(width - x, Math.max(fontSize * 5, longestLine * fontSize * 0.58));
    const estimatedHeight = Math.max(fontSize * 1.4, annotation.text.split("\n").length * fontSize * 1.3);
    const px = point.x * width;
    const py = point.y * height;
    return px >= x - 8 && px <= x + estimatedWidth + 8 && py >= y - 8 && py <= y + estimatedHeight + 8;
  }

  const threshold = Math.max(10, annotation.size * state.zoom * 0.75);
  if (annotation.points.length === 1) {
    return pointSegmentDistance(point, annotation.points[0], annotation.points[0], width, height) <= threshold;
  }
  for (let index = 1; index < annotation.points.length; index += 1) {
    if (pointSegmentDistance(point, annotation.points[index - 1], annotation.points[index], width, height) <= threshold) return true;
  }
  return false;
}

function eraseAt(point) {
  const items = pageAnnotations();
  if (!items.length) return;
  const bounds = elements.annotationCanvas.getBoundingClientRect();
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (annotationHit(items[index], point, bounds.width, bounds.height)) {
      items.splice(index, 1);
      if (!items.length) delete state.annotations[String(state.page)];
      state.eraserChanged = true;
      drawAnnotationLayer();
      return;
    }
  }
}

function finishPointer(event) {
  if (state.drawing && state.draft) {
    const key = String(state.page);
    if (!state.annotations[key]) state.annotations[key] = [];
    state.annotations[key].push(state.draft);
    state.draft = null;
    state.drawing = false;
    commitHistory();
    drawAnnotationLayer();
  }
  if (state.erasing) {
    state.erasing = false;
    if (state.eraserChanged) commitHistory();
    state.eraserChanged = false;
  }
  if (event.pointerId !== undefined && elements.annotationCanvas.hasPointerCapture(event.pointerId)) {
    elements.annotationCanvas.releasePointerCapture(event.pointerId);
  }
}

elements.annotationCanvas.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || state.tool === "hand") return;
  const point = pointerPosition(event);
  if (state.tool === "text") {
    state.pendingTextPoint = point;
    elements.textInput.value = "";
    elements.textDialog.showModal();
    setTimeout(() => elements.textInput.focus(), 0);
    return;
  }

  event.preventDefault();
  elements.annotationCanvas.setPointerCapture(event.pointerId);
  if (state.tool === "eraser") {
    state.erasing = true;
    state.eraserChanged = false;
    eraseAt(point);
    return;
  }

  state.drawing = true;
  state.draft = {
    id: crypto.randomUUID(),
    type: state.tool,
    colour: state.colour,
    size: state.size,
    points: [point],
  };
  drawAnnotationLayer();
});

elements.annotationCanvas.addEventListener("pointermove", (event) => {
  if (!event.isPrimary) return;
  const point = pointerPosition(event);
  if (state.erasing) {
    event.preventDefault();
    eraseAt(point);
    return;
  }
  if (!state.drawing || !state.draft) return;
  event.preventDefault();
  const previous = state.draft.points.at(-1);
  const bounds = elements.annotationCanvas.getBoundingClientRect();
  if (Math.hypot((point.x - previous.x) * bounds.width, (point.y - previous.y) * bounds.height) < 1.5) return;
  state.draft.points.push(point);
  drawAnnotationLayer();
});

elements.annotationCanvas.addEventListener("pointerup", finishPointer);
elements.annotationCanvas.addEventListener("pointercancel", finishPointer);

elements.toolButtons.forEach((button) => button.addEventListener("click", () => setTool(button.dataset.tool)));
elements.colours.forEach((button) => {
  button.addEventListener("click", () => {
    state.colour = button.dataset.colour;
    elements.customColour.value = state.colour;
    elements.colours.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
  });
});
elements.customColour.addEventListener("input", () => {
  state.colour = elements.customColour.value;
  elements.colours.forEach((button) => {
    button.classList.remove("is-active");
    button.setAttribute("aria-pressed", "false");
  });
});
elements.toolSize.addEventListener("input", () => {
  state.size = Number(elements.toolSize.value);
  state.sizes[state.tool] = state.size;
  elements.sizeLabel.textContent = state.size;
});

elements.textForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = elements.textInput.value.trim();
  if (!text || !state.pendingTextPoint) {
    elements.textDialog.close();
    return;
  }
  const key = String(state.page);
  if (!state.annotations[key]) state.annotations[key] = [];
  state.annotations[key].push({
    id: crypto.randomUUID(),
    type: "text",
    text,
    colour: state.colour,
    size: state.size,
    ...state.pendingTextPoint,
  });
  state.pendingTextPoint = null;
  elements.textDialog.close();
  commitHistory();
  drawAnnotationLayer();
});

function closeTextDialog() {
  state.pendingTextPoint = null;
  elements.textDialog.close();
}
elements.closeText.addEventListener("click", closeTextDialog);
elements.cancelText.addEventListener("click", closeTextDialog);
elements.textDialog.addEventListener("cancel", () => { state.pendingTextPoint = null; });

elements.previousPage.addEventListener("click", () => goToPage(state.page - 1));
elements.nextPage.addEventListener("click", () => goToPage(state.page + 1));
elements.pageInput.addEventListener("change", () => goToPage(elements.pageInput.value));
elements.pageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    goToPage(elements.pageInput.value);
    elements.pageInput.blur();
  }
});
elements.zoomOut.addEventListener("click", () => {
  state.zoom = clamp(Number((state.zoom - 0.15).toFixed(2)), 0.55, 2.5);
  state.autoFit = false;
  renderPage();
});
elements.zoomIn.addEventListener("click", () => {
  state.zoom = clamp(Number((state.zoom + 0.15).toFixed(2)), 0.55, 2.5);
  state.autoFit = false;
  renderPage();
});
elements.fitWidth.addEventListener("click", fitToWidth);
elements.undo.addEventListener("click", () => restoreHistory(state.historyIndex - 1));
elements.redo.addEventListener("click", () => restoreHistory(state.historyIndex + 1));

elements.clearPage.addEventListener("click", () => {
  if (!pageAnnotations().length || !window.confirm("Remove every annotation from this page?")) return;
  delete state.annotations[String(state.page)];
  commitHistory();
  drawAnnotationLayer();
  showToast("Page annotations cleared");
});
elements.clearDocument.addEventListener("click", () => {
  if (!totalAnnotations() || !window.confirm("Remove every annotation from this PDF? This cannot be undone after you leave the page.")) return;
  state.annotations = {};
  commitHistory();
  drawAnnotationLayer();
  showToast("All annotations cleared");
});

function visualOverlayCanvas(pdfPage, annotations) {
  const width = pdfPage.getWidth();
  const height = pdfPage.getHeight();
  const rotation = ((pdfPage.getRotation().angle % 360) + 360) % 360;
  const sideways = rotation === 90 || rotation === 270;
  const visualWidth = sideways ? height : width;
  const visualHeight = sideways ? width : height;
  const factor = Math.max(1, Math.min(2.25, 2400 / Math.max(visualWidth, visualHeight)));
  const visual = document.createElement("canvas");
  visual.width = Math.ceil(visualWidth * factor);
  visual.height = Math.ceil(visualHeight * factor);
  drawAnnotations(visual.getContext("2d"), annotations, visual.width, visual.height, factor);

  if (rotation === 0) return visual;
  const raw = document.createElement("canvas");
  raw.width = Math.ceil(width * factor);
  raw.height = Math.ceil(height * factor);
  const context = raw.getContext("2d");
  if (rotation === 90) context.setTransform(0, -1, 1, 0, 0, raw.height);
  else if (rotation === 180) context.setTransform(-1, 0, 0, -1, raw.width, raw.height);
  else if (rotation === 270) context.setTransform(0, 1, -1, 0, raw.width, 0);
  else return visual;
  context.drawImage(visual, 0, 0);
  return raw;
}

function canvasPngBytes(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("Could not create the annotation layer"));
        return;
      }
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, "image/png");
  });
}

function downloadBlob(bytes, filename) {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadFilename() {
  const safeTitle = requestedTitle
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 90) || "maths-resource";
  return `${safeTitle}-${resourceType}-annotated.pdf`;
}

async function exportPdf() {
  if (state.exporting || !state.pdf) return;
  state.exporting = true;
  elements.download.disabled = true;
  elements.downloadLabel.textContent = "Preparing...";
  elements.saveStatus.textContent = "Building your PDF...";

  try {
    const response = await fetch(resourceUrl, { headers: { Accept: "application/pdf" } });
    if (!response.ok) throw new Error(`PDF download returned ${response.status}`);
    const sourceBytes = new Uint8Array(await response.arrayBuffer());
    const annotatedPages = Object.entries(state.annotations).filter(([, items]) => items.length);

    if (!annotatedPages.length) {
      downloadBlob(sourceBytes, downloadFilename());
      showToast("Original PDF downloaded");
      return;
    }

    if (!window.PDFLib?.PDFDocument) throw new Error("PDF export tools did not load");
    const documentToSave = await window.PDFLib.PDFDocument.load(sourceBytes, { updateMetadata: false });
    const pages = documentToSave.getPages();

    for (let index = 0; index < annotatedPages.length; index += 1) {
      const [pageNumber, annotations] = annotatedPages[index];
      const page = pages[Number(pageNumber) - 1];
      if (!page) continue;
      elements.downloadLabel.textContent = `Page ${index + 1}/${annotatedPages.length}`;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const overlayCanvas = visualOverlayCanvas(page, annotations);
      const overlayBytes = await canvasPngBytes(overlayCanvas);
      const overlay = await documentToSave.embedPng(overlayBytes);
      page.drawImage(overlay, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    }

    const output = await documentToSave.save({ useObjectStreams: true, addDefaultPage: false });
    downloadBlob(output, downloadFilename());
    showToast("Your annotated PDF is ready");
  } catch (error) {
    console.error(error);
    showToast("The PDF could not be downloaded. Please try again.");
  } finally {
    state.exporting = false;
    elements.download.disabled = !state.pdf;
    elements.downloadLabel.textContent = "Download PDF";
    elements.saveStatus.textContent = totalAnnotations() ? "Notes saved on this device" : "Ready to study";
  }
}

elements.download.addEventListener("click", exportPdf);
elements.retry.addEventListener("click", loadDocument);

document.addEventListener("keydown", (event) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || elements.textDialog.open;
  if (typing) return;
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === "z") {
    event.preventDefault();
    restoreHistory(state.historyIndex + (event.shiftKey ? 1 : -1));
    return;
  }
  if ((event.ctrlKey || event.metaKey) && key === "y") {
    event.preventDefault();
    restoreHistory(state.historyIndex + 1);
    return;
  }
  if (!event.ctrlKey && !event.metaKey && !event.altKey) {
    if ({ p: "pen", h: "marker", t: "text", e: "eraser" }[key]) setTool({ p: "pen", h: "marker", t: "text", e: "eraser" }[key]);
    if (event.key === "PageUp") goToPage(state.page - 1);
    if (event.key === "PageDown") goToPage(state.page + 1);
  }
});

new ResizeObserver(() => {
  if (!state.pdf || !state.autoFit) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitToWidth, 180);
}).observe(elements.workspace);

setTool("hand");
loadDocument();
