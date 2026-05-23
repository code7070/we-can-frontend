import { apiFetch } from "./client";
import type { SearchResults } from "./types";
import type { ScopeId } from "@/hooks/useScope";

export const searchQueryOptions = (
  q: string,
  scope: ScopeId = "all",
  contextId: string | null = null
) => ({
  queryKey: ["search", q, scope, contextId],
  queryFn: () => {
    const params = new URLSearchParams({ q });
    if (scope !== "all") params.set("scope", scope);
    if (contextId) params.set("context_id", contextId);
    return apiFetch<SearchResults>(`/search?${params}`);
  },
  enabled: q.length > 1,
});
