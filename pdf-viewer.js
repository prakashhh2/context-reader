

const PDFJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const RENDER_SCALE = 1.5;

const params = new URLSearchParams(location.search);
const pdfUrl = params.get("url");

const statusEl = document.getElementById("status");
const containerEl = document.getElementById("pdf-container");
const pageInfoEl = document.getElementById("page-info");

// Load a remote script via fetch → blob → <script> tag.
// Blob URLs from this extension context are same-origin so CSP allows them.
async function loadScript(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const text = await res.text();
  const blob = new Blob([text], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = blobUrl;
    script.onload = () => { URL.revokeObjectURL(blobUrl); resolve(); };
    script.onerror = () => reject(new Error("Script load failed"));
    document.head.appendChild(script);
  });
}

async function init() {
  if (!pdfUrl) {
    showError("No PDF URL provided.");
    return;
  }

  try {
    statusEl.textContent = "Loading PDF.js...";
    await loadScript(PDFJS_URL);

    // Set worker via blob URL
    const workerRes = await fetch(WORKER_URL);
    if (!workerRes.ok) throw new Error(`Failed to fetch PDF.js worker: ${workerRes.status}`);
    const workerText = await workerRes.text();
    const workerBlob = new Blob([workerText], { type: "application/javascript" });
    /* global pdfjsLib */
    pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);

    statusEl.textContent = "Loading PDF...";
    const pdf = await pdfjsLib.getDocument({ url: pdfUrl, isEvalSupported: false }).promise;
    const numPages = pdf.numPages;

    pageInfoEl.textContent = `${numPages} page${numPages !== 1 ? "s" : ""}`;
    statusEl.style.display = "none";
    containerEl.style.display = "flex";

    for (let i = 1; i <= numPages; i++) {
      await renderPage(pdf, i);
    }
  } catch (err) {
    showError(`Could not load PDF: ${err.message}`);
  }
}

async function renderPage(pdf, pageNum) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: RENDER_SCALE });

  const wrapper = document.createElement("div");
  wrapper.className = "page-wrapper";
  wrapper.style.width = `${viewport.width}px`;
  wrapper.style.height = `${viewport.height}px`;

  // Canvas layer
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

  // Text layer (for selection)
  const textLayerDiv = document.createElement("div");
  textLayerDiv.className = "textLayer";
  const textContent = await page.getTextContent();

  textContent.items.forEach((item) => {
    if (!item.str) return;
    const span = document.createElement("span");
    span.textContent = item.str;

    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const angle = Math.atan2(tx[1], tx[0]);
    const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);

    span.style.fontSize = `${fontHeight}px`;
    span.style.left = `${tx[4]}px`;
    span.style.top = `${tx[5] - fontHeight}px`;
    if (angle !== 0) span.style.transform = `rotate(${angle}rad)`;

    textLayerDiv.appendChild(span);
  });

  wrapper.appendChild(canvas);
  wrapper.appendChild(textLayerDiv);
  containerEl.appendChild(wrapper);
}

function showError(msg) {
  statusEl.className = "error";
  statusEl.textContent = `⚠️ ${msg}`;
}

init();
