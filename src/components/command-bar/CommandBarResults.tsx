import { useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Folder,
  CheckSquare,
  MessageCircle,
  LayoutGrid,
  ListTodo,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompanyOptional } from "@/context/company-context";
import { cn } from "@/lib/utils";
import type { SearchResults } from "@/api/types";
import type { ScopeId } from "@/hooks/useScope";

// ─── Scope labels ─────────────────────────────────────────────────────────────

export const SCOPE_LABELS: Record<ScopeId, string> = {
  all: "All",
  tasks: "Tasks",
  projects: "Projects",
  in_project: "In Project",
  in_task: "In Task",
};

// ─── Flat item list ───────────────────────────────────────────────────────────

export type FlatItem =
  | { kind: "action"; key: string; label: string; to: string; icon: React.ReactNode }
  | { kind: "project"; key: string; slug: string; name: string; meta: string }
  | { kind: "task"; key: string; taskId: string; slug: string; title: string; projectName: string }
  | { kind: "comment"; key: string; taskId: string; slug: string; body: string; meta: string }
  | { kind: "view-all"; key: string; query: string };

export function buildFlatItems(query: string, data: SearchResults | undefined, companySlug?: string): FlatItem[] {
  const trimmed = query.trim();

  if (trimmed.length < 2 || !data) {
    if (companySlug) {
      return [
        { kind: "action", key: "q-tasks", label: "Go to Tasks", to: `/c/${companySlug}/tasks/`, icon: <ListTodo size={14} /> },
        { kind: "action", key: "q-projects", label: "Go to Projects", to: `/c/${companySlug}/projects/`, icon: <LayoutGrid size={14} /> },
        { kind: "action", key: "q-new", label: "New Project", to: `/c/${companySlug}/projects/new`, icon: <Plus size={14} /> },
      ];
    }
    return [
      { kind: "action", key: "q-tasks", label: "Go to Tasks", to: "/tasks", icon: <ListTodo size={14} /> },
      { kind: "action", key: "q-projects", label: "Go to Projects", to: "/projects", icon: <LayoutGrid size={14} /> },
      { kind: "action", key: "q-new", label: "New Project", to: "/projects/new", icon: <Plus size={14} /> },
    ];
  }

  const items: FlatItem[] = [];

  data.projects.forEach((p) =>
    items.push({
      kind: "project",
      key: `p-${p.id}`,
      slug: p.slug,
      name: p.name,
      meta: `${p.remainingCount} of ${p.taskCount} remaining`,
    })
  );

  data.tasks.forEach((t) => {
    // Orphan tasks have no project; skip until /tasks/:id route exists
    if (!t.project) return;
    items.push({
      kind: "task",
      key: `t-${t.id}`,
      taskId: t.id,
      slug: t.project.slug,
      title: t.title,
      projectName: t.project.name,
    });
  });

  data.comments.forEach((c) => {
    if (!c.task || !c.task.project) return;
    items.push({
      kind: "comment",
      key: `c-${c.id}`,
      taskId: c.task.id,
      slug: c.task.project.slug,
      body: c.body,
      meta: `${c.task.project.name} · ${c.task.title}`,
    });
  });

  if (items.length > 0) {
    items.push({ kind: "view-all", key: "view-all", query: trimmed });
  }

  return items;
}

// ─── Scope switcher ───────────────────────────────────────────────────────────

function ScopeSwitcher({
  activeScope,
  availableScopes,
  onScopeChange,
}: {
  activeScope: ScopeId;
  availableScopes: ScopeId[];
  onScopeChange: (scope: ScopeId) => void;
}) {
  if (availableScopes.length <= 1) return null;
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
      {availableScopes.map((scope) => (
        <button
          key={scope}
          type="button"
          onClick={() => onScopeChange(scope)}
          className={cn(
            "px-2 py-0.5 rounded text-xs font-medium transition-colors",
            scope === activeScope
              ? "bg-accent-subtle text-accent"
              : "text-text-secondary hover:bg-hover hover:text-text-primary"
          )}
        >
          {SCOPE_LABELS[scope]}
        </button>
      ))}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
      <div className="w-0.5 h-3 bg-border rounded-full shrink-0" />
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Row wrapper ──────────────────────────────────────────────────────────────

function Row({
  index,
  selected,
  onHover,
  children,
  className,
}: {
  index: number;
  selected: boolean;
  onHover: (i: number) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <div
      ref={ref}
      data-result-index={index}
      onMouseEnter={() => onHover(index)}
      className={cn(selected && "bg-hover", className)}
    >
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  query: string;
  debouncedQuery: string;
  data: SearchResults | undefined;
  isFetching: boolean;
  items: FlatItem[];
  selectedIndex: number;
  onHover: (index: number) => void;
  onClose: () => void;
  activeScope: ScopeId;
  availableScopes: ScopeId[];
  onScopeChange: (scope: ScopeId) => void;
  mobile?: boolean;
}

export function CommandBarResults({
  query: _query,
  debouncedQuery,
  data,
  isFetching,
  items,
  selectedIndex,
  onHover,
  onClose,
  activeScope,
  availableScopes,
  onScopeChange,
  mobile = false,
}: Props) {
  const company = useCompanyOptional();
  const navigate = useNavigate();
  const hasQuery = debouncedQuery.trim().length >= 2;
  const hasResults =
    data && (data.projects.length > 0 || data.tasks.length > 0 || data.comments.length > 0);

  return (
    <div
      className={cn(
        !mobile && [
          "absolute left-1/2 top-full z-[120] mt-1.5 -translate-x-1/2 isolate",
          "w-[360px] bg-surface border border-border rounded-xl overflow-hidden",
          "shadow-[0_12px_32px_-8px_rgba(24,24,27,0.14),0_4px_12px_-4px_rgba(24,24,27,0.08)]",
        ]
      )}
    >
      {/* Scope switcher — only when multiple scopes available */}
      <ScopeSwitcher
        activeScope={activeScope}
        availableScopes={availableScopes}
        onScopeChange={onScopeChange}
      />

      <div className="overflow-y-auto max-h-[min(70vh,420px)]">
        {/* Loading skeletons */}
        {isFetching && !data && hasQuery && (
          <div className="p-3 flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
        )}

        {/* No results */}
        {hasQuery && !isFetching && data && !hasResults && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-text-secondary">
              No results for &ldquo;{debouncedQuery.trim()}&rdquo;
            </p>
            <p className="text-xs text-text-disabled mt-1">Try a different keyword</p>
          </div>
        )}

        {/* Quick actions (empty query) */}
        {!hasQuery && (
          <div className="py-1.5">
            <div className="flex items-center gap-2 px-3 pt-2 pb-1">
              <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                Quick actions
              </span>
            </div>
            {items.map((item, i) => {
              if (item.kind !== "action") return null;
              return (
                <Row key={item.key} index={i} selected={selectedIndex === i} onHover={onHover}>
                  <button
                    type="button"
                    onClick={() => { void navigate({ to: item.to as "/" }); onClose(); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary transition-colors w-full"
                  >
                    <span className="text-text-secondary">{item.icon}</span>
                    {item.label}
                  </button>
                </Row>
              );
            })}
          </div>
        )}

        {/* Search results */}
        {hasQuery && data && hasResults && (
          <div className="py-1.5">
            {/* Projects */}
            {data.projects.length > 0 && (
              <section>
                <SectionHeader
                  icon={<Folder size={11} className="text-text-disabled" />}
                  label="Projects"
                />
                {items
                  .map((item, i) => ({ item, i }))
                  .filter(({ item }) => item.kind === "project")
                  .map(({ item, i }) => {
                    if (item.kind !== "project") return null;
                    return (
                      <Row key={item.key} index={i} selected={selectedIndex === i} onHover={onHover}>
                        {company ? (
                          <Link
                            to="/c/$companySlug/projects/$projectSlug"
                            params={{ companySlug: company.slug, projectSlug: item.slug }}
                            onClick={onClose}
                            className="block px-3 py-2 transition-colors"
                          >
                            <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                            <p className="text-xs text-text-secondary">{item.meta}</p>
                          </Link>
                        ) : (
                          <div className="block px-3 py-2">
                            <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                            <p className="text-xs text-text-secondary">{item.meta}</p>
                          </div>
                        )}
                      </Row>
                    );
                  })}
              </section>
            )}

            {/* Tasks */}
            {data.tasks.filter((t) => t.project).length > 0 && (
              <section>
                <SectionHeader
                  icon={<CheckSquare size={11} className="text-text-disabled" />}
                  label="Tasks"
                />
                {items
                  .map((item, i) => ({ item, i }))
                  .filter(({ item }) => item.kind === "task")
                  .map(({ item, i }) => {
                    if (item.kind !== "task") return null;
                    return (
                      <Row key={item.key} index={i} selected={selectedIndex === i} onHover={onHover}>
                        {company ? (
                          <Link
                            to="/c/$companySlug/projects/$projectSlug/tasks/$taskId"
                            params={{ companySlug: company.slug, projectSlug: item.slug, taskId: item.taskId }}
                            onClick={onClose}
                            className="block px-3 py-2 transition-colors"
                          >
                            <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                            <p className="text-xs text-text-secondary">{item.projectName}</p>
                          </Link>
                        ) : (
                          <div className="block px-3 py-2">
                            <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                            <p className="text-xs text-text-secondary">{item.projectName}</p>
                          </div>
                        )}
                      </Row>
                    );
                  })}
              </section>
            )}

            {/* Comments */}
            {data.comments.filter((c) => c.task?.project).length > 0 && (
              <section>
                <SectionHeader
                  icon={<MessageCircle size={11} className="text-text-disabled" />}
                  label="Comments"
                />
                {items
                  .map((item, i) => ({ item, i }))
                  .filter(({ item }) => item.kind === "comment")
                  .map(({ item, i }) => {
                    if (item.kind !== "comment") return null;
                    return (
                      <Row key={item.key} index={i} selected={selectedIndex === i} onHover={onHover}>
                        {company ? (
                          <Link
                            to="/c/$companySlug/projects/$projectSlug/tasks/$taskId"
                            params={{ companySlug: company.slug, projectSlug: item.slug, taskId: item.taskId }}
                            onClick={onClose}
                            className="block px-3 py-2 transition-colors"
                          >
                            <p className="text-sm text-text-primary line-clamp-2">{item.body}</p>
                            <p className="text-xs text-text-secondary mt-0.5 truncate">{item.meta}</p>
                          </Link>
                        ) : (
                          <div className="block px-3 py-2">
                            <p className="text-sm text-text-primary line-clamp-2">{item.body}</p>
                            <p className="text-xs text-text-secondary mt-0.5 truncate">{item.meta}</p>
                          </div>
                        )}
                      </Row>
                    );
                  })}
              </section>
            )}
          </div>
        )}
      </div>

      {/* Footer: view all — search page removed, results are inline */}
    </div>
  );
}
