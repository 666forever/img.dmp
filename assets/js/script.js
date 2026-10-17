import { initStarField } from "./components/StarField.js";

"use strict";

initStarField();

const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("searchInput");
const gifToggle = document.getElementById("gifToggle");
const toolbarActions = document.getElementById("toolbarActions");
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
const COLOR_GROUPS = [
  {
    frame: "Frame 56",
    entries: [
      { label: "Roxo Indigo", value: "#4507CC" },
      { label: "Laranja", value: "#FF4B00" },
      { label: "Preto", value: "#070707" },
      { label: "Ivory Breeze", value: "#F9F8F3" },
      { label: "Off White", value: "#DDDDDD" },
      { label: "Silver Mist", value: "#A9A8AD" },
      { label: "Purple gradient stop", value: "#6231CE" },
      { label: "Roxo Indigo → Laranja", value: "linear-gradient(180deg,#6231CE 0%,#FF4B00 100%)", type: "gradient" },
    ],
  },
  {
    frame: "Frame 57",
    entries: [
      { label: "Onyx", value: "#0A0A0A" },
      { label: "Blue Slate", value: "#536879" },
      { label: "Alabaster Grey", value: "#E5E4E2" },
      { label: "Blue Slate → Alabaster Grey", value: "linear-gradient(180deg,#536879 11%,#E5E4E2 120.5%)", type: "gradient" },
    ],
  },
  {
    frame: "Frame 58",
    entries: [
      { label: "Jet Black", value: "#0B0B0B" },
      { label: "White Smoke", value: "#F5F5F5" },
      { label: "Granite Gray", value: "#6B6863" },
      { label: "Ash Gray", value: "#BDBAB5" },
      { label: "Light Gray", value: "#D9D9D9" },
    ],
  },
  {
    frame: "Frame 59",
    entries: [
      { label: "Black Onyx", value: "#121214" },
      { label: "Glacier Gray", value: "#89878A" },
    ],
  },
  {
    frame: "Frame 60",
    entries: [
      { label: "Ink", value: "#1D1D1D" },
      { label: "Slate", value: "#2B2B2B" },
      { label: "Tan", value: "#C7B39A" },
      { label: "Navy", value: "#4B5262" },
      { label: "Green", value: "#77835D" },
      { label: "Olive", value: "#37321C" },
      { label: "Sand", value: "#F2F1EC" },
      { label: "Ivory", value: "#FBF6F0" },
      { label: "Teal", value: "#3E5251" },
      { label: "Leather", value: "#84644B" },
      { label: "Wine", value: "#221616" },
      { label: "Plum", value: "#381B17" },
    ],
  },
];
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
  colors: {
    roots: [],
    extensions: new Set(),
    emptyText: "",
    searchPlaceholder: "",
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

    if (category === "colors") continue;

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


function createColorSwatch(entry) {
  const swatch = document.createElement("button");
  swatch.className = `color-swatch${entry.type === "gradient" ? " color-swatch-gradient" : ""}`;
  swatch.type = "button";
  swatch.setAttribute("aria-label", `Copy ${entry.value}`);

  const preview = document.createElement("span");
  preview.className = "color-swatch-preview";
  preview.style.background = entry.value;
  preview.setAttribute("aria-hidden", "true");

  const metadata = document.createElement("span");
  metadata.className = "color-swatch-meta";

  const label = document.createElement("span");
  label.className = "color-swatch-label";
  label.textContent = entry.label;

  const value = document.createElement("span");
  value.className = "color-swatch-value";
  value.textContent = entry.value;

  metadata.append(label, value);
  swatch.append(preview, metadata);

  swatch.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(entry.value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = entry.value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  });

  return swatch;
}

function renderColors() {
  observer?.disconnect();
  gallery.replaceChildren();
  gallery.dataset.category = "colors";

  const fragment = document.createDocumentFragment();

  for (const group of COLOR_GROUPS) {
    const section = document.createElement("section");
    section.className = "color-group";
    section.setAttribute("aria-labelledby", `${group.frame.toLowerCase().replaceAll(" ", "-")}-title`);

    const heading = document.createElement("h2");
    heading.className = "color-group-title";
    heading.id = `${group.frame.toLowerCase().replaceAll(" ", "-")}-title`;
    heading.textContent = group.frame;

    const grid = document.createElement("div");
    grid.className = "color-group-grid";

    for (const entry of group.entries) {
      grid.appendChild(createColorSwatch(entry));
    }

    section.append(heading, grid);
    fragment.appendChild(section);
  }

  gallery.appendChild(fragment);
}

function applyFilters() {
  if (activeCategory === "colors") {
    renderColors();
    return;
  }

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

  const isColors = category === "colors";
  toolbarActions.hidden = isColors;
  gifToggle.hidden = category !== "icons";
  searchInput.value = "";

  if (!isColors) {
    searchInput.placeholder = CATEGORY_CONFIG[category].searchPlaceholder;
    searchInput.setAttribute("aria-label", `Search ${category}`);
  }

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

toolbarActions.hidden = false;
updateGifToggle();
loadLibrary();
