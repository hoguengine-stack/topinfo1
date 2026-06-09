import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const downloadsDir = path.resolve("public", "downloads");
const manifestPath = path.join(downloadsDir, "manifest.json");

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function getFileType(fileName) {
  const extension = fileName.toLowerCase().split(".").pop() || "file";
  const upperExtension = extension.toUpperCase();

  if (["zip", "rar", "7z"].includes(extension)) return `${upperExtension} / Driver`;
  if (["exe", "msi"].includes(extension)) return `${upperExtension} / Installer`;
  if (extension === "pdf") return "PDF / Manual";
  if (["doc", "docx", "hwp", "hwpx"].includes(extension)) return `${upperExtension} / Document`;
  if (["jpg", "jpeg", "png", "webp"].includes(extension)) return `${upperExtension} / Image`;
  return `${upperExtension} / File`;
}

function getTitle(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
}

async function collectFiles(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "manifest.json" || entry.name.startsWith(".")) continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.posix.join(prefix, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectFiles(fullPath, relativePath));
      continue;
    }

    if (!entry.isFile()) continue;

    const info = await stat(fullPath);
    files.push({
      path: encodeURI(`/downloads/${relativePath}`),
      title: getTitle(entry.name),
      size: formatFileSize(info.size),
      type: getFileType(entry.name),
    });
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

const manifest = await collectFiles(downloadsDir);
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Generated ${manifest.length} download manifest item(s): ${manifestPath}`);
