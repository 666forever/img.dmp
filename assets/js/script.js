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
const COLOR_HEX_VALUES = [
  "#FCBF66",
  "#AB4B52",
  "#FD3A4A",
  "#E4181E",
  "#532934",
  "#54626F",
  "#007F5C",
  "#40826D",
  "#009698",
  "#7D88A8",
  "#BCC6DF",
  "#324AB2",
  "#666699",
  "#424859",
  "#9E7DA8",
  "#17111D",
  "#0B0010",
  "#8C8C8C",
  "#8C92AC",
  "#61666B",
  "#323136",
  "#29272F",
  "#2A252C",
  "#BFAFB2",
  "#D7D5CC",
  "#E7E5E8",
  "#FEFDFF",
  "#FEFCFF",
  "#FDF8FF",
  "#98B4D4",
  "#C3447A",
  "#BC243C",
  "#7FCDCD",
  "#E15D44",
  "#B4DDDD",
  "#55B4B0",
  "#F69269",
  "#DFCFBE",
  "#E2D28F",
  "#9B2335",
  "#EDC0BB",
  "#5B5EA6",
  "#FFDC76",
  "#EFC050",
  "#A7C6B9",
  "#45B8AC",
  "#CEE7F1",
  "#3E5163",
  "#D65076",
  "#EEF3BC",
  "#544649",
  "#358A5D",
  "#DD4124",
  "#C15A56",
  "#AABEB4",
  "#ACCABC",
  "#009B77",
  "#454C6C",
  "#FEF2C3",
  "#736F78",
  "#AD5E99",
  "#4D7A78",
  "#C9DDE5",
  "#D9766C",
  "#964F4C",
  "#CC917B",
  "#CBCDAE",
  "#ECEAE0",
  "#82988C",
  "#F7CACA",
  "#93A9D1",
  "#C16F62",
  "#C19659",
  "#F6F6ED",
  "#BAC0B8",
  "#8C7F78",
  "#8A8CA3",
  "#88B04B",
  "#6F7E77",
  "#E8B447",
  "#7C8D95",
  "#514A58",
  "#426267",
  "#015A6B",
  "#474B5A",
  "#5F4B8B",
  "#D59859",
  "#EED5D4",
  "#D4C9B9",
  "#587D79",
  "#9B8986",
  "#8A2728",
  "#869893",
  "#AC6B54",
  "#3C514F",
  "#FF6F61",
  "#525D70",
  "#7BB1B3",
  "#185869",
  "#7B8D6A",
  "#86493F",
  "#A48061",
  "#CDB68C",
  "#BBBDB8",
  "#60818D",
  "#2F3D4C",
  "#395F7C",
  "#0F4C81",
  "#E0B24F",
  "#EBCFC3",
  "#344F46",
  "#B995A1",
  "#D2F2E6",
  "#BDC3B9",
  "#AEC5BC",
  "#EFE2DE",
  "#BDB990",
  "#54504A",
  "#BDDBDA",
  "#939597",
  "#F5DF4D",
  "#93A596",
  "#CBDAE7",
  "#864C53",
  "#57333F",
  "#8EC2C3",
  "#8EBBD7",
  "#B4D9F3",
  "#9E8E7E",
  "#D4C8BC",
  "#6F898B",
  "#C39D82",
  "#EAD885",
  "#95978A",
  "#ACAE96",
  "#6667AB",
  "#989B62",
  "#327B7E",
  "#C2AEB9",
  "#99A9B7",
  "#95A7AD",
  "#9AA67D",
  "#929B88",
  "#896956",
  "#B0C4D3",
  "#848675",
  "#B6B8A5",
  "#CCD8CF",
  "#C8B3C0",
  "#F9D4AC",
  "#6C7974",
  "#AE8E7E",
  "#4D7378",
  "#BE3455",
  "#706254",
  "#3C4C3A",
  "#443E40",
  "#9B5A54",
  "#4D7378",
  "#9D8B84",
  "#BC6569",
  "#C3B691",
  "#987364",
  "#D75F56",
  "#F1EDE1",
  "#E19536",
  "#99B6B3",
  "#BFC9D0",
  "#F0DEB8",
  "#FEBD99",
  "#2F6971",
  "#4E9CCC",
  "#D9987C",
  "#BBBB97",
  "#F0DEB8",
  "#56554A",
  "#70939E",
  "#D6CCCA",
  "#B9D5E6",
  "#5C6D92",
  "#4F5152",
  "#E19536",
  "#A7DCA2",
  "#04A6BA",
  "#A0346C",
  "#ADA7CB",
  "#E99460",
  "#4C5578",
  "#316263",
  "#ADBBB2",
  "#0F456E",
  "#54504A",
  "#626E60",
  "#744245",
  "#E19536",
  "#7B9192",
  "#59536C",
  "#BBA593",
  "#D2B6A0",
  "#604541",
  "#725A4E",
  "#897475",
  "#5C4450",
  "#DEB448",
  "#BA947F",
  "#262D30",
  "#A57865",
  "#BB724A",
  "#71ABD1",
  "#5D3A8C",
  "#2D443C",
  "#9E252F",
  "#17366F",
  "#566A69",
  "#7D7F70",
  "#E4CAAD",
  "#764034",
  "#57504D",
  "#431F24",
  "#BBA992",
  "#DECDA4",
  "#7D5A3E",
  "#96A8B4",
  "#054A7F",
  "#2C3241",
  "#4B4038",
  "#647058",
  "#183F8F",
  "#5D3A40",
  "#F0EFEB"
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


function createColorSwatch(hex) {
  const swatch = document.createElement("button");
  swatch.className = "color-swatch";
  swatch.type = "button";
  swatch.style.background = hex;
  swatch.setAttribute("aria-label", `Copy ${hex}`);

  swatch.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = hex;
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

  for (const hex of COLOR_HEX_VALUES) {
    fragment.appendChild(createColorSwatch(hex));
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
