export function formatItemDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const year = d.getUTCFullYear();
    const month = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    return `${month} ${day}, ${year}`;
  } catch {
    return dateStr;
  }
}

export function getExtBadgeStyle(ext) {
  const lower = (ext || "").toLowerCase();
  switch (lower) {
    case "pdf":
      return "border-rose-500/30 bg-rose-500/10 text-rose-400";
    case "docx":
    case "doc":
      return "border-sky-500/30 bg-sky-500/10 text-sky-400";
    case "xlsx":
    case "xls":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "pptx":
    case "ppt":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    case "txt":
    default:
      return "border-border-strong bg-surface-secondary text-text-secondary";
  }
}

export function getCategoryBadgeStyle(cat) {
  const lower = (cat || "").toLowerCase();
  switch (lower) {
    case "accomplishment":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    case "decision":
      return "border-sky-500/30 bg-sky-500/10 text-accent-sky";
    case "idea":
      return "border-purple-500/30 bg-purple-500/10 text-purple-400";
    case "experience":
    case "event":
      return "border-amber-500/30 bg-amber-500/10 text-amber-400";
    case "learning":
      return "border-indigo-500/30 bg-indigo-500/10 text-indigo-400";
    default:
      return "border-accent-sky/30 bg-accent-sky/10 text-accent-sky";
  }
}
