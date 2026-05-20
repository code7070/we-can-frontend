import { useMemo } from "react";
import { Marked, Renderer } from "marked";
import { cn } from "@/lib/utils";

// ─── Configure Marked ────────────────────────────────────────────────────────

const renderer = new Renderer();
renderer.link = ({ href, text }) => {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

const marked = new Marked({
  gfm: true,
  breaks: true,
  renderer,
});

// ─── Props ───────────────────────────────────────────────────────────────────

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Renders Markdown content as sanitized HTML.
 * Uses `marked` under the hood with GFM support (tables, strikethrough, etc).
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const html = useMemo(() => {
    if (!content) return "";
    try {
      return marked.parse(content, { async: false }) as string;
    } catch {
      // If parsing fails, escape and show raw content
      return escapeHtml(content);
    }
  }, [content]);

  if (!content) return null;

  return (
    <div
      className={cn("markdown-content", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Simple HTML escape as fallback ─────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
