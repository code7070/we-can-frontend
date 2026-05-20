import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { Task, TaskDetail, CreateTaskInput } from "./types";

export const taskQueryOptions = (taskId: string) =>
  queryOptions({
    queryKey: ["task", taskId],
    queryFn: () => apiFetch<TaskDetail>(`/tasks/${taskId}`),
  });

export function createTask(projectSlug: string, input: CreateTaskInput): Promise<Task> {
  const { groupId, linkedTaskIds, ...body } = input;
  return apiFetch<Task>(`/projects/${projectSlug}/groups/${groupId}/tasks`, {
    method: "POST",
    body: JSON.stringify({ ...body, linkedTaskIds }),
  });
}
