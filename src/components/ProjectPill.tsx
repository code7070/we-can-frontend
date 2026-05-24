import { Link } from "@tanstack/react-router";
import { useCompany } from "@/context/company-context";
import type { Project } from "@/api/types";

interface Props {
  project: Project;
}

export function ProjectPill({ project }: Props) {
  const company = useCompany();
  return (
    <Link
      to="/c/$companySlug/projects/$projectSlug"
      params={{ companySlug: company.slug, projectSlug: project.slug }}
      className="relative group px-3 py-1.5 rounded-full border border-border bg-surface
                 text-sm font-medium text-text-primary
                 hover:bg-accent-subtle hover:border-accent
                 transition-all duration-150 inline-block"
    >
      {project.name}
      <span
        className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                   text-xs bg-text-primary text-white px-2 py-1 rounded
                   opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
      >
        {project.remainingCount} tasks remaining
      </span>
    </Link>
  );
}
