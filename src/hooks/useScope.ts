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
 * Scope rules (from ui-architecture.md):
 *   /                               → all        (available: all)
 *   /tasks                          → tasks       (available: tasks, all)
 *   /projects                       → projects    (available: projects, all)
 *   /projects/:slug                 → in_project  (available: in_project, all)
 *   /projects/:slug/tasks/:taskId   → in_task     (available: in_task, in_project, all)
 */
export function useScope(): Scope {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // /projects/:slug/tasks/:taskId
  const taskMatch = pathname.match(/^\/projects\/([^/]+)\/tasks\/([^/]+)/);
  if (taskMatch) {
    return {
      id: "in_task",
      contextId: taskMatch[2],
      slug: taskMatch[1],
      available: ["in_task", "in_project", "all"],
    };
  }

  // /projects/:slug  (but not /projects/new or /projects/index)
  const projectMatch = pathname.match(/^\/projects\/([^/]+)(?:\/|$)/);
  if (projectMatch && projectMatch[1] !== "new") {
    return {
      id: "in_project",
      contextId: projectMatch[1],
      slug: projectMatch[1],
      available: ["in_project", "all"],
    };
  }

  // /projects (index)
  if (pathname === "/projects") {
    return { id: "projects", contextId: null, slug: null, available: ["projects", "all"] };
  }

  // /tasks (index or /tasks/new — new is a form, keep tasks scope)
  if (pathname.startsWith("/tasks")) {
    return { id: "tasks", contextId: null, slug: null, available: ["tasks", "all"] };
  }

  // / (home) and everything else
  return { id: "all", contextId: null, slug: null, available: ["all"] };
}
