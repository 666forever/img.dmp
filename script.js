const REPO_OWNER = "666forever";
const REPO_NAME = "img.dmp";
const BRANCH = "main";

const FOLDERS = [
  { type: "png", path: "png/icons" },
  { type: "gif", path: "gif/icons" },
];

const gallery = document.getElementById("gallery");
const searchInput = document.getElementById("searchInput");
const totalCount = document.getElementById("totalCount");
const toast = document.getElementById("toast");
const filterButtons = document.querySelectorAll(".filter");

let allIcons = [];
let activeFilter = "all";

async function fetchFolder(folder) {
  const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder.path}?ref=${BRANCH}`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`Could not load ${folder.path}`);
  }

  const files = await response.json();

  return files
    .filter((file) => file.type === "file")
    .filter((file) => /\.(png|gif)$/i.test(file.name))
    .map((file) => ({
      name: file.name,
      type: folder.type,
      path: file.path,
      url: `https://${REPO_OWNER}.github.io/${REPO_NAME}/${file.path}`,
      raw: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${file.path}`,
    }));
}

async function loadIcons() {
  try {
    gallery.innerHTML = `<div class="empty">Loading icon archive…</div>`;

    const folderResults = await Promise.all(FOLDERS.map(fetchFolder));
    allIcons = folderResults.flat().sort((a, b) => a.name.localeCompare(b.name));

    renderIcons();
  } catch (error) {
    gallery.innerHTML = `
      <div class="empty">
        Could not load icons. Make sure GitHub Pages is enabled and the folders exist.
      </div>
    `;
    totalCount.textContent = "Failed to load icons";
    console.error(error);
  }
}

function renderIcons() {
  const query = searchInput.value.trim().toLowerCase();

  const visibleIcons = allIcons.filter((icon) => {
    const matchesSearch = icon.name.toLowerCase().includes(query);
    const matchesFilter = activeFilter === "all" || icon.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  totalCount.textContent = `${visibleIcons.length} / ${allIcons.length} icons`;

  if (!visibleIcons.length) {
    gallery.innerHTML = `<div class="empty">No icons matched your search.</div>`;
    return;
  }

  gallery.innerHTML = visibleIcons
    .map((icon) => {
      return `
        <article class="card" data-url="${icon.url}" title="Click to copy direct URL">
          <div class="preview">
            <img src="${icon.raw}" alt="${escapeHtml(icon.name)}" loading="lazy">
          </div>
          <div class="meta">
            <div class="name">${escapeHtml(icon.name)}</div>
            <div class="type">${icon.type}</div>
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
        showToast("Copied direct link");
      } catch {
        showToast("Copy failed");
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