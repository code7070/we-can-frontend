import type { Attachment } from "@/api/types";

interface Props {
  attachment: Attachment;
}

const TYPE_COLORS: Record<string, string> = {
  PNG: "#2563EB",
  PDF: "#DC2626",
  FIG: "#059669",
  JPG: "#D97706",
  JPEG: "#D97706",
  ZIP: "#71717A",
  SVG: "#8B5CF6",
  GIF: "#0891B2",
  DOC: "#6366F1",
  DOCX: "#6366F1",
  XLS: "#059669",
  XLSX: "#059669",
};

function getFileExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toUpperCase() ?? "";
  return ext;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileAttachment({ attachment }: Props) {
  const ext = getFileExtension(attachment.name);
  const color = TYPE_COLORS[ext] || "#71717A";

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border bg-surface hover:bg-[#F4F4F5] transition-colors duration-150 text-sm text-text-primary max-w-sm group"
    >
      <span
        className="w-9 h-9 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{ backgroundColor: color }}
      >
        {ext}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate font-medium">{attachment.name}</span>
        <span className="block text-xs text-text-disabled">
          {formatSize(attachment.size)}
        </span>
      </span>
    </a>
  );
}
