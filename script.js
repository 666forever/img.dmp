"use strict";

const gallery = document.getElementById("gallery");
const totalCount = document.getElementById("totalCount");
const searchInput = document.getElementById("searchInput");
const filterButtons = [...document.querySelectorAll(".filter")];
const toast = document.getElementById("toast");

const REPOSITORY = "666forever/img.dmp";
const BRANCH = "main";
const API_TREE_URL = `https://api.github.com/repos/${REPOSITORY}/git/trees/${BRANCH}?recursive=1`;
const BATCH_SIZE = 120;
const SUPPORTED_FOLDERS = new Set(["png/icons", "gif/icons"]);
const SUPPORTED_EXTENSIONS = new Set(["png", "gif"]);

let allIcons = [];
let visibleIcons = [];
let activeFilter = "all";
let renderedCount = 0;
let observer = null;
let toastTimer = null;

function getExtension(path) {
  return path.split(".").pop()?.toLowerCase() || "";
}

function getFolder(path) {
  return path.slice(0, path.lastIndexOf("/"));
}

function encodePath(path) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function createIconRecord(path) {
  const extension = getExtension(path);
  const filename = path.split("/").pop() || path;
  const encodedPath = encodePath(path);

  return {
    filename,
    extension,
    relativeUrl: `./${encodedPath}`,
    directUrl: `https://raw.githubusercontent.com/${REPOSITORY}/${BRANCH}/${encodedPath}`,
  };
}

function showToast(message = "copied icon url") {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function createCard(icon) {
  const card = document.createElement("article");
  card.className = "card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `Copy direct URL for ${icon.filename}`);

  const preview = document.createElement("div");
  preview.className = "preview";

  const image = document.createElement("img");
  image.src = icon.relativeUrl;
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";

  const meta = document.createElement("div");
  meta.className = "meta";

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = icon.filename;
  name.title = icon.filename;

  const type = document.createElement("div");
  type.className = "type";
  type.textContent = icon.extension;

  preview.appendChild(image);
  meta.append(name, type);
  card.append(preview, meta);

  const copyUrl = async () => {
    await copyText(icon.directUrl);
    showToast();
  };

  card.addEventListener("click", copyUrl);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      copyUrl();
    }
  });

  image.addEventListener("error", () => card.remove(), { once: true });

  return card;
}

function updateCount() {
  if (!visibleIcons.length) {
    totalCount.textContent = "no matching icons";
    return;
  }

  totalCount.textContent = `${visibleIcons.length.toLocaleString()} icon${visibleIcons.length === 1 ? "" : "s"}`;
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

  if (renderedCount >= visibleIcons.length) {
    observer?.disconnect();
  }
}

function setupInfiniteScroll() {
  observer?.disconnect();

  const sentinel = document.createElement("div");
  sentinel.style.gridColumn = "1 / -1";
  sentinel.style.height = "1px";
  sentinel.setAttribute("aria-hidden", "true");
  gallery.appendChild(sentinel);

  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      sentinel.remove();
      renderNextBatch();

      if (renderedCount < visibleIcons.length) {
        setupInfiniteScroll();
      }
    },
    { rootMargin: "900px 0px" }
  );

  observer.observe(sentinel);
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();

  visibleIcons = allIcons.filter((icon) => {
    const matchesType = activeFilter === "all" || icon.extension === activeFilter;
    const matchesSearch = !query || icon.filename.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });

  renderedCount = 0;
  gallery.replaceChildren();
  updateCount();

  if (!visibleIcons.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No icons matched your search.";
    gallery.appendChild(empty);
    return;
  }

  renderNextBatch();

  if (renderedCount < visibleIcons.length) {
    setupInfiniteScroll();
  }
}

async function loadIcons() {
  gallery.setAttribute("aria-busy", "true");

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

    allIcons = data.tree
      .filter((entry) => {
        if (entry.type !== "blob" || typeof entry.path !== "string") return false;
        return SUPPORTED_FOLDERS.has(getFolder(entry.path)) && SUPPORTED_EXTENSIONS.has(getExtension(entry.path));
      })
      .map((entry) => createIconRecord(entry.path))
      .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));

    applyFilters();
  } catch (error) {
    console.error("Could not load icon library:", error);
    totalCount.textContent = "could not load icons";
    gallery.innerHTML = '<div class="empty">The icon list could not be loaded. Refresh the page or check GitHub API availability.</div>';
  } finally {
    gallery.setAttribute("aria-busy", "false");
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";

    filterButtons.forEach((candidate) => {
      candidate.classList.toggle("active", candidate === button);
    });

    applyFilters();
  });
});

searchInput.addEventListener("input", applyFilters);

loadIcons();
