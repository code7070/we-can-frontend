import { queryOptions } from "@tanstack/react-query";
import { apiFetch, companyApiUrl } from "./client";
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

export function renameGroup(projectSlug: string, groupId: string, title: string) {
  return apiFetch<{ id: string; title: string; sortOrder: number }>(
    `/projects/${projectSlug}/groups/${groupId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }
  );
}

export function deleteGroup(projectSlug: string, groupId: string) {
  return apiFetch<{ deleted: boolean }>(
    `/projects/${projectSlug}/groups/${groupId}`,
    { method: "DELETE" }
  );
}

export const companyProjectsQueryOptions = (companySlug: string) =>
  queryOptions({
    queryKey: ["companies", companySlug, "projects"],
    queryFn: () => {
      const url = companyApiUrl(companySlug, "/projects");
      return fetch(url).then((r) => r.json()).then((r) => r.data as Project[]);
    },
  });

export const companyProjectQueryOptions = (companySlug: string, projectSlug: string) =>
  queryOptions({
    queryKey: ["companies", companySlug, "project", projectSlug],
    queryFn: () => {
      const url = companyApiUrl(companySlug, `/projects/${projectSlug}`);
      return fetch(url).then((r) => r.json()).then((r) => r.data as ProjectDetail);
    },
  });

export function createCompanyProject(
  companySlug: string,
  input: CreateProjectInput
): Promise<Project> {
  const token = localStorage.getItem("taskflow_token");
  return fetch(companyApiUrl(companySlug, "/projects"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  })
    .then((r) => r.json())
    .then((r) => r.data as Project);
}

export function updateCompanyProject(
  companySlug: string,
  projectSlug: string,
  input: UpdateProjectInput
): Promise<Project> {
  const token = localStorage.getItem("taskflow_token");
  return fetch(companyApiUrl(companySlug, `/projects/${projectSlug}`), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  })
    .then((r) => r.json())
    .then((r) => r.data as Project);
}
