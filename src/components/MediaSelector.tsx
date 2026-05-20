import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Grid3x3, X, Search, Film, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { listMedia, uploadMedia, detectMediaType, type MediaObject } from "@/api/media";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MediaLibraryItem {
  id: string;
  type: "image" | "video" | "other";
  name: string;
  size: string;
  thumb: string;
  date: string;
  url: string;
  key: string;
}

export interface InsertedMedia {
  type: "image" | "media";
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  file?: File;
  key?: string;
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function toLibraryItem(obj: MediaObject): MediaLibraryItem {
  const type = detectMediaType(obj.name, obj.contentType);
  return {
    id: obj.key,
    key: obj.key,
    type,
    name: obj.name,
    size: formatSize(obj.size),
    thumb: obj.url,
    date: formatRelative(obj.uploadedAt),
    url: obj.url,
  };
}

// ─── Upload Zone ─────────────────────────────────────────────────────────────

function UploadZone({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) onFilesSelected(files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all duration-150",
        "rounded-xl px-6 py-10 border-2 border-dashed",
        dragOver ? "border-accent bg-accent-subtle" : "border-border bg-[#FAFAFA]"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFilesSelected(Array.from(e.target.files));
        }}
      />
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150",
          dragOver ? "bg-[#DBEAFE] text-accent" : "bg-[#F4F4F5] text-text-secondary"
        )}
      >
        <Upload size={22} />
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary mb-0.5">
          {dragOver ? "Drop files here" : "Drag and drop files here"}
        </p>
        <p className="text-[13px] text-text-disabled">
          or <span className="text-accent font-medium">browse from your computer</span>
        </p>
      </div>
      <p className="text-[11px] text-text-disabled mt-1">
        PNG, JPG, GIF, SVG, MP4, WebM — max 10 MB
      </p>
    </div>
  );
}

// ─── Uploaded File Preview ───────────────────────────────────────────────────

function UploadedFilePreview({
  file,
  uploading,
  onRemove,
  onInsert,
}: {
  file: File;
  uploading: boolean;
  onRemove: () => void;
  onInsert: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isImage = file.type.startsWith("image/");
  const preview = useMemo(() => (isImage ? URL.createObjectURL(file) : null), [file, isImage]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "flex items-center gap-3 px-3.5 py-2.5 border border-border rounded-lg transition-colors duration-150",
        hovered ? "bg-[#F4F4F5]" : "bg-surface"
      )}
    >
      {preview ? (
        <div
          className="w-11 h-11 rounded-md shrink-0 border border-border bg-cover bg-center"
          style={{ backgroundImage: `url(${preview})` }}
        />
      ) : (
        <div className="w-11 h-11 rounded-md shrink-0 bg-[#F4F4F5] flex items-center justify-center">
          <Film size={18} className="text-text-disabled" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-text-primary truncate">{file.name}</div>
        <div className="text-[11px] text-text-disabled mt-0.5">
          {(file.size / 1024).toFixed(0)} KB
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onInsert}
          disabled={uploading}
          className={cn(
            "px-2.5 py-1 rounded-md text-white text-xs font-semibold transition-colors duration-150 flex items-center gap-1",
            uploading ? "bg-accent/60 cursor-wait" : "bg-accent hover:bg-accent-text"
          )}
        >
          {uploading && <Loader2 size={12} className="animate-spin" />}
          {uploading ? "Uploading…" : "Insert"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={uploading}
          className="w-7 h-7 rounded-md text-text-disabled hover:bg-[#F4F4F5] hover:text-text-primary flex items-center justify-center transition-colors duration-150 disabled:opacity-50"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Library Item ────────────────────────────────────────────────────────────

function MediaLibraryGridItem({
  item,
  selected,
  onSelect,
}: {
  item: MediaLibraryItem;
  selected: boolean;
  onSelect: (item: MediaLibraryItem) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isVideo = item.type === "video";

  return (
    <div
      onClick={() => onSelect(item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-lg overflow-hidden cursor-pointer bg-surface transition-all duration-150"
      style={{
        border: `2px solid ${selected ? "#2563EB" : hovered ? "#BFDBFE" : "#E4E4E7"}`,
      }}
    >
      <div
        className="w-full relative flex items-center justify-center bg-[#F4F4F5] overflow-hidden"
        style={{ aspectRatio: "4/3" }}
      >
        {item.type === "image" ? (
          <img src={item.thumb} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        ) : isVideo ? (
          <>
            <video src={item.thumb} className="w-full h-full object-cover" muted playsInline preload="metadata" />
            <div className="absolute w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFF">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </>
        ) : (
          <Film size={22} className="text-text-disabled" />
        )}
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-[22px] h-[22px] rounded-full bg-accent flex items-center justify-center">
            <Check size={12} className="text-white" />
          </div>
        )}
      </div>
      <div className="px-2.5 py-2">
        <div className="text-xs font-medium text-text-primary truncate">{item.name}</div>
        <div className="text-[11px] text-text-disabled mt-0.5">
          {item.size} · {item.date}
        </div>
      </div>
    </div>
  );
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

function MediaFilterTabs({
  value,
  onChange,
}: {
  value: "all" | "image" | "video";
  onChange: (v: "all" | "image" | "video") => void;
}) {
  const tabs = [
    { id: "all" as const, label: "All" },
    { id: "image" as const, label: "Images" },
    { id: "video" as const, label: "Video" },
  ];
  return (
    <div className="flex gap-1 bg-[#F4F4F5] rounded-lg p-[3px]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-3 py-[5px] rounded-md text-xs font-medium font-sans transition-all duration-150",
            value === tab.id
              ? "bg-white text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              : "bg-transparent text-text-secondary hover:text-text-primary"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────

export interface MediaSelectorProps {
  open: boolean;
  onClose: () => void;
  onInsert: (media: InsertedMedia) => void;
}

export function MediaSelector({ open, onClose, onInsert }: MediaSelectorProps) {
  const [tab, setTab] = useState<"upload" | "library">("upload");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaLibraryItem | null>(null);
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");
  const [search, setSearch] = useState("");
  const [library, setLibrary] = useState<MediaLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || tab !== "library") return;
    let cancelled = false;
    setLibraryLoading(true);
    setLibraryError(null);
    listMedia()
      .then((objects) => {
        if (cancelled) return;
        const items = objects
          .map(toLibraryItem)
          .sort((a, b) => b.id.localeCompare(a.id));
        setLibrary(items);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLibraryError(e instanceof Error ? e.message : "Failed to load library");
      })
      .finally(() => {
        if (!cancelled) setLibraryLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, tab]);

  if (!open) return null;

  const filteredLibrary = library.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleInsertUploaded(file: File, index: number) {
    const uploadKey = `${file.name}-${index}`;
    setUploadingKey(uploadKey);
    setUploadError(null);
    try {
      const uploaded = await uploadMedia(file);
      const isImage = (uploaded.type || file.type).startsWith("image/");
      onInsert({
        type: isImage ? "image" : "media",
        name: uploaded.name,
        url: uploaded.url,
        size: uploaded.size,
        mimeType: uploaded.type,
        key: uploaded.key,
      });
      onClose();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingKey(null);
    }
  }

  function handleInsertLibrary() {
    if (!selectedItem) return;
    onInsert({
      type: selectedItem.type === "image" ? "image" : "media",
      name: selectedItem.name,
      url: selectedItem.url,
      key: selectedItem.key,
    });
    onClose();
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-6"
      style={{ animation: "ms-fadeIn 150ms ease" }}
    >
      <style>{`
        @keyframes ms-fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes ms-slideUp { from { opacity:0; transform:translateY(12px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
      `}</style>

      <div
        className="w-full max-w-[640px] bg-surface rounded-[14px] border border-border flex flex-col overflow-hidden"
        style={{
          maxHeight: "calc(100vh - 48px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)",
          animation: "ms-slideUp 200ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Insert media</h2>
            <p className="text-[13px] text-text-disabled mt-0.5">
              Upload new files or pick from your library.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-text-disabled hover:bg-[#F4F4F5] hover:text-text-primary flex items-center justify-center transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border px-6 shrink-0">
          {[
            { id: "upload" as const, label: "Upload", Icon: Upload },
            { id: "library" as const, label: "Media Library", Icon: Grid3x3 },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium font-sans transition-colors duration-150 -mb-px border-b-2",
                  active
                    ? "border-accent text-accent"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                <t.Icon size={15} className={active ? "text-accent" : "text-text-disabled"} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === "upload" && (
            <div className="flex flex-col gap-4">
              <UploadZone onFilesSelected={(files) => setUploadedFiles((prev) => [...prev, ...files])} />
              {uploadedFiles.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-[0.07em] mb-2.5">
                    Uploaded files
                  </div>
                  <div className="flex flex-col gap-2">
                    {uploadedFiles.map((f, i) => {
                      const uploadKey = `${f.name}-${i}`;
                      return (
                        <UploadedFilePreview
                          key={uploadKey}
                          file={f}
                          uploading={uploadingKey === uploadKey}
                          onRemove={() => setUploadedFiles((prev) => prev.filter((_, j) => j !== i))}
                          onInsert={() => handleInsertUploaded(f, i)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {uploadError && (
                <div className="text-[12px] text-danger bg-danger-subtle border border-danger/20 rounded-md px-3 py-2">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {tab === "library" && (
            <div>
              {/* Search + Filters */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 flex items-center gap-2 h-9 px-3 border border-border rounded-lg bg-surface">
                  <Search size={14} className="text-text-disabled" />
                  <input
                    placeholder="Search media..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 border-none outline-none bg-transparent text-[13px] text-text-primary font-sans"
                  />
                </div>
                <MediaFilterTabs value={filterType} onChange={setFilterType} />
              </div>

              {/* Grid */}
              {libraryLoading ? (
                <div className="py-12 flex items-center justify-center text-text-disabled">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : libraryError ? (
                <div className="py-12 px-6 text-center text-[13px] text-danger">
                  {libraryError}
                </div>
              ) : filteredLibrary.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {filteredLibrary.map((item) => (
                    <MediaLibraryGridItem
                      key={item.id}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      onSelect={setSelectedItem}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 px-6 text-center text-[13px] text-text-disabled">
                  No media found{search ? ` for "${search}"` : ""}.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer (library tab) */}
        {tab === "library" && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-[#FAFAFA] shrink-0">
            <span className="text-[13px] text-text-secondary truncate">
              {selectedItem ? (
                <span>
                  <strong className="text-text-primary font-semibold">{selectedItem.name}</strong>
                  {" · "}
                  {selectedItem.size}
                </span>
              ) : (
                "Select a file to insert"
              )}
            </span>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-border bg-surface text-[13px] font-medium text-text-secondary hover:bg-[#F4F4F5] transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLibrary}
                disabled={!selectedItem}
                className={cn(
                  "px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150",
                  selectedItem
                    ? "bg-accent hover:bg-accent-text text-white cursor-pointer"
                    : "bg-border text-text-disabled cursor-not-allowed"
                )}
              >
                Insert media
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
