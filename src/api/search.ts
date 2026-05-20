import { apiFetch } from "./client";
import type { SearchResults } from "./types";

export const searchQueryOptions = (q: string) => ({
  queryKey: ["search", q],
  queryFn: () =>
    apiFetch<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
  enabled: q.length > 1,
});
