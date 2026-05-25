import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowLeft } from "lucide-react";
import { searchQueryOptions } from "@/api/search";
import { useScope } from "@/hooks/useScope";
import { useCompanyOptional } from "@/context/company-context";
import { CommandBarResults, buildFlatItems } from "./CommandBarResults";

interface Props {
  onClose: () => void;
}

export function MobileSearchOverlay({ onClose }: Props) {
  const routeScope = useScope();
  const company = useCompanyOptional();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Auto-focus input on mount
  useEffect(() => {
    // Small delay to allow the animation to start
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Close on escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const enabled = debouncedQuery.trim().length >= 2;
  const { data, isFetching } = useQuery({
    ...searchQueryOptions(debouncedQuery.trim(), routeScope.id, routeScope.slug),
    enabled,
  });

  const items = buildFlatItems(debouncedQuery, data, company?.slug);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length, debouncedQuery]);

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
        const el = document.querySelector(
          `[data-result-index="${selectedIndex}"] a, [data-result-index="${selectedIndex}"] button`
        ) as HTMLElement | null;
        if (el) {
          el.click();
          onClose();
        }
        break;
      }
      case "Escape":
        onClose();
        break;
    }
  }

  function handleResultClick() {
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Search input bar */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-text-primary hover:bg-hover transition-colors -ml-1"
          aria-label="Close search"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <Search size={16} className="text-text-disabled shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={company ? `Search ${company.name}…` : "Search tasks, projects, comments…"}
            className="flex-1 bg-transparent outline-none text-base text-text-primary placeholder:text-text-disabled"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto" onClick={handleResultClick}>
        <CommandBarResults
          query={query}
          debouncedQuery={debouncedQuery}
          data={data}
          isFetching={isFetching}
          items={items}
          selectedIndex={selectedIndex}
          onHover={setSelectedIndex}
          onClose={onClose}
          activeScope={routeScope.id}
          availableScopes={routeScope.available}
          onScopeChange={() => {}}
          mobile
        />
      </div>
    </div>
  );
}
