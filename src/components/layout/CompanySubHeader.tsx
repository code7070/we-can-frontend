import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus, ListChecks, FolderKanban } from "lucide-react";
import { useCompany } from "@/context/company-context";
import { useAuth } from "@/hooks/useAuth";
import { CommandBar } from "@/components/command-bar/CommandBar";
import { companyProjectQueryOptions } from "@/api/projects";
import { taskQueryOptions } from "@/api/tasks";

function NewActionDropdown({ companySlug }: { companySlug: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-2.5 sm:px-3 h-8 rounded-md text-sm font-medium bg-accent hover:bg-accent-text text-white transition-colors"
      >
        <Plus size={14} />
        <span className="hidden sm:inline">New</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[140] mt-1.5 w-44 rounded-lg border border-border bg-surface py-1 shadow-md">
          <Link
            to="/c/$companySlug/tasks/new"
            params={{ companySlug }}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-hover transition-colors"
          >
            <ListChecks size={14} className="text-text-secondary" />
            New task
          </Link>
          <Link
            to="/c/$companySlug/projects/new"
            params={{ companySlug }}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-hover transition-colors"
          >
            <FolderKanban size={14} className="text-text-secondary" />
            New project
          </Link>
        </div>
      )}
    </div>
  );
}

export function CompanySubHeader() {
  const company = useCompany();
  const { isLoggedIn } = useAuth();
  const matches = useRouterState({ select: (s) => s.matches });

  const projectMatch = matches.find(
    (m) => "projectSlug" in (m.params as Record<string, string>),
  );
  const taskMatch = matches.find(
    (m) => "taskId" in (m.params as Record<string, string>),
  );

  const projectSlug = projectMatch
    ? (projectMatch.params as { projectSlug: string }).projectSlug
    : null;
  const taskId = taskMatch
    ? (taskMatch.params as { taskId: string }).taskId
    : null;

  const { data: project } = useQuery({
    ...companyProjectQueryOptions(company.slug, projectSlug!),
    enabled: !!projectSlug,
    staleTime: Infinity,
  });
  const { data: task } = useQuery({
    ...taskQueryOptions(taskId!),
    enabled: !!taskId,
    staleTime: Infinity,
  });

  const showBreadcrumb = !!projectSlug;

  return (
    <div className="bg-bg/95 backdrop-blur sticky top-12 sm:top-14 z-[90]">
      <div className="max-w-content mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-3">
        {/* Left: company name + tabs or breadcrumb tail */}
        <nav className="flex items-center gap-1 min-w-0 text-sm">
          {/*<Link
            to="/c/$companySlug"
            params={{ companySlug: company.slug }}
            className={cn(
              "font-semibold transition-colors truncate shrink-0 max-w-[160px] sm:max-w-[220px]",
              showBreadcrumb
                ? "text-text-secondary hover:text-text-primary"
                : "text-text-primary",
            )}
            title={company.name}
          >
            {company.name}
          </Link>*/}

          {showBreadcrumb && (
            <>
              <ChevronRight
                size={13}
                className="text-text-disabled shrink-0 mx-0.5"
              />
              {taskId ? (
                <>
                  <Link
                    to="/c/$companySlug/projects/$projectSlug"
                    params={{
                      companySlug: company.slug,
                      projectSlug: projectSlug!,
                    }}
                    className="hover:text-text-primary transition-colors text-text-secondary truncate max-w-[120px] sm:max-w-[160px]"
                  >
                    {project?.name ?? projectSlug}
                  </Link>
                  <ChevronRight
                    size={13}
                    className="text-text-disabled shrink-0 mx-0.5"
                  />
                  <span className="text-text-primary truncate max-w-[140px] sm:max-w-[220px]">
                    {task?.title ?? "Task"}
                  </span>
                </>
              ) : (
                <span className="text-text-primary truncate max-w-[200px] sm:max-w-[320px]">
                  {project?.name ?? projectSlug}
                </span>
              )}
            </>
          )}
        </nav>

        {/* Right: + New + desktop CommandBar */}
        <div className="flex items-center gap-2 shrink-0">
          {isLoggedIn && <NewActionDropdown companySlug={company.slug} />}
          <div className="hidden lg:block w-[280px] relative z-[110]">
            <CommandBar />
          </div>
        </div>
      </div>
    </div>
  );
}
