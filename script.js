"use strict";

const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("searchInput");
const gifToggle = document.getElementById("gifToggle");
const viewer = document.getElementById("viewer");
const viewerBackdrop = viewer.querySelector(".viewer-backdrop");
const viewerClose = document.getElementById("viewerClose");
const viewerImage = document.getElementById("viewerImage");
const viewerDimensions = document.getElementById("viewerDimensions");
const viewerSize = document.getElementById("viewerSize");
const viewerExtension = document.getElementById("viewerExtension");
const viewerDownload = document.getElementById("viewerDownload");

const REPOSITORY = "666forever/img.dmp";
const BRANCH = "main";
const API_TREE_URL = `https://api.github.com/repos/${REPOSITORY}/git/trees/${BRANCH}?recursive=1`;
const BATCH_SIZE = 120;
const SUPPORTED_FOLDERS = new Set(["png/icons", "gif/icons"]);
const SUPPORTED_EXTENSIONS = new Set(["png", "gif"]);

let allIcons = [];
let visibleIcons = [];
let renderedCount = 0;
let showGifs = true;
let observer = null;
let activeIcon = null;
let lastFocusedElement = null;
let closeTimer = null;

function getExtension(path) {
  return path.split(".").pop()?.toLowerCase() || "";
}

function getFolder(path) {
  return path.slice(0, path.lastIndexOf("/"));
}

function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function createIconRecord(entry) {
  const path = entry.path;
  const extension = getExtension(path);
  const filename = path.split("/").pop() || path;
  const encodedPath = encodePath(path);

  return {
    filename,
    extension,
    size: Number.isFinite(entry.size) ? entry.size : null,
    relativeUrl: `./${encodedPath}`,
    directUrl: `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/${encodedPath}`,
  };
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

async function downloadIcon(icon, button) {
  if (!icon || button.disabled) return;
  button.disabled = true;

  try {
    const response = await fetch(icon.directUrl);
    if (!response.ok) throw new Error(`Download failed with status ${response.status}.`);

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = icon.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);

    button.classList.add("is-complete");
    window.setTimeout(() => button.classList.remove("is-complete"), 1100);
  } catch (error) {
    console.error("Could not download icon:", error);
  } finally {
    window.setTimeout(() => { button.disabled = false; }, 350);
  }
}

function createDownloadButton(icon, className = "download-button") {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.setAttribute("aria-label", `Download ${icon.extension.toUpperCase()} icon`);
  button.innerHTML = '<span class="download-icon" aria-hidden="true"></span>';
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    downloadIcon(icon, button);
  });
  return button;
}

function openViewer(icon, trigger, restoreFocus = false) {
  window.clearTimeout(closeTimer);
  activeIcon = icon;
  lastFocusedElement = restoreFocus ? trigger : null;

  viewerImage.src = icon.relativeUrl;
  viewerImage.alt = "";
  viewerDimensions.textContent = "loading";
  viewerSize.textContent = formatBytes(icon.size);
  viewerExtension.textContent = icon.extension;
  viewerDownload.classList.remove("is-complete");
  viewerDownload.setAttribute("aria-label", `Download ${icon.extension.toUpperCase()} icon`);

  viewer.classList.remove("is-closing");
  viewer.classList.add("is-open");
  viewer.setAttribute("aria-hidden", "false");
  document.body.classList.add("viewer-open");
  viewerClose.focus({ preventScroll: true });
}

function closeViewer(animateButton = false) {
  if (!viewer.classList.contains("is-open")) return;

  if (animateButton) {
    viewerClose.classList.remove("is-pressed");
    void viewerClose.offsetWidth;
    viewerClose.classList.add("is-pressed");
  }

  viewer.classList.add("is-closing");
  closeTimer = window.setTimeout(() => {
    viewer.classList.remove("is-open", "is-closing");
    viewer.setAttribute("aria-hidden", "true");
    viewerImage.removeAttribute("src");
    document.body.classList.remove("viewer-open");
    activeIcon = null;
    if (lastFocusedElement) {
      lastFocusedElement.focus({ preventScroll: true });
    } else {
      viewerClose.blur();
    }
  }, animateButton ? 190 : 130);
}

function createCard(icon) {
  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open ${icon.extension.toUpperCase()} icon preview`);

  const preview = document.createElement("div");
  preview.className = "preview";

  const image = document.createElement("img");
  image.src = icon.relativeUrl;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => card.remove(), { once: true });

  const downloadButton = createDownloadButton(icon);

  card.addEventListener("click", () => openViewer(icon, card, false));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openViewer(icon, card, true);
    }
  });

  preview.appendChild(image);
  card.append(preview, downloadButton);
  return card;
}

function renderNextBatch() {
  const batch = visibleIcons.slice(renderedCount, renderedCount + BATCH_SIZE);
  if (!batch.length) {
    observer?.disconnect();
    return;
  }

  const fragment = document.createDocumentFragment();
  batch.forEach((icon) => fragment.appendChild(createCard(icon)));
  gallery.appendChild(fragment);
  renderedCount += batch.length;

  if (renderedCount >= visibleIcons.length) observer?.disconnect();
}

function setupInfiniteScroll() {
  observer?.disconnect();

  const sentinel = document.createElement("div");
  sentinel.className = "gallery-sentinel";
  sentinel.setAttribute("aria-hidden", "true");
  gallery.appendChild(sentinel);

  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    sentinel.remove();
    renderNextBatch();
    if (renderedCount < visibleIcons.length) setupInfiniteScroll();
  }, { rootMargin: "900px 0px" });

  observer.observe(sentinel);
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  visibleIcons = allIcons.filter((icon) => {
    const matchesGifSetting = showGifs || icon.extension !== "gif";
    const matchesSearch = !query || icon.filename.toLowerCase().includes(query);
    return matchesGifSetting && matchesSearch;
  });

  renderedCount = 0;
  observer?.disconnect();
  gallery.replaceChildren();

  if (!visibleIcons.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No icons matched your search.";
    gallery.appendChild(empty);
    return;
  }

  renderNextBatch();
  if (renderedCount < visibleIcons.length) setupInfiniteScroll();
}

function updateGifToggle() {
  gifToggle.setAttribute("aria-pressed", String(showGifs));
  gifToggle.setAttribute("aria-label", showGifs ? "Hide GIFs" : "Show GIFs");
}

async function loadIcons() {
  gallery.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(API_TREE_URL, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) throw new Error(`GitHub tree request failed with status ${response.status}.`);

    const data = await response.json();
    if (!Array.isArray(data.tree)) throw new TypeError("GitHub returned an invalid repository tree.");

    allIcons = shuffle(data.tree
      .filter((entry) => entry.type === "blob" && typeof entry.path === "string" && SUPPORTED_FOLDERS.has(getFolder(entry.path)) && SUPPORTED_EXTENSIONS.has(getExtension(entry.path)))
      .map(createIconRecord));

    applyFilters();
  } catch (error) {
    console.error("Could not load icon library:", error);
    gallery.innerHTML = '<div class="empty">The icon list could not be loaded. Refresh the page or check GitHub API availability.</div>';
  } finally {
    gallery.setAttribute("aria-busy", "false");
  }
}

gifToggle.addEventListener("click", () => {
  showGifs = !showGifs;
  updateGifToggle();
  applyFilters();
});

searchInput.addEventListener("input", applyFilters);
viewerBackdrop.addEventListener("click", () => closeViewer());
viewerClose.addEventListener("click", () => closeViewer(true));
viewerDownload.addEventListener("click", () => downloadIcon(activeIcon, viewerDownload));

viewerImage.addEventListener("load", () => {
  viewerDimensions.textContent = `${viewerImage.naturalWidth} × ${viewerImage.naturalHeight}`;
});

viewer.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeViewer();
    return;
  }

  if (event.key !== "Tab") return;
  const focusable = [viewerClose, viewerDownload].filter((element) => !element.disabled);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

updateGifToggle();
loadIcons();
