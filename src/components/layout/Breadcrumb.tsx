import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

function formatSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function Breadcrumb() {
  const matches = useRouterState({ select: (s) => s.matches });

  const projectMatch = matches.find((m) => "slug" in (m.params as Record<string, string>));
  const taskMatch = matches.find((m) => "taskId" in (m.params as Record<string, string>));

  if (!projectMatch) return null;

  const { slug } = projectMatch.params as { slug: string };

  return (
    <nav className="flex items-center gap-1 text-sm text-text-secondary min-w-0">
      <Link
        to="/projects"
        className="hover:text-text-primary transition-colors shrink-0"
      >
        Projects
      </Link>
      <ChevronRight size={13} className="text-text-disabled shrink-0" />
      {taskMatch ? (
        <>
          <Link
            to="/projects/$slug"
            params={{ slug }}
            className="hover:text-text-primary transition-colors truncate max-w-[140px]"
          >
            {formatSlug(slug)}
          </Link>
          <ChevronRight size={13} className="text-text-disabled shrink-0" />
          <span className="text-text-primary truncate max-w-[140px]">Task</span>
        </>
      ) : (
        <span className="text-text-primary truncate max-w-[200px]">{formatSlug(slug)}</span>
      )}
    </nav>
  );
}
