import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useCompany } from "@/context/company-context";
import type { Project } from "@/api/types";

interface Props {
  project: Project;
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  const complete = total > 0 && value === total;

  return (
    <div className="space-y-1.5">
      <div className="h-1.5 rounded-full bg-hover overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            complete ? "bg-success" : "bg-accent"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-text-secondary">
        {total === 0 ? (
          "No tasks yet"
        ) : complete ? (
          <span className="text-success font-medium">All {total} tasks done</span>
        ) : (
          <>{value} of {total} tasks done</>
        )}
      </p>
    </div>
  );
}

export function ProjectCard({ project }: Props) {
  const company = useCompany();
  const doneCount = project.taskCount - project.remainingCount;

  return (
    <Link
      to="/c/$companySlug/projects/$projectSlug"
      params={{ companySlug: company.slug, projectSlug: project.slug }}
      className="group flex flex-col gap-3 p-5 rounded-xl border border-border bg-surface
                 hover:border-accent/40 hover:shadow-[0_2px_8px_rgba(37,99,235,0.08)]
                 transition-all duration-150"
    >
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors duration-150 truncate">
          {project.name}
        </h2>
        {project.description && (
          <p className="mt-1 text-xs text-text-secondary line-clamp-1">
            {project.description}
          </p>
        )}
      </div>

      <ProgressBar value={doneCount} total={project.taskCount} />
    </Link>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-surface">
      <div className="space-y-1.5">
        <div className="h-4 w-2/3 rounded bg-hover animate-pulse" />
        <div className="h-3 w-full rounded bg-hover animate-pulse" />
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 rounded-full bg-hover animate-pulse" />
        <div className="h-3 w-24 rounded bg-hover animate-pulse" />
      </div>
    </div>
  );
}
