import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Project, ProjectDetail, CreateProjectInput, UpdateProjectInput } from "./types";

export const projectsQueryOptions = queryOptions({
  queryKey: ["projects"],
  queryFn: () => apiFetch<Project[]>("/projects"),
});

export const projectQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["project", slug],
    queryFn: () => apiFetch<ProjectDetail>(`/projects/${slug}`),
  });

export function createProject(input: CreateProjectInput): Promise<Project> {
  return apiFetch<Project>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProject(slug: string, input: UpdateProjectInput): Promise<Project> {
  return apiFetch<Project>(`/projects/${slug}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function createGroup(projectSlug: string, title: string, sortOrder?: number) {
  return apiFetch<{ id: string; title: string; sortOrder: number }>(
    `/projects/${projectSlug}/groups`,
    {
      method: "POST",
      body: JSON.stringify({ title, sortOrder }),
    }
  );
}
