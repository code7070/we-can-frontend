import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { searchQueryOptions } from "@/api/search";
import { useScope, type ScopeId } from "@/hooks/useScope";
import { useCompanyOptional } from "@/context/company-context";
import { CommandBarResults, buildFlatItems, SCOPE_LABELS } from "./CommandBarResults";
import { cn } from "@/lib/utils";

// ─── Scope chip ───────────────────────────────────────────────────────────────

function ScopeChip({ scope, onClear }: { scope: ScopeId; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-accent-subtle text-accent shrink-0 leading-none select-none">
      {SCOPE_LABELS[scope]}
      <button
        type="button"
        // preventDefault keeps input focused when clicking the X
        onMouseDown={(e) => { e.preventDefault(); onClear(); }}
        className="flex items-center hover:opacity-70 transition-opacity"
        aria-label="Clear scope filter"
      >
        <X size={10} />
      </button>
    </span>
  );
}

// ─── CommandBar ───────────────────────────────────────────────────────────────

interface CommandBarProps {
  className?: string;
}

export function CommandBar({ className }: CommandBarProps) {
  const routeScope = useScope();
  const company = useCompanyOptional();

  // User-overridable scope, resets to route default on navigation
  const [activeScope, setActiveScope] = useState<ScopeId>(routeScope.id);
  useEffect(() => { setActiveScope(routeScope.id); }, [routeScope.id]);

  // contextId for the active scope:
  //   in_task    → taskId (routeScope.contextId)
  //   in_project → project slug (routeScope.slug)
  //   others     → null
  const contextId =
    activeScope === "in_task" ? routeScope.contextId :
    activeScope === "in_project" ? routeScope.slug :
    null;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const enabled = debouncedQuery.trim().length >= 2;
  const { data, isFetching } = useQuery({
    ...searchQueryOptions(debouncedQuery.trim(), activeScope, contextId),
    enabled,
  });

  const items = buildFlatItems(debouncedQuery, data, company?.slug);

  useEffect(() => { setSelectedIndex(0); }, [items.length, debouncedQuery]);

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    function onGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onGlobalKey);
    return () => document.removeEventListener("keydown", onGlobalKey);
  }, []);

  // Click outside to close
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter": {
        e.preventDefault();
        const el = containerRef.current?.querySelector(
          `[data-result-index="${selectedIndex}"] a, [data-result-index="${selectedIndex}"] button`
        ) as HTMLElement | null;
        el?.click();
        break;
      }
      case "Escape":
        if (open) {
          setOpen(false);
          inputRef.current?.blur();
        }
        break;
    }
  }

  function handleClose() {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
    setSelectedIndex(0);
    inputRef.current?.blur();
  }

  const showChip = activeScope !== "all";
  const showKbdHint = !focused && !query && !showChip;
  const placeholder = company ? `Search ${company.name}…` : "Search…";

  return (
    <div ref={containerRef} className={cn("relative isolate w-full", className)}>
      {/* Input row — flex container styled as the input */}
      <div
        className={cn(
          "flex items-center gap-1.5 h-8 pl-2.5 pr-2 border rounded-lg transition-all cursor-text",
          "bg-bg",
          focused
            ? "border-accent shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
            : "border-border hover:border-[#d4d4d8]"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <Search
          size={14}
          className={cn(
            "shrink-0 pointer-events-none transition-colors",
            focused ? "text-accent" : "text-text-disabled"
          )}
        />

        {showChip && (
          <ScopeChip scope={activeScope} onClear={() => setActiveScope("all")} />
        )}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search (⌘K)"
          className="flex-1 min-w-0 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-disabled"
        />

        {showKbdHint && (
          <div className="flex items-center gap-px shrink-0 pointer-events-none">
            <kbd className="flex items-center justify-center h-4 w-4 text-[10px] text-text-disabled bg-[#f4f4f5] border border-border rounded font-mono leading-none">
              ⌘
            </kbd>
            <kbd className="flex items-center justify-center h-4 w-4 text-[10px] text-text-disabled bg-[#f4f4f5] border border-border rounded font-mono leading-none">
              K
            </kbd>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <CommandBarResults
          query={query}
          debouncedQuery={debouncedQuery}
          data={data}
          isFetching={isFetching}
          items={items}
          selectedIndex={selectedIndex}
          onHover={setSelectedIndex}
          onClose={handleClose}
          activeScope={activeScope}
          availableScopes={routeScope.available}
          onScopeChange={setActiveScope}
        />
      )}
    </div>
  );
}
