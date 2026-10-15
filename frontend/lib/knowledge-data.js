export const DOCUMENT_EXTENSIONS = ["pdf", "docx", "txt", "md", "csv", "xlsx", "pptx"];
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];
export const KNOWLEDGE_TAGS = ["Accomplishment", "Decision", "Event", "Idea", "Learning", "Note"];

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const index = Math.min(3, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${Number((bytes / 1024 ** index).toFixed(1))} ${["B", "KB", "MB", "GB"][index]}`;
}

export function validateUpload(file, kind) {
  const extension = file.name.split(".").pop().toLowerCase();
  const extensions = kind === "image" ? IMAGE_EXTENSIONS : DOCUMENT_EXTENSIONS;
  if (!extensions.includes(extension)) return `Supported formats: ${extensions.join(", ")}.`;
  if (kind === "image" && file.size > 2 * 1024 * 1024) return "Images must be 2 MB or smaller.";
  if (kind === "document" && file.size > 25 * 1024 * 1024) return "Documents must be 25 MB or smaller.";
  return "";
}

export function normalizeUpload(upload) {
  const type = upload.data_type === "docs" ? "document" : upload.data_type === "img" ? "image" : "memory";
  const content = upload.data_source || "";
  let title = content.trim().split(/\s+/).slice(0, 6).join(" ") || "Saved note";
  if (type !== "memory") {
    try {
      title = decodeURIComponent(new URL(content).pathname.split("/").pop()) || "Uploaded file";
    } catch { title = "Uploaded file"; }
  }
  return {
    id: upload.id, type, title,
    content: type === "memory" ? content : "",
    url: type !== "memory" && /^https?:\/\//i.test(content) ? content : null,
    tag: upload.tag || (type === "memory" ? "Note" : type),
    fileType: upload.tag || title.split(".").pop(),
    fileSize: type === "image" ? "Image" : "Document",
    meta: "Uploaded document",
    previewUrl: type === "image" && /^https?:\/\//i.test(content) ? content : null,
    category: upload.tag || "Note",
    createdAt: upload.created_at,
  };
}

export function filterKnowledge(items, type, query) {
  const search = query.trim().toLowerCase();
  return items.filter((item) => (type === "all" || item.type === type)
    && (!search || [item.title, item.content, item.tag, item.fileType, item.meta].some((value) => value?.toLowerCase().includes(search))));
}
