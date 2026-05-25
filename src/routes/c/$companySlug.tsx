import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { companyQueryOptions } from "@/api/companies";
import { CompanyProvider } from "@/context/company-context";
import { CompanySubHeader } from "@/components/layout/CompanySubHeader";

export const Route = createFileRoute("/c/$companySlug")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(companyQueryOptions(params.companySlug)),
  component: CompanyLayout,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <h1 className="text-xl font-semibold text-text-primary">
        Company not found
      </h1>
      <p className="mt-2 text-text-secondary">
        The URL you visited doesn't match any company.
      </p>
      <a href="/" className="mt-4 inline-block text-accent underline">
        ← Back to WeCan
      </a>
    </div>
  ),
});

function CompanyLayout() {
  const { companySlug } = Route.useParams();
  const { data: company } = useSuspenseQuery(companyQueryOptions(companySlug));

  return (
    <CompanyProvider company={company}>
      <CompanySubHeader />
      <Outlet />
    </CompanyProvider>
  );
}
