export interface ResourceFileLike {
  name: string;
  type?: string;
}

export interface ResourceFormDraft {
  title: string;
  description?: string;
  downloadUrl: string;
  fileSize: string;
  fileType: string;
}

export interface ResourceRecord {
  title: string;
  description: string;
  downloadUrl: string;
  fileSize: string;
  fileType: string;
  createdAt: string;
  authorName: string;
  authorId?: string;
}

export interface StaticDownloadManifestItem {
  path: string;
  size?: string;
  type?: string;
  title?: string;
}

export function formatResourceFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function getFileBaseName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
}

export function getResourceFileType(file: ResourceFileLike) {
  const lowerName = file.name.toLowerCase();
  const extension = lowerName.includes(".") ? lowerName.split(".").pop() || "file" : "file";
  const upperExtension = extension.toUpperCase();

  if (["zip", "rar", "7z"].includes(extension)) return `${upperExtension} / Driver`;
  if (["exe", "msi"].includes(extension)) return `${upperExtension} / Installer`;
  if (["pdf"].includes(extension)) return "PDF / Manual";
  if (["doc", "docx", "hwp", "hwpx"].includes(extension)) return `${upperExtension} / Document`;
  if (["jpg", "jpeg", "png", "webp"].includes(extension)) return `${upperExtension} / Image`;
  return `${upperExtension} / File`;
}

function getFileNameFromUrlOrPath(value: string) {
  const normalized = value.trim().replace(/\\/g, "/").split("?")[0].split("#")[0];
  const lastSegment = normalized.split("/").filter(Boolean).pop() || normalized;

  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

export function normalizeStaticDownloadUrl(value: string) {
  const trimmed = value.trim().replace(/\\/g, "/");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/downloads/")) return encodeURI(trimmed);

  const withoutPublic = trimmed.replace(/^\/?public\//, "");
  const downloadPath = withoutPublic.startsWith("downloads/")
    ? withoutPublic
    : `downloads/${withoutPublic.replace(/^\/+/, "")}`;

  return encodeURI(`/${downloadPath}`);
}

export function buildStaticDownloadDraft(
  downloadPath: string,
  fileSize = "",
  manifest: StaticDownloadManifestItem[] = []
): ResourceFormDraft {
  const fileName = getFileNameFromUrlOrPath(downloadPath);
  const downloadUrl = normalizeStaticDownloadUrl(downloadPath);
  const manifestItem = manifest.find((item) => normalizeStaticDownloadUrl(item.path) === downloadUrl);

  return {
    title: manifestItem?.title || getFileBaseName(fileName),
    downloadUrl,
    fileSize: manifestItem?.size || fileSize,
    fileType: manifestItem?.type || getResourceFileType({ name: fileName }),
  };
}

export function buildResourceRecord(
  draft: ResourceFormDraft,
  options: {
    authorName: string;
    createdAt: string;
    authorId?: string;
  }
): ResourceRecord {
  const record: ResourceRecord = {
    title: draft.title.trim(),
    description: (draft.description || "").trim(),
    downloadUrl: draft.downloadUrl || "#",
    fileSize: draft.fileSize,
    fileType: draft.fileType,
    createdAt: options.createdAt,
    authorName: options.authorName,
  };

  if (options.authorId) {
    record.authorId = options.authorId;
  }

  return record;
}
