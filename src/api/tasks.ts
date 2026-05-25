import { queryOptions } from "@tanstack/react-query";
import { apiFetch, companyApiUrl } from "./client";
import { ApiError } from "@/lib/api-error";
import type { Task, TaskDetail, TaskListResponse, CreateTaskInput } from "./types";

export const taskQueryOptions = (taskId: string) =>
  queryOptions({
    queryKey: ["task", taskId],
    queryFn: () => apiFetch<TaskDetail>(`/tasks/${taskId}`),
  });

export type TasksFilter = {
  assignee_id?: string;
  project_id?: string;
  project_ids?: string[]; // batch fetch for multiple projects
  is_done?: "true" | "false";
  closed_within_days?: number;
  q?: string;
};

export const tasksListQueryOptions = (filters: TasksFilter = {}) =>
  queryOptions({
    queryKey: ["tasks", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.assignee_id) params.set("assignee_id", filters.assignee_id);
      if (filters.project_id) params.set("project_id", filters.project_id);
      if (filters.is_done) params.set("is_done", filters.is_done);
      if (filters.closed_within_days)
        params.set("closed_within_days", String(filters.closed_within_days));
      params.set("limit", "100");
      const qs = params.toString();
      return apiFetch<TaskListResponse>(`/tasks${qs ? `?${qs}` : ""}`);
    },
  });

export function patchTask(taskId: string, body: { isDone?: boolean }): Promise<Task> {
  return apiFetch<Task>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export interface CreateStandaloneTaskInput {
  title: string;
  description?: string;
  projectId?: string | null;
  groupId?: string | null;
  assigneeIds?: string[];
  linkedTaskIds?: string[];
  dueDate?: string;
}

export async function createStandaloneTask(
  companySlug: string,
  input: CreateStandaloneTaskInput
): Promise<Task> {
  const token = localStorage.getItem("taskflow_token");
  const res = await fetch(companyApiUrl(companySlug, "/tasks"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string; fields?: Record<string, string[]> };
    };
    throw new ApiError({
      code: body.error?.code ?? "UNKNOWN_ERROR",
      message: body.error?.message ?? "Request failed",
      status: res.status,
      fields: body.error?.fields,
    });
  }

  const body = await res.json();
  return (body.data ?? body) as Task;
}

export function createTask(projectSlug: string, input: CreateTaskInput): Promise<Task> {
  const { groupId, linkedTaskIds, ...body } = input;
  return apiFetch<Task>(`/projects/${projectSlug}/groups/${groupId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ ...body, linkedTaskIds }),
  });
}

export const companyTasksListQueryOptions = (
  companySlug: string,
  filters: TasksFilter = {}
) =>
  queryOptions({
    queryKey: ["companies", companySlug, "tasks", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.assignee_id) params.set("assignee_id", filters.assignee_id);
      if (filters.project_id) params.set("project_id", filters.project_id);
      if (filters.project_ids?.length) params.set("project_ids", filters.project_ids.join(","));
      if (filters.is_done) params.set("is_done", filters.is_done);
      if (filters.closed_within_days)
        params.set("closed_within_days", String(filters.closed_within_days));
      params.set("limit", "100");
      const qs = params.toString();
      return apiFetch<TaskListResponse>(
        `/c/${companySlug}/tasks${qs ? `?${qs}` : ""}`
      );
    },
  });
