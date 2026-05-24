import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCompanyOptional } from "@/context/company-context";
import { companyProjectQueryOptions } from "@/api/projects";
import { taskQueryOptions } from "@/api/tasks";

export function Breadcrumb() {
  const matches = useRouterState({ select: (s) => s.matches });
  const company = useCompanyOptional();

  const projectMatch = matches.find(
    (m) => "projectSlug" in (m.params as Record<string, string>),
  );
  const taskMatch = matches.find(
    (m) => "taskId" in (m.params as Record<string, string>),
  );

  if (!projectMatch || !company) return null;

  const { projectSlug } = projectMatch.params as { projectSlug: string };
  const taskId = taskMatch ? (taskMatch.params as { taskId: string }).taskId : null;

  return (
    <BreadcrumbInner
      companySlug={company.slug}
      projectSlug={projectSlug}
      taskId={taskId}
    />
  );
}

function BreadcrumbInner({
  companySlug,
  projectSlug,
  taskId,
}: {
  companySlug: string;
  projectSlug: string;
  taskId: string | null;
}) {
  const { data: project } = useQuery({
    ...companyProjectQueryOptions(companySlug, projectSlug),
    staleTime: Infinity,
  });

  const { data: task } = useQuery({
    ...taskQueryOptions(taskId!),
    enabled: !!taskId,
    staleTime: Infinity,
  });

  const projectName = project?.name ?? projectSlug;
  const taskTitle = task?.title;

  return (
    <nav className="flex items-center gap-1 text-sm text-text-secondary min-w-0">
      <Link
        to="/c/$companySlug/projects"
        params={{ companySlug }}
        className="hover:text-text-primary transition-colors shrink-0"
      >
        Projects
      </Link>
      <ChevronRight size={13} className="text-text-disabled shrink-0" />
      {taskId ? (
        <>
          <Link
            to="/c/$companySlug/projects/$projectSlug"
            params={{ companySlug, projectSlug }}
            className="hover:text-text-primary transition-colors truncate max-w-[140px]"
          >
            {projectName}
          </Link>
          <ChevronRight size={13} className="text-text-disabled shrink-0" />
          <span className="text-text-primary truncate max-w-[180px]">
            {taskTitle ?? "Task"}
          </span>
        </>
      ) : (
        <span className="text-text-primary truncate max-w-[200px]">{projectName}</span>
      )}
    </nav>
  );
}
