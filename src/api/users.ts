import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "./client";
import type { User, CreateUserInput } from "./types";

export const usersQueryOptions = queryOptions({
  queryKey: ["users"],
  queryFn: () => apiFetch<User[]>("/users"),
});

export function createUser(input: CreateUserInput): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Self-registration (/register page) — auto-logs in with returned token
export function registerUser(input: CreateUserInput): Promise<{ user: User; token: string }> {
  return apiFetch<{ user: User; token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
