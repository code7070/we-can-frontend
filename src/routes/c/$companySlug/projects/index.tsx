import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { companyProjectsQueryOptions } from "@/api/projects";
import { companyTasksListQueryOptions } from "@/api/tasks";
import { ProjectCard, ProjectCardSkeleton } from "@/components/ProjectCard";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/context/company-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/c/$companySlug/projects/")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(companyProjectsQueryOptions(params.companySlug)),
  component: ProjectsPage,
});

// ── Orphan banner ────────────────────────────────────────────────────────────

function OrphanBanner() {
  const company = useCompany();
  const { data } = useQuery({
    ...companyTasksListQueryOptions(company.slug, { project_id: "null" }),
    select: (d) => d.total,
  });

  if (!data || data === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl
                    bg-[#FFFBEB] border border-[#FDE68A] mb-6">
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertCircle size={15} className="text-[#D97706] shrink-0" strokeWidth={2} />
        <p className="text-sm text-[#92400E]">
          <span className="font-semibold">{data}</span>{" "}
          {data === 1 ? "task has" : "tasks have"} no project.
        </p>
      </div>
      <Link
        to="/c/$companySlug/tasks"
        params={{ companySlug: company.slug }}
        className="text-sm font-medium text-[#D97706] hover:text-[#92400E] whitespace-nowrap
                   transition-colors duration-150 shrink-0"
      >
        View tasks
      </Link>
    </div>
  );
}

// ── Sort control ─────────────────────────────────────────────────────────────

type SortKey = "name" | "progress" | "remaining";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "progress", label: "Progress" },
  { id: "remaining", label: "Most remaining" },
];

// ── Projects grid ─────────────────────────────────────────────────────────────

function ProjectsGrid() {
  const company = useCompany();
  const { data: projects } = useSuspenseQuery(companyProjectsQueryOptions(company.slug));
  const [sort, setSort] = useState<SortKey>("name");

  const sorted = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "progress") {
        const pctA = a.taskCount === 0 ? 0 : (a.taskCount - a.remainingCount) / a.taskCount;
        const pctB = b.taskCount === 0 ? 0 : (b.taskCount - b.remainingCount) / b.taskCount;
        return pctB - pctA;
      }
      // remaining: most first
      return b.remainingCount - a.remainingCount;
    });
  }, [projects, sort]);

  return (
    <>
      {/* Sort tabs */}
      <div className="flex items-center gap-0.5 mb-5">
        {SORT_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setSort(id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150",
              sort === id
                ? "bg-accent/10 text-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl bg-surface py-12 px-6 text-center">
          <p className="text-sm text-text-secondary">No projects yet.</p>
          <Link
            to="/c/$companySlug/projects/new"
            params={{ companySlug: company.slug }}
            className="mt-2 inline-block text-sm font-semibold text-accent hover:text-accent-text
                       transition-colors duration-150"
          >
            Create your first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  );
}

function ProjectsSkeleton() {
  return (
    <>
      {/* Sort tabs skeleton */}
      <div className="flex items-center gap-1 mb-5">
        {[48, 64, 96].map((w) => (
          <div key={w} className={`h-8 rounded-md bg-[#F4F4F5] animate-pulse`} style={{ width: w }} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function ProjectsPage() {
  const { isLoggedIn } = useAuth();
  const company = useCompany();

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">Projects</h1>
        {isLoggedIn && (
          <Link
            to="/c/$companySlug/projects/new"
            params={{ companySlug: company.slug }}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold
                       bg-accent hover:bg-accent-text text-white transition-colors duration-150 shrink-0"
          >
            <Plus size={14} className="sm:size-[15]" />
            <span className="hidden sm:inline">New project</span>
            <span className="sm:hidden">New</span>
          </Link>
        )}
      </div>

      {/* Orphan tasks banner */}
      <OrphanBanner />

      {/* Projects grid */}
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsGrid />
      </Suspense>
    </div>
  );
}
