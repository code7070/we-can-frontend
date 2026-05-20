const MEDIA_URL = import.meta.env.VITE_MEDIA_WORKER_URL ?? "https://wecan-media-worker.underline.my.id";

export interface MediaObject {
  key: string;
  name: string;
  url: string;
  size: number;
  contentType: string | null;
  uploadedAt: string;
}

export interface UploadedMedia {
  key: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

export async function listMedia(): Promise<MediaObject[]> {
  const res = await fetch(`${MEDIA_URL}/api/media/list`);
  if (!res.ok) {
    throw new Error(`Failed to list media (${res.status})`);
  }
  const json = (await res.json()) as { objects: MediaObject[] };
  return json.objects;
}

export async function uploadMedia(file: File): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${MEDIA_URL}/api/media/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }

  return (await res.json()) as UploadedMedia;
}

export async function deleteMedia(key: string): Promise<void> {
  const res = await fetch(`${MEDIA_URL}/api/media/delete/${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete failed (${res.status}): ${text}`);
  }
}

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp", "ico"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "avi", "mkv", "m4v"]);

export function detectMediaType(nameOrKey: string, contentType?: string | null): "image" | "video" | "other" {
  if (contentType) {
    if (contentType.startsWith("image/")) return "image";
    if (contentType.startsWith("video/")) return "video";
  }
  const ext = nameOrKey.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  return "other";
}
