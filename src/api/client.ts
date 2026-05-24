import { ApiError } from "@/lib/api-error";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8787/api/v1";

export function companyApiUrl(companySlug: string, path: string): string {
  return `${BASE_URL}/c/${companySlug}${path}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("taskflow_token");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as {
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
  return (body.data ?? body) as T;
}
