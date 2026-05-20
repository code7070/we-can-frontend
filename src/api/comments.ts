import { apiFetch } from "./client";

export function postComment(taskId: string, body: string) {
  return apiFetch(`/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function uploadAttachment(taskId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch(`/tasks/${taskId}/attachments`, {
    method: "POST",
    body: form,
    headers: {},
  });
}
