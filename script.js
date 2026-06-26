const REPO_OWNER = "666forever";
const REPO_NAME = "img.dmp";
const BRANCH = "main";

const FOLDERS = [
  {
    collection: "png",
    filter: "png",
    path: "png/icons",
  },
  {
    collection: "gif",
    filter: "gif",
    path: "gif/icons",
  },
  {
    collection: "sailor doll",
    filter: "sailor-doll",
    path: "sailor doll",
  },
];

const SUPPORTED_FORMATS = ["png", "gif", "jpg", "jpeg", "webp"];

const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("searchInput");
const totalCount = document.getElementById("totalCount");
const toast = document.getElementById("toast");
const filterButtons = document.querySelectorAll(".filter");

let allIcons = [];
let activeFilter = "all";

function encodeGithubPath(path) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function getExtension(filename) {
  return filename.split(".").pop().toLowerCase();
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getPagesUrl(path) {
  return `https://${REPO_OWNER}.github.io/${REPO_NAME}/${encodeGithubPath(path)}`;
}

async function fetchFolder(folder, path = folder.path) {
  const apiPath = encodeGithubPath(path);
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${apiPath}?ref=${BRANCH}`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`could not load ${path}`);
  }

  const items = await response.json();
  const icons = [];

  for (const item of items) {
    if (item.type === "dir") {
      const nestedIcons = await fetchFolder(folder, item.path);
      icons.push(...nestedIcons);
      continue;
    }

    if (item.type !== "file") continue;

    const format = getExtension(item.name);
    if (!SUPPORTED_FORMATS.includes(format)) continue;

    icons.push({
      name: item.name,
      format,
      collection: folder.collection,
      filter: folder.filter,
      path: item.path,
      url: getPagesUrl(item.path),
      raw: item.download_url || getPagesUrl(item.path),
    });
  }

  return icons;
}

async function loadIcons() {
  gallery.innerHTML = `<div class="empty">loading icon archive…</div>`;

  const folderResults = await Promise.allSettled(FOLDERS.map((folder) => fetchFolder(folder)));

  const failedFolders = folderResults
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason.message);

  allIcons = shuffle(
    folderResults
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value)
  );

  if (!allIcons.length) {
    gallery.innerHTML = `
      <div class="empty">
        no icons were found. make sure the folders exist and github pages is enabled.
      </div>
    `;
    totalCount.textContent = "0 icons";
    console.warn(failedFolders);
    return;
  }

  renderIcons();

  if (failedFolders.length) {
    console.warn("some folders could not be loaded:", failedFolders);
  }
}

function renderIcons() {
  const query = searchInput.value.trim().toLowerCase();

  const visibleIcons = allIcons.filter((icon) => {
    const searchableText = `${icon.name} ${icon.path} ${icon.collection} ${icon.format}`.toLowerCase();

    const matchesSearch = searchableText.includes(query);
    const matchesFilter =
      activeFilter === "all" ||
      icon.format === activeFilter ||
      icon.filter === activeFilter;

    return matchesSearch && matchesFilter;
  });

  totalCount.textContent = `${visibleIcons.length} / ${allIcons.length} icons`;

  if (!visibleIcons.length) {
    gallery.innerHTML = `<div class="empty">no icons matched your search.</div>`;
    return;
  }

  gallery.innerHTML = visibleIcons
    .map((icon) => {
      const label = icon.collection === icon.format
        ? icon.format
        : `${icon.collection} · ${icon.format}`;

      return `
        <article class="card" data-url="${icon.url}" title="${escapeHtml(icon.name)} · click to copy direct url">
          <div class="preview">
            <img src="${icon.raw}" alt="${escapeHtml(icon.name)}" loading="lazy">
          </div>
          <div class="meta">
            <div class="type">${escapeHtml(label)}</div>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", async () => {
      const url = card.dataset.url;

      try {
        await navigator.clipboard.writeText(url);
        showToast("copied icon url");
      } catch {
        showToast("copy failed");
      }
    });
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1400);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

searchInput.addEventListener("input", renderIcons);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderIcons();
  });
});

loadIcons();
