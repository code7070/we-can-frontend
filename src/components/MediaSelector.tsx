import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Grid3x3, X, Search, Film, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MediaLibraryItem {
  id: number | string;
  type: "image" | "video";
  name: string;
  size: string;
  width: number;
  height: number;
  thumb: string; // gradient string or URL (placeholder in mock data)
  date: string;
}

export interface InsertedMedia {
  type: "image" | "media";
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  file?: File;
}

// ─── Sample data (replace with API when backend is ready) ────────────────────

const MEDIA_LIBRARY: MediaLibraryItem[] = [
  { id: 1, type: "image", name: "hero-mockup-desktop.png", size: "1.2 MB", width: 1920, height: 1080, thumb: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)", date: "2 days ago" },
  { id: 2, type: "image", name: "wireframe-mobile-v2.png", size: "340 KB", width: 375, height: 812, thumb: "linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)", date: "3 days ago" },
  { id: 3, type: "image", name: "screenshot-nav-hover.png", size: "186 KB", width: 1440, height: 900, thumb: "linear-gradient(135deg, #F0FDF4 0%, #BBF7D0 100%)", date: "5 days ago" },
  { id: 4, type: "image", name: "logo-taskflow-dark.svg", size: "8 KB", width: 200, height: 48, thumb: "linear-gradient(135deg, #18181B 0%, #3F3F46 100%)", date: "1 week ago" },
  { id: 5, type: "video", name: "prototype-walkthrough.mp4", size: "14.5 MB", width: 1920, height: 1080, thumb: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)", date: "1 week ago" },
  { id: 6, type: "image", name: "component-library-preview.png", size: "520 KB", width: 1600, height: 900, thumb: "linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)", date: "2 weeks ago" },
  { id: 7, type: "image", name: "user-flow-diagram.png", size: "890 KB", width: 2400, height: 1200, thumb: "linear-gradient(135deg, #ECFDF5 0%, #A7F3D0 100%)", date: "2 weeks ago" },
  { id: 8, type: "video", name: "onboarding-animation.mp4", size: "6.2 MB", width: 1080, height: 1920, thumb: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)", date: "3 weeks ago" },
  { id: 9, type: "image", name: "design-tokens-chart.png", size: "145 KB", width: 800, height: 600, thumb: "linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)", date: "3 weeks ago" },
];

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
  onRemove,
  onInsert,
}: {
  file: File;
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
          className="px-2.5 py-1 rounded-md bg-accent hover:bg-accent-text text-white text-xs font-semibold transition-colors duration-150"
        >
          Insert
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="w-7 h-7 rounded-md text-text-disabled hover:bg-[#F4F4F5] hover:text-text-primary flex items-center justify-center transition-colors duration-150"
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
        className="w-full relative flex items-center justify-center"
        style={{ aspectRatio: "4/3", background: item.thumb }}
      >
        {isVideo && (
          <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFF">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
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
  const [selectedItem, setSelectedItem] = useState<MediaLibraryItem | null>(null);
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");
  const [search, setSearch] = useState("");

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

  if (!open) return null;

  const filteredLibrary = MEDIA_LIBRARY.filter((item) => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleInsertUploaded(file: File) {
    const isImage = file.type.startsWith("image/");
    onInsert({
      type: isImage ? "image" : "media",
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      mimeType: file.type,
      file,
    });
    onClose();
  }

  function handleInsertLibrary() {
    if (!selectedItem) return;
    onInsert({
      type: selectedItem.type === "image" ? "image" : "media",
      name: selectedItem.name,
      url: selectedItem.thumb, // placeholder until real URL exists
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
                    {uploadedFiles.map((f, i) => (
                      <UploadedFilePreview
                        key={`${f.name}-${i}`}
                        file={f}
                        onRemove={() => setUploadedFiles((prev) => prev.filter((_, j) => j !== i))}
                        onInsert={() => handleInsertUploaded(f)}
                      />
                    ))}
                  </div>
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
              {filteredLibrary.length > 0 ? (
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
