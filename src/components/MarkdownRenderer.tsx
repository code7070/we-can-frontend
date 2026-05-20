import { useEffect, useMemo, useRef } from "react";
import { Marked, Renderer } from "marked";
import hljs from "highlight.js/lib/common";
import { cn } from "@/lib/utils";

// ─── Configure Marked ────────────────────────────────────────────────────────

const renderer = new Renderer();

renderer.link = ({ href, text }) => {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

renderer.code = ({ text, lang }) => {
  const rawLang = (lang ?? "").trim().split(/\s+/)[0];
  let displayLang = rawLang || "plain";
  let highlighted: string;

  if (rawLang && hljs.getLanguage(rawLang)) {
    highlighted = hljs.highlight(text, { language: rawLang, ignoreIllegals: true }).value;
  } else if (!rawLang) {
    const auto = hljs.highlightAuto(text);
    highlighted = auto.value;
    if (auto.language) displayLang = auto.language;
  } else {
    highlighted = escapeHtml(text);
  }

  const encoded = encodeURIComponent(text);
  return (
    `<div class="code-block" data-code="${encoded}">` +
      `<div class="code-block__header">` +
        `<span class="code-block__lang">${escapeHtml(displayLang)}</span>` +
        `<button type="button" class="code-block__copy" aria-label="Copy code">` +
          `<svg class="code-block__icon-copy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>` +
          `<svg class="code-block__icon-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` +
          `<span class="code-block__copy-label">Copy</span>` +
        `</button>` +
      `</div>` +
      `<pre><code class="hljs language-${escapeHtml(displayLang)}">${highlighted}</code></pre>` +
    `</div>`
  );
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

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    if (!content) return "";
    try {
      return marked.parse(content, { async: false }) as string;
    } catch {
      return escapeHtml(content);
    }
  }, [content]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest<HTMLButtonElement>(".code-block__copy");
      if (!btn) return;
      const block = btn.closest<HTMLElement>(".code-block");
      if (!block) return;
      const raw = block.dataset.code ? decodeURIComponent(block.dataset.code) : "";
      navigator.clipboard.writeText(raw).then(() => {
        btn.classList.add("is-copied");
        window.setTimeout(() => btn.classList.remove("is-copied"), 1500);
      }).catch(() => {});
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [html]);

  if (!content) return null;

  return (
    <div
      ref={containerRef}
      className={cn("markdown-content", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
