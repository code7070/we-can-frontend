import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowRight, X, Folder, CheckSquare, MessageCircle } from "lucide-react";
import { searchQueryOptions } from "@/api/search";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Variant = "hero" | "compact";

interface Props {
  variant?: Variant;
  defaultValue?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

export function GlobalSearchBar({
  variant = "compact",
  defaultValue = "",
  autoFocus = false,
  placeholder,
}: Props) {
  const navigate = useNavigate();
  const [value, setValue] = useState(defaultValue);
  const [debouncedValue, setDebouncedValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const enabled = debouncedValue.trim().length > 1;
  const { data, isFetching } = useQuery({
    ...searchQueryOptions(debouncedValue.trim()),
    enabled,
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (value.trim()) {
        setOpen(false);
        inputRef.current?.blur();
        void navigate({ to: "/search", search: { q: value.trim() } });
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  function handleResultClick() {
    setOpen(false);
    setValue("");
  }

  function handleClear() {
    setValue("");
    setDebouncedValue("");
    inputRef.current?.focus();
  }

  const hasQuery = value.trim().length > 1;
  const showDropdown = open && hasQuery;
  const hasResults =
    data &&
    (data.projects.length > 0 ||
      data.tasks.length > 0 ||
      data.comments.length > 0);

  const isHero = variant === "hero";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative",
        isHero ? "w-full max-w-search" : "w-full max-w-[360px]"
      )}
    >
      <Search
        className={cn(
          "absolute top-1/2 -translate-y-1/2 transition-colors duration-150 pointer-events-none",
          isHero ? "left-4 w-5 h-5" : "left-3 w-4 h-4",
          focused ? "text-accent" : "text-text-disabled"
        )}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setFocused(true);
          if (hasQuery) setOpen(true);
        }}
        onBlur={() => setFocused(false)}
        placeholder={
          placeholder ?? "Search tasks, projects, threads…"
        }
        className={cn(
          "w-full bg-surface text-text-primary placeholder:text-text-disabled outline-none transition-all duration-150",
          isHero
            ? "pl-12 pr-10 py-3.5 rounded-xl border-[1.5px] text-base"
            : "pl-9 pr-8 py-1.5 rounded-lg border text-sm",
          focused
            ? isHero
              ? "border-accent shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
              : "border-accent shadow-[0_0_0_2px_rgba(37,99,235,0.12)]"
            : "border-border"
        )}
      />

      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary transition-colors",
            isHero ? "right-4" : "right-2.5"
          )}
        >
          <X size={isHero ? 16 : 13} />
        </button>
      )}

      {showDropdown && (
        <div
          className={cn(
            "absolute left-0 right-0 z-50 mt-2 rounded-xl border border-border bg-surface overflow-hidden",
            "shadow-[0_12px_32px_-8px_rgba(24,24,27,0.12),0_4px_12px_-4px_rgba(24,24,27,0.08)]"
          )}
          style={{ maxHeight: "min(70vh, 480px)" }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: "calc(min(70vh, 480px) - 44px)" }}>
            {isFetching && !data && (
              <div className="p-3 flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-md" />
                ))}
              </div>
            )}

            {!isFetching && data && !hasResults && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-text-secondary">
                  No results for &ldquo;{debouncedValue}&rdquo;
                </p>
                <p className="text-xs text-text-disabled mt-1">
                  Try a different keyword
                </p>
              </div>
            )}

            {data && hasResults && (
              <div className="py-2">
                {data.projects.length > 0 && (
                  <ResultSection
                    icon={<Folder size={12} className="text-text-disabled" />}
                    title="Projects"
                  >
                    {data.projects.map((p) => (
                      <Link
                        key={p.id}
                        to="/projects/$slug"
                        params={{ slug: p.slug }}
                        onClick={handleResultClick}
                        className="block px-4 py-2 hover:bg-[#F4F4F5] transition-colors"
                      >
                        <p className="text-sm font-medium text-text-primary truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {p.remainingCount} of {p.taskCount} remaining
                        </p>
                      </Link>
                    ))}
                  </ResultSection>
                )}

                {data.tasks.length > 0 && (
                  <ResultSection
                    icon={<CheckSquare size={12} className="text-text-disabled" />}
                    title="Tasks"
                  >
                    {data.tasks.map((t) => (
                      <Link
                        key={t.id}
                        to="/projects/$slug/tasks/$taskId"
                        params={{ slug: t.project.slug, taskId: t.id }}
                        onClick={handleResultClick}
                        className="block px-4 py-2 hover:bg-[#F4F4F5] transition-colors"
                      >
                        <p className="text-sm font-medium text-text-primary truncate">
                          {t.title}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {t.project.name}
                        </p>
                      </Link>
                    ))}
                  </ResultSection>
                )}

                {data.comments.length > 0 && (
                  <ResultSection
                    icon={<MessageCircle size={12} className="text-text-disabled" />}
                    title="Comments"
                  >
                    {data.comments.map((c) => (
                      <Link
                        key={c.id}
                        to="/projects/$slug/tasks/$taskId"
                        params={{
                          slug: c.task.project.slug,
                          taskId: c.task.id,
                        }}
                        onClick={handleResultClick}
                        className="block px-4 py-2 hover:bg-[#F4F4F5] transition-colors"
                      >
                        <p className="text-sm text-text-primary line-clamp-2">
                          {c.body}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5 truncate">
                          {c.task.project.name} · {c.task.title}
                        </p>
                      </Link>
                    ))}
                  </ResultSection>
                )}
              </div>
            )}
          </div>

          {hasQuery && (
            <Link
              to="/search"
              search={{ q: value.trim() }}
              onClick={handleResultClick}
              className="flex items-center justify-between px-4 py-2.5 border-t border-border text-sm font-medium text-accent hover:bg-accent-subtle transition-colors"
            >
              <span>View all results for &ldquo;{value.trim()}&rdquo;</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pb-2 last:pb-0">
      <div className="flex items-center gap-2 px-4 pt-2 pb-1">
        <div className="w-0.5 h-3 bg-border rounded-full shrink-0" />
        <div className="flex items-center gap-1.5">
          {icon}
          <h3 className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
            {title}
          </h3>
        </div>
      </div>
      {children}
    </section>
  );
}
