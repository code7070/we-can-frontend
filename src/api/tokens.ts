import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { ApiToken, CreatedApiToken } from "./types";

export const tokensQueryOptions = queryOptions({
  queryKey: ["api-tokens"],
  queryFn: () => apiFetch<ApiToken[]>("/api-tokens"),
});

export function createToken(name: string): Promise<CreatedApiToken> {
  return apiFetch<CreatedApiToken>("/api-tokens", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function revokeToken(id: string): Promise<{ revoked: boolean }> {
  return apiFetch<{ revoked: boolean }>(`/api-tokens/${id}`, {
    method: "DELETE",
  });
}
