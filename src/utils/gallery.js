import { readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

const collectImages = (dir) => {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectImages(fullPath));
      return;
    }
    if (!imageExtensions.has(extname(entry.name).toLowerCase())) {
      return;
    }
    files.push(fullPath);
  });

  return files;
};

const shuffleArray = (items) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

export const buildGalleryFromFolders = (baseDir, folders) => {
  return folders.flatMap((folder) => {
    const dirPath = join(baseDir, folder);
    const files = collectImages(dirPath).sort((a, b) =>
      a.localeCompare(b, "es")
    );

    return files.map((filePath) => {
      const relativePath = relative(baseDir, filePath)
        .split("\\")
        .join("/");
      const fileName = relativePath.split("/").pop();
      const label = fileName ? fileName.replace(/\.[^.]+$/, "") : "";

      return {
        label,
        src: encodeURI(`/images/productos/${relativePath}`),
      };
    });
  });
};

export const listProductFolders = (baseDir, matchText) => {
  return readdirSync(baseDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && entry.name.toLowerCase().includes(matchText)
    )
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "es"));
};

export const pickRandomItems = (items, count) => {
  if (!items.length) return [];
  const shuffled = shuffleArray(items);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const sampleGalleryFromGroups = (groups, totalCount) => {
  const picks = [];
  const seen = new Set();

  const addItems = (items) => {
    items.forEach((item) => {
      if (!item || !item.src || seen.has(item.src)) return;
      seen.add(item.src);
      picks.push(item);
    });
  };

  groups.forEach((group) => {
    if (!group || !group.items || !group.items.length) return;
    const amount = group.count ?? 1;
    addItems(pickRandomItems(group.items, amount));
  });

  if (picks.length < totalCount) {
    const pool = groups.flatMap((group) => group.items || []);
    addItems(pickRandomItems(pool, totalCount - picks.length));
  }

  return picks.slice(0, totalCount);
};
