export interface ResourceFileLike {
  name: string;
  size: number;
  type?: string;
}

export interface ResourceFormDraft {
  title: string;
  description?: string;
  downloadUrl: string;
  fileSize: string;
  fileType: string;
  storagePath?: string;
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
  storagePath?: string;
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

export function getSafeStorageFileName(fileName: string) {
  return (
    fileName
      .trim()
      .replace(/[\\/#?%*:|"<>]/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 120) || "resource-file"
  );
}

export function buildResourceFileDraft(file: ResourceFileLike): ResourceFormDraft {
  return {
    title: getFileBaseName(file.name),
    downloadUrl: "",
    fileSize: formatResourceFileSize(file.size),
    fileType: getResourceFileType(file),
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

  if (!draft.storagePath) {
    return record;
  }

  record.storagePath = draft.storagePath;
  return record;
}

export function canDeleteResourceDocumentAfterStorageDeleteError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "storage/object-not-found"
  );
}
