import { initStarField } from "./components/StarField.js";

"use strict";

initStarField();

const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("searchInput");
const gifToggle = document.getElementById("gifToggle");
const categoryButtons = [...document.querySelectorAll(".content-tab")];

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
const BATCH_SIZE = {
  icons: 96,
  stickers: 48,
  wallpapers: 18,
};

const OBSERVER_MARGIN = {
  icons: "500px 0px",
  stickers: "400px 0px",
  wallpapers: "220px 0px",
};

const CATEGORY_CONFIG = {
  icons: {
    roots: ["icons/png", "icons/gif"],
    extensions: new Set(["png", "gif"]),
    emptyText: "No icons matched your search.",
    searchPlaceholder: "search icons…",
  },
  stickers: {
    roots: ["stickers"],
    extensions: new Set(["png", "gif", "webp", "jpg", "jpeg"]),
    emptyText: "No stickers matched your search.",
    searchPlaceholder: "search stickers…",
  },
  wallpapers: {
    roots: ["wallpapers"],
    extensions: new Set(["png", "gif", "webp", "jpg", "jpeg"]),
    emptyText: "No wallpapers matched your search.",
    searchPlaceholder: "search wallpapers…",
  },
};

let repositoryTree = [];
let itemsByCategory = {
  icons: [],
  stickers: [],
  wallpapers: [],
};

let activeCategory = "icons";
let visibleItems = [];
let renderedCount = 0;
let showGifs = true;
let observer = null;
let activeItem = null;
let lastFocusedElement = null;
let closeTimer = null;

function getExtension(path) {
  return path.split(".").pop()?.toLowerCase() || "";
}

function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function isInsideRoot(path, root) {
  return path === root || path.startsWith(`${root}/`);
}

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function createItemRecord(entry, category) {
  const path = entry.path;
  const extension = getExtension(path);
  const filename = path.split("/").pop() || path;
  const encodedPath = encodePath(path);

  return {
    category,
    filename,
    extension,
    size: Number.isFinite(entry.size) ? entry.size : null,
    relativeUrl: `./${encodedPath}`,
    directUrl: `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/${encodedPath}`,
  };
}

function buildCategoryCollections(tree) {
  for (const category of Object.keys(CATEGORY_CONFIG)) {
    const config = CATEGORY_CONFIG[category];

    itemsByCategory[category] = shuffle(
      tree
        .filter((entry) => {
          if (entry.type !== "blob" || typeof entry.path !== "string") return false;

          const extension = getExtension(entry.path);
          const matchesRoot = config.roots.some((root) => isInsideRoot(entry.path, root));

          return matchesRoot && config.extensions.has(extension);
        })
        .map((entry) => createItemRecord(entry, category))
    );
  }
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

async function downloadItem(item, button) {
  if (!item || button.disabled) return;

  button.disabled = true;

  try {
    const response = await fetch(item.directUrl);
    if (!response.ok) throw new Error(`Download failed with status ${response.status}.`);

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);

    button.classList.add("is-complete");
    window.setTimeout(() => button.classList.remove("is-complete"), 1100);
  } catch (error) {
    console.error("Could not download asset:", error);
  } finally {
    window.setTimeout(() => {
      button.disabled = false;
    }, 350);
  }
}

function createDownloadButton(item, className = "download-button") {
  const button = document.createElement("button");

  button.className = className;
  button.type = "button";
  button.setAttribute("aria-label", `Download ${item.extension.toUpperCase()} file`);
  button.innerHTML = '<span class="download-icon" aria-hidden="true"></span>';

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    downloadItem(item, button);
  });

  return button;
}

function openViewer(item, trigger, restoreFocus = false) {
  window.clearTimeout(closeTimer);

  activeItem = item;
  lastFocusedElement = restoreFocus ? trigger : null;

  viewer.classList.toggle("is-wallpaper", item.category === "wallpapers");
  viewerImage.src = item.relativeUrl;
  viewerImage.alt = "";
  viewerDimensions.textContent = "loading";
  viewerSize.textContent = formatBytes(item.size);
  viewerExtension.textContent = item.extension;
  viewerDownload.classList.remove("is-complete");
  viewerDownload.setAttribute("aria-label", `Download ${item.extension.toUpperCase()} file`);

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
    viewer.classList.remove("is-open", "is-closing", "is-wallpaper");
    viewer.setAttribute("aria-hidden", "true");
    viewerImage.removeAttribute("src");
    document.body.classList.remove("viewer-open");
    activeItem = null;

    if (lastFocusedElement) {
      lastFocusedElement.focus({ preventScroll: true });
    } else {
      viewerClose.blur();
    }
  }, animateButton ? 190 : 130);
}

function createCard(item) {
  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Open ${item.extension.toUpperCase()} preview`);

  const preview = document.createElement("div");
  preview.className = "preview";

  const image = document.createElement("img");
  image.src = item.relativeUrl;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.fetchPriority = "low";
  image.addEventListener("error", () => {
    if (card.isConnected) card.remove();
  }, { once: true });

  const downloadButton = createDownloadButton(item);

  card.addEventListener("click", () => openViewer(item, card, false));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openViewer(item, card, true);
    }
  });

  preview.appendChild(image);
  card.append(preview, downloadButton);

  return card;
}

function renderNextBatch() {
  const batchSize = BATCH_SIZE[activeCategory];
  const batch = visibleItems.slice(renderedCount, renderedCount + batchSize);

  if (!batch.length) {
    observer?.disconnect();
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const item of batch) {
    fragment.appendChild(createCard(item));
  }

  gallery.appendChild(fragment);
  renderedCount += batch.length;

  if (renderedCount >= visibleItems.length) {
    observer?.disconnect();
  }
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

    if (renderedCount < visibleItems.length) {
      setupInfiniteScroll();
    }
  }, { rootMargin: OBSERVER_MARGIN[activeCategory] });

  observer.observe(sentinel);
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();

  visibleItems = itemsByCategory[activeCategory].filter((item) => {
    const matchesGifSetting = activeCategory !== "icons" || showGifs || item.extension !== "gif";
    const matchesSearch = !query || item.filename.toLowerCase().includes(query);

    return matchesGifSetting && matchesSearch;
  });

  renderedCount = 0;
  observer?.disconnect();
  gallery.replaceChildren();

  if (!visibleItems.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = CATEGORY_CONFIG[activeCategory].emptyText;
    gallery.appendChild(empty);
    return;
  }

  renderNextBatch();

  if (renderedCount < visibleItems.length) {
    setupInfiniteScroll();
  }
}

function setCategory(category) {
  if (!CATEGORY_CONFIG[category] || category === activeCategory) return;

  activeCategory = category;
  gallery.dataset.category = category;

  for (const button of categoryButtons) {
    const isActive = button.dataset.category === category;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  gifToggle.hidden = category !== "icons";
  searchInput.value = "";
  searchInput.placeholder = CATEGORY_CONFIG[category].searchPlaceholder;
  searchInput.setAttribute("aria-label", `Search ${category}`);

  applyFilters();
}

function updateGifToggle() {
  gifToggle.setAttribute("aria-pressed", String(showGifs));
  gifToggle.setAttribute("aria-label", showGifs ? "Hide GIFs" : "Show GIFs");
}


async function loadLibrary() {
  gallery.setAttribute("aria-busy", "true");
  gallery.dataset.category = activeCategory;

  try {
    const response = await fetch(API_TREE_URL, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
      throw new Error(`GitHub tree request failed with status ${response.status}.`);
    }

    const data = await response.json();

    if (!Array.isArray(data.tree)) {
      throw new TypeError("GitHub returned an invalid repository tree.");
    }

    repositoryTree = data.tree;
    buildCategoryCollections(repositoryTree);
    applyFilters();
  } catch (error) {
    console.error("Could not load library:", error);
    gallery.innerHTML = '<div class="empty">The library could not be loaded. Refresh the page or check GitHub API availability.</div>';
  } finally {
    gallery.setAttribute("aria-busy", "false");
  }
}

for (const button of categoryButtons) {
  button.addEventListener("click", () => setCategory(button.dataset.category));
}

gifToggle.addEventListener("click", () => {
  showGifs = !showGifs;
  updateGifToggle();
  applyFilters();
});

searchInput.addEventListener("input", applyFilters);

searchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !searchInput.value) return;

  searchInput.value = "";
  applyFilters();
});

viewerBackdrop.addEventListener("click", () => closeViewer());
viewerClose.addEventListener("click", () => closeViewer(true));
viewerDownload.addEventListener("click", () => downloadItem(activeItem, viewerDownload));

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
loadLibrary();
