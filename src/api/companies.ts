import { queryOptions } from "@tanstack/react-query";
import { apiFetch, companyApiUrl } from "./client";
import type { Company } from "./types";

export const companiesQueryOptions = queryOptions({
  queryKey: ["companies"],
  queryFn: () => apiFetch<Company[]>("/companies"),
});

export const myCompaniesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["companies", "mine", userId],
    queryFn: () => apiFetch<Company[]>("/companies/me"),
  });

export const companyQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["companies", slug],
    queryFn: () => apiFetch<Company>(`/companies/${slug}`),
  });

export function createCompany(input: {
  name: string;
  description?: string;
}): Promise<Company> {
  return apiFetch<Company>("/companies", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function companyProjectsUrl(companySlug: string): string {
  return companyApiUrl(companySlug, "/projects");
}
