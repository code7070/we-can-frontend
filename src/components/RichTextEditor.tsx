import { useCallback, useRef, useState, type ComponentProps } from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  toolbarPlugin,
  imagePlugin,
  tablePlugin,
  diffSourcePlugin,
  BoldItalicUnderlineToggles,
  ListsToggle,
  CreateLink,
  InsertCodeBlock,
  InsertTable,
  InsertThematicBreak,
  Separator,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaSelector, type InsertedMedia } from "@/components/MediaSelector";

// ─── Re-export for consumers ────────────────────────────────────────────────

export type { MDXEditorMethods };

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RichTextEditorProps {
  /** Placeholder text shown when the editor is empty */
  placeholder?: string;
  /** Minimum height of the editor content area (px) */
  minHeight?: number;
  /** Called with the full markdown string on every change */
  onChange?: (value: string) => void;
  /** Called when the editor loses focus */
  onBlur?: () => void;
  /** Called when the editor gains focus */
  onFocus?: () => void;
  /** Initial markdown content (uncontrolled — editor owns the state after mount) */
  initialValue?: string;
  /** When true, the editor content is not editable */
  readOnly?: boolean;
  /** Autofocus the editor on mount */
  autoFocus?: boolean;
  /** Custom image upload handler. Receives a File, returns a URL string. */
  imageUploadHandler?: (image: File) => Promise<string>;
  /** Additional class name for the root wrapper */
  className?: string;
  /** Optional placeholder for the link dialog autocomplete suggestions */
  linkAutocompleteSuggestions?: string[];
  /** Optional placeholder for the image dialog autocomplete suggestions */
  imageAutocompleteSuggestions?: string[];
  /** Code block languages for syntax highlighting. Key = language id, value = label. */
  codeBlockLanguages?: Record<string, string>;
}

// ─── Default code block languages ───────────────────────────────────────────

const DEFAULT_CODE_LANGUAGES: Record<string, string> = {
  js: "JavaScript",
  ts: "TypeScript",
  tsx: "TSX",
  css: "CSS",
  json: "JSON",
  sh: "Shell",
  py: "Python",
  md: "Markdown",
  txt: "Plain Text",
  "": "Unspecified",
};

// ─── Toolbar ────────────────────────────────────────────────────────────────

type ToolbarProps = Pick<RichTextEditorProps, "readOnly"> & {
  onOpenMediaSelector: () => void;
};

function InsertMediaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      title="Insert image or media"
      onClick={onClick}
      className="inline-flex items-center justify-center w-7 h-7 rounded text-text-secondary hover:bg-[#F4F4F5] hover:text-text-primary transition-colors duration-150"
    >
      <ImageIcon size={16} />
    </button>
  );
}

function EditorToolbar({ readOnly, onOpenMediaSelector }: ToolbarProps) {
  if (readOnly) return null;

  return (
    <>
      <BoldItalicUnderlineToggles options={["Bold", "Italic", "Underline"]} />
      <Separator />
      <ListsToggle options={["bullet", "number"]} />
      <Separator />
      <CreateLink />
      <InsertMediaButton onClick={onOpenMediaSelector} />
      <InsertCodeBlock />
      <InsertTable />
      <InsertThematicBreak />
    </>
  );
}

// ─── Error boundary fallback ────────────────────────────────────────────────

function EditorErrorFallback({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-8 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-danger">Editor crashed</p>
      <p className="max-w-sm text-xs text-text-secondary">{error.message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-solid-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        Retry
      </button>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function RichTextEditor({
  placeholder = "Start writing...",
  minHeight = 160,
  onChange,
  onBlur,
  onFocus,
  initialValue = "",
  readOnly = false,
  autoFocus = false,
  imageUploadHandler,
  className,
  linkAutocompleteSuggestions,
  imageAutocompleteSuggestions,
  codeBlockLanguages = DEFAULT_CODE_LANGUAGES,
}: RichTextEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const [error, setError] = useState<Error | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);

  const handleMediaInsert = useCallback((media: InsertedMedia) => {
    const md = media.type === "image"
      ? `![${media.name}](${media.url})\n`
      : `[${media.name}](${media.url})\n`;
    editorRef.current?.insertMarkdown(md);
  }, []);

  // Track whether user has ever focused the editor (for validation UX).
  // We don't need to expose this here — consumers handle validation externally.

  const handleChange = useCallback(
    (markdown: string) => {
      onChange?.(markdown);
    },
    [onChange],
  );

  const handleFocusCapture = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleRetry = useCallback(() => {
    setError(null);
    setEditorKey((k) => k + 1);
  }, []);

  const handleError: ComponentProps<typeof MDXEditor>["onError"] = useCallback(
    (err) => {
      console.error("[RichTextEditor] MDXEditor error:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    },
    [],
  );

  // Build image plugin config once
  const imagePluginConfig = useCallback(() => {
    const config: Parameters<typeof imagePlugin>[0] = {};
    if (imageUploadHandler) {
      config.imageUploadHandler = imageUploadHandler;
    }
    if (imageAutocompleteSuggestions) {
      config.imageAutocompleteSuggestions = imageAutocompleteSuggestions;
    }
    return config;
  }, [imageUploadHandler, imageAutocompleteSuggestions]);

  if (error) {
    return <EditorErrorFallback error={error} onRetry={handleRetry} />;
  }

  return (
    <div className={cn("relative border-[1.5px] rounded-lg", className)}>
      {/* Inline styles that override MDXEditor CSS variables with WeCan design tokens */}

      <div
        className="wecan-editor-wrapper"
        onFocusCapture={handleFocusCapture}
        style={
          { "--editor-min-height": `${minHeight}px` } as React.CSSProperties
        }
      >
        <MDXEditor
          key={editorKey}
          ref={editorRef}
          markdown={initialValue}
          onChange={handleChange}
          onBlur={onBlur}
          // onFocus={onFocus}
          placeholder={placeholder}
          readOnly={readOnly}
          autoFocus={autoFocus}
          onError={handleError}
          contentEditableClassName="wecan-editor-content"
          plugins={[
            toolbarPlugin({
              toolbarContents: () => (
                <EditorToolbar
                  readOnly={readOnly}
                  onOpenMediaSelector={() => setMediaSelectorOpen(true)}
                />
              ),
              toolbarClassName: "wecan-editor-toolbar",
            }),
            headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            markdownShortcutPlugin(),
            linkPlugin(),
            linkDialogPlugin({
              ...(linkAutocompleteSuggestions && {
                linkAutocompleteSuggestions,
              }),
            }),
            imagePlugin(imagePluginConfig()),
            tablePlugin(),
            codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
            codeMirrorPlugin({
              codeBlockLanguages,
            }),
            diffSourcePlugin({ viewMode: "rich-text" }),
          ]}
        />
      </div>
      <MediaSelector
        open={mediaSelectorOpen}
        onClose={() => setMediaSelectorOpen(false)}
        onInsert={handleMediaInsert}
      />
    </div>
  );
}
