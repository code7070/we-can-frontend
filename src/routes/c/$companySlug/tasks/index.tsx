import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/c/$companySlug/tasks/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/c/$companySlug", params, replace: true });
  },
});
