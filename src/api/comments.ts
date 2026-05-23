import { apiFetch } from "./client";

export function postComment(taskId: string, body: string) {
  return apiFetch(`/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

