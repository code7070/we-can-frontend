import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { companyQueryOptions } from "@/api/companies";
import { CompanyProvider } from "@/context/company-context";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CommandBar } from "@/components/command-bar/CommandBar";

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
      <div className="py-4 relative z-[90]">
        <div className="max-w-content mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Breadcrumb />
          </div>
          <div className="relative shrink-0 flex-1 z-[110]">
            <CommandBar />
          </div>
        </div>
      </div>
      <Outlet />
    </CompanyProvider>
  );
}
