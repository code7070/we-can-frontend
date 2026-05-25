import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useCompany } from "@/context/company-context";
import { useAuth } from "@/hooks/useAuth";
import { companyProjectsQueryOptions } from "@/api/projects";
import { ProjectTaskGroup, OrphanTaskGroup } from "@/components/ProjectTaskGroup";
import { cn } from "@/lib/utils";
import type { TasksFilter } from "@/api/tasks";
import type { TaskListItem, Project } from "@/api/types";

export const Route = createFileRoute("/c/$companySlug/")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(companyProjectsQueryOptions(params.companySlug)),
  component: CompanyHome,
});

// ── Types ────────────────────────────────────────────────────────────────────

type FilterKey = "open" | "my" | "closed" | "unassigned";
type SortKey = "most-remaining" | "name" | "progress";

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "my", label: "My tasks" },
  { id: "closed", label: "Closed" },
  { id: "unassigned", label: "Unassigned" },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: "most-remaining", label: "Most remaining" },
  { id: "name", label: "Name" },
  { id: "progress", label: "Progress" },
];

const TOP_N_OPEN = 3;

// ── Helpers ──────────────────────────────────────────────────────────────────

function filterToApiParams(filter: FilterKey, userId: string | undefined): TasksFilter {
  if (filter === "open") return { is_done: "false" };
  if (filter === "my" && userId) return { assignee_id: userId, is_done: "false" };
  if (filter === "closed") return { is_done: "true", closed_within_days: 120 };
  if (filter === "unassigned") return { is_done: "false" }; // client-side post-filter
  return { is_done: "false" };
}

function clientFilterFn(filter: FilterKey): ((tasks: TaskListItem[]) => TaskListItem[]) | undefined {
  if (filter === "unassigned") return (tasks) => tasks.filter((t) => t.assignees.length === 0);
  return undefined;
}

function sortProjects(projects: Project[], sort: SortKey): Project[] {
  return [...projects].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "progress") {
      const pctA = a.taskCount === 0 ? 0 : (a.taskCount - a.remainingCount) / a.taskCount;
      const pctB = b.taskCount === 0 ? 0 : (b.taskCount - b.remainingCount) / b.taskCount;
      return pctB - pctA;
    }
    // most-remaining: most open tasks first
    return b.remainingCount - a.remainingCount;
  });
}

// ── Main view ────────────────────────────────────────────────────────────────

function ProjectsView() {
  const company = useCompany();
  const { isLoggedIn, userId } = useAuth();
  const [filter, setFilter] = useState<FilterKey>("open");
  const [sort, setSort] = useState<SortKey>("most-remaining");

  const { data: projects } = useSuspenseQuery(companyProjectsQueryOptions(company.slug));

  const sorted = useMemo(() => sortProjects(projects, sort), [projects, sort]);

  const apiFilter = useMemo(
    () => filterToApiParams(filter, userId ?? undefined),
    [filter, userId],
  );
  const clientFilter = useMemo(() => clientFilterFn(filter), [filter]);

  // Top N projects with open tasks expand by default; rest start collapsed
  const openByDefault = useMemo(() => {
    const withOpen = sorted.filter((p) => p.remainingCount > 0);
    const topIds = new Set(withOpen.slice(0, TOP_N_OPEN).map((p) => p.id));
    return topIds;
  }, [sorted]);

  return (
    <>
      {/* Filter chips */}
      <div className="flex items-center gap-1 flex-wrap mb-5">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            disabled={id === "my" && !isLoggedIn}
            onClick={() => setFilter(id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150",
              filter === id
                ? "bg-accent/10 text-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-hover",
              id === "my" && !isLoggedIn && "opacity-40 cursor-not-allowed",
            )}
          >
            {label}
          </button>
        ))}
        {/* Sort */}
        <div className="ml-auto flex items-center gap-0.5">
          {SORTS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSort(id)}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
                sort === id
                  ? "bg-hover text-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-hover",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Orphan tasks group */}
      <OrphanTaskGroup
        companySlug={company.slug}
        apiFilter={apiFilter}
        isLoggedIn={isLoggedIn}
        clientFilter={clientFilter}
      />

      {/* Project groups */}
      {sorted.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl bg-surface py-12 px-6 text-center">
          <p className="text-sm text-text-secondary">No projects yet.</p>
          {isLoggedIn && (
            <Link
              to="/c/$companySlug/projects/new"
              params={{ companySlug: company.slug }}
              className="mt-2 inline-block text-sm font-semibold text-accent hover:text-accent-text
                         transition-colors duration-150"
            >
              Create your first project
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {sorted.map((project) => (
            <ProjectTaskGroup
              key={project.id}
              project={project}
              companySlug={company.slug}
              defaultOpen={openByDefault.has(project.id)}
              apiFilter={apiFilter}
              isLoggedIn={isLoggedIn}
              clientFilter={clientFilter}
            />
          ))}
        </div>
      )}
    </>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-2 mt-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded bg-hover animate-pulse shrink-0" />
          <div className="h-4 flex-1 rounded bg-hover animate-pulse" />
          <div className="h-2 w-20 rounded-full bg-hover animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function CompanyHome() {
  const company = useCompany();
  const { isLoggedIn } = useAuth();

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            {company.name}
          </h1>
          {company.description && (
            <p className="mt-1 text-sm text-text-secondary">{company.description}</p>
          )}
        </div>
        {isLoggedIn && (
          <Link
            to="/c/$companySlug/projects/new"
            params={{ companySlug: company.slug }}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg
                       text-xs sm:text-sm font-semibold border border-border bg-surface
                       text-text-primary hover:bg-hover transition-colors duration-150 shrink-0"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New project</span>
            <span className="sm:hidden">Project</span>
          </Link>
        )}
      </div>

      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsView />
      </Suspense>
    </div>
  );
}
