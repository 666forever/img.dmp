"use strict";

/* =========================
   ELEMENTS
========================= */

const libraryGrid = document.getElementById("libraryGrid");
const libraryStatus = document.getElementById("libraryStatus");
const loadMoreSentinel = document.getElementById("loadMoreSentinel");
const filterButtons = document.querySelectorAll(".library-filter");

/* =========================
   SUPPORTED MEDIA
========================= */

const IMAGE_FORMATS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
]);

const VIDEO_FORMATS = new Set([
  "webm",
  "mp4",
]);

/* =========================
   STATE
========================= */

/*
 * Same strategy as the older site:
 * load a fixed number of complete rows per batch.
 */
const BATCH_SIZE_BASE = 12;

let columnCount = getColumnCount();
let batchSize = BATCH_SIZE_BASE * columnCount;

let allMedia = [];
let filteredMedia = [];
let activeFilter = "all";

let index = 0;
let loadQueue = 0;
let observer = null;
let resizeTimer = null;

const columns = [];
const loadedItems = new Set();

/* =========================
   RESPONSIVE COLUMNS
========================= */

function getColumnCount() {
  if (window.innerWidth <= 700) {
    return 2;
  }

  if (window.innerWidth <= 1000) {
    return 3;
  }

  if (window.innerWidth <= 1350) {
    return 4;
  }

  return 5;
}

function createColumns() {
  columnCount = getColumnCount();
  batchSize = BATCH_SIZE_BASE * columnCount;

  libraryGrid.innerHTML = "";
  columns.length = 0;

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    const column = document.createElement("div");

    column.className = "library-column";

    libraryGrid.appendChild(column);
    columns.push(column);
  }
}

/* =========================
   HELPERS
========================= */

function getExtension(path) {
  const cleanPath = String(path)
    .split("?")[0]
    .split("#")[0];

  const segments = cleanPath.split(".");

  return segments.length > 1
    ? segments.pop().toLowerCase()
    : "";
}

function getMediaKey(item) {
  return `${item.category}/${item.src}`;
}

function getVideoMimeType(extension) {
  if (extension === "webm") {
    return "video/webm";
  }

  if (extension === "mp4") {
    return "video/mp4";
  }

  return "application/octet-stream";
}

/* =========================
   CREATE MEDIA CARD
========================= */

function createImageElement(item, isHighPriority) {
  const image = document.createElement("img");

  image.src = item.src;
  image.alt = item.filename || "";
  image.loading = isHighPriority ? "eager" : "lazy";
  image.decoding = "async";

  if (isHighPriority) {
    image.fetchPriority = "high";
  }

  if (Number.isFinite(item.width)) {
    image.width = item.width;
  }

  if (Number.isFinite(item.height)) {
    image.height = item.height;
  }

  return image;
}

function createVideoElement(item, extension) {
  const video = document.createElement("video");
  const source = document.createElement("source");

  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "metadata";

  source.src = item.src;
  source.type = getVideoMimeType(extension);

  video.appendChild(source);

  return video;
}

function createCard(item, isHighPriority = false) {
  const extension = getExtension(item.src);

  if (
    !IMAGE_FORMATS.has(extension) &&
    !VIDEO_FORMATS.has(extension)
  ) {
    return null;
  }

  const card = document.createElement("a");
  const key = getMediaKey(item);

  card.className = "library-card";
  card.href = item.src;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.dataset.category = item.category;
  card.dataset.key = key;

  card.setAttribute(
    "aria-label",
    item.filename || "Open media"
  );

  let media;

  if (VIDEO_FORMATS.has(extension)) {
    media = createVideoElement(item, extension);

    media.addEventListener(
      "loadeddata",
      () => {
        media.classList.add("loaded");
        card.classList.add("visible");
      },
      { once: true }
    );
  } else {
    media = createImageElement(item, isHighPriority);

    media.addEventListener(
      "load",
      () => {
        media.classList.add("loaded");
        card.classList.add("visible");
      },
      { once: true }
    );
  }

  media.addEventListener(
    "error",
    () => {
      loadedItems.delete(key);
      card.remove();
    },
    { once: true }
  );

  card.appendChild(media);

  return card;
}

/* =========================
   FILTERING
========================= */

function updateFilteredMedia() {
  filteredMedia = allMedia.filter((item) => {
    return (
      activeFilter === "all" ||
      item.category === activeFilter
    );
  });
}

function updateStatus() {
  const loadedCount = Math.min(
    index,
    filteredMedia.length
  );

  if (!filteredMedia.length) {
    libraryStatus.textContent = "no items found";
    loadMoreSentinel.hidden = true;
    return;
  }

  libraryStatus.textContent =
    `${loadedCount} of ${filteredMedia.length} items`;

  loadMoreSentinel.hidden =
    loadedCount >= filteredMedia.length;
}

/* =========================
   LOAD BATCH
========================= */

function loadBatch() {
  if (
    index >= filteredMedia.length ||
    columns.length === 0
  ) {
    updateStatus();
    return;
  }

  const batch = filteredMedia.slice(
    index,
    index + batchSize
  );

  /*
   * One fragment per column, matching the old website.
   * This keeps DOM insertion compact and predictable.
   */
  const fragments = columns.map(() =>
    document.createDocumentFragment()
  );

  batch.forEach((item, batchIndex) => {
    const key = getMediaKey(item);

    if (loadedItems.has(key)) {
      return;
    }

    loadedItems.add(key);

    /*
     * Prioritize only the very first visible cards.
     */
    const isHighPriority =
      index === 0 && batchIndex < columnCount;

    const card = createCard(
      item,
      isHighPriority
    );

    if (!card) {
      return;
    }

    /*
     * Preserve stable round-robin placement.
     * No measuring or reshuffling is performed.
     */
    const absoluteIndex = index + batchIndex;
    const columnIndex =
      absoluteIndex % columnCount;

    const rowIndex = Math.floor(
      absoluteIndex / columnCount
    );

    /*
     * Same restrained entrance staggering pattern.
     * Delay is capped after six rows.
     */
    const delay =
      Math.min(rowIndex, 5) * 35;

    card.style.setProperty(
      "--enter-delay",
      `${delay}ms`
    );

    fragments[columnIndex].appendChild(card);
  });

  fragments.forEach((fragment, columnIndex) => {
    columns[columnIndex].appendChild(fragment);
  });

  index += batch.length;

  libraryGrid.setAttribute(
    "aria-busy",
    "false"
  );

  updateStatus();
}

/* =========================
   RESET LIBRARY
========================= */

function resetLibrary() {
  index = 0;
  loadQueue = 0;

  loadedItems.clear();

  libraryGrid.setAttribute(
    "aria-busy",
    "true"
  );

  createColumns();
  loadBatch();
}

/* =========================
   INFINITE SCROLL
========================= */

function setupInfiniteScroll() {
  observer?.disconnect();

  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        return;
      }

      /*
       * Same queue protection as the old website.
       * Never allow several batches to pile up.
       */
      if (loadQueue > 2) {
        return;
      }

      if (index >= filteredMedia.length) {
        updateStatus();
        return;
      }

      loadQueue += 1;

      requestAnimationFrame(() => {
        loadBatch();

        requestAnimationFrame(() => {
          loadQueue -= 1;

          /*
           * If the sentinel remains visible after insertion,
           * allow one additional batch shortly afterward.
           */
          if (
            entry.isIntersecting &&
            loadQueue === 0 &&
            index < filteredMedia.length
          ) {
            loadQueue += 1;

            window.setTimeout(() => {
              loadBatch();
              loadQueue -= 1;
            }, 50);
          }
        });
      });
    },
    {
      root: null,

      /*
       * Copied from the old loading behavior:
       * begin loading well before reaching the end.
       */
      rootMargin: "1500px 0px",
      threshold: 0,
    }
  );

  observer.observe(loadMoreSentinel);
}

/* =========================
   APPLY FILTER
========================= */

function applyFilter(filter) {
  activeFilter = filter;

  updateFilteredMedia();
  resetLibrary();
}

/* =========================
   LOAD MANIFEST
========================= */

async function loadLibrary() {
  try {
    const response = await fetch(
      "./data/content/images.json",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Image manifest request failed with status ${response.status}.`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new TypeError(
        "The image manifest must contain a JSON array."
      );
    }

    allMedia = data.filter((item) => {
      return (
        item &&
        typeof item.src === "string" &&
        typeof item.category === "string"
      );
    });

    updateFilteredMedia();
    resetLibrary();
    setupInfiniteScroll();
  } catch (error) {
    console.error(
      "Could not load image library:",
      error
    );

    libraryGrid.setAttribute(
      "aria-busy",
      "false"
    );

    libraryStatus.textContent =
      "could not load the image manifest.";

    loadMoreSentinel.hidden = true;
  }
}

/* =========================
   EVENTS
========================= */

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((filterButton) => {
      filterButton.classList.remove(
        "is-active"
      );
    });

    button.classList.add("is-active");

    applyFilter(
      button.dataset.filter || "all"
    );
  });
});

window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);

  resizeTimer = window.setTimeout(() => {
    const nextColumnCount =
      getColumnCount();

    /*
     * Rebuild only when the responsive column count
     * actually changes.
     */
    if (nextColumnCount !== columnCount) {
      resetLibrary();
    }
  }, 250);
});

/* =========================
   START
========================= */

loadLibrary();