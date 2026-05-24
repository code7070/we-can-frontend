import { useRouterState } from "@tanstack/react-router";

export type ScopeId = "all" | "tasks" | "projects" | "in_project" | "in_task";

export interface Scope {
  /** Scope to pass to GET /search */
  id: ScopeId;
  /** context_id for the default scope (taskId when id is in_task, slug when in_project) */
  contextId: string | null;
  /** Project slug — always set when on any project or task route, used when overriding scope to in_project */
  slug: string | null;
  /** Scopes the user can switch to from the command bar */
  available: ScopeId[];
}

/**
 * Derives the current search scope from the active route.
 *
 * Scope rules (company-scoped routes under /c/{companySlug}/...):
 *   /c/{slug}/projects/{projectSlug}/tasks/{taskId} → in_task
 *   /c/{slug}/projects/{projectSlug}                → in_project
 *   /c/{slug}/projects                              → projects
 *   /c/{slug}/tasks                                 → tasks
 *   /c/{slug}/  and everything else                 → all
 */
export function useScope(): Scope {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // /c/{companySlug}/projects/{projectSlug}/tasks/{taskId}
  const taskMatch = pathname.match(/^\/c\/[^/]+\/projects\/([^/]+)\/tasks\/([^/]+)/);
  if (taskMatch) {
    return {
      id: "in_task",
      contextId: taskMatch[2],
      slug: taskMatch[1],
      available: ["in_task", "in_project", "all"],
    };
  }

  // /c/{companySlug}/projects/{projectSlug} (but not /new)
  const projectMatch = pathname.match(/^\/c\/[^/]+\/projects\/([^/]+)(?:\/|$)/);
  if (projectMatch && projectMatch[1] !== "new") {
    return {
      id: "in_project",
      contextId: projectMatch[1],
      slug: projectMatch[1],
      available: ["in_project", "all"],
    };
  }

  // /c/{companySlug}/projects (index)
  if (pathname.match(/^\/c\/[^/]+\/projects\/?$/)) {
    return { id: "projects", contextId: null, slug: null, available: ["projects", "all"] };
  }

  // /c/{companySlug}/tasks
  if (pathname.match(/^\/c\/[^/]+\/tasks/)) {
    return { id: "tasks", contextId: null, slug: null, available: ["tasks", "all"] };
  }

  // / and everything else
  return { id: "all", contextId: null, slug: null, available: ["all"] };
}
