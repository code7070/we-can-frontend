import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Task, TaskDetail, TaskListResponse, CreateTaskInput } from "./types";

export const taskQueryOptions = (taskId: string) =>
  queryOptions({
    queryKey: ["task", taskId],
    queryFn: () => apiFetch<TaskDetail>(`/tasks/${taskId}`),
  });

export type TasksFilter = {
  assignee_id?: string;
  project_id?: string;
  is_done?: "true" | "false";
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
  dueDate?: string;
}

export function createStandaloneTask(input: CreateStandaloneTaskInput): Promise<Task> {
  return apiFetch<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createTask(projectSlug: string, input: CreateTaskInput): Promise<Task> {
  const { groupId, linkedTaskIds, ...body } = input;
  return apiFetch<Task>(`/projects/${projectSlug}/groups/${groupId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ ...body, linkedTaskIds }),
  });
}
