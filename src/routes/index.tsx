import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { myCompaniesQueryOptions } from "@/api/companies";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { isLoggedIn, userId } = useAuth();
  if (!isLoggedIn || !userId) return <PublicLanding />;
  return <CompanyPicker userId={userId} />;
}

function CompanyPicker({ userId }: { userId: string }) {
  const { data: companies = [], isLoading } = useQuery(myCompaniesQueryOptions(userId));

  return (
    <main className="mx-auto max-w-[560px] px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">WeCan</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Async work tracker for cross-functional teams.
      </p>

      <div className="mt-8 border-t border-border pt-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Your companies
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-[60px] rounded-xl border border-border bg-surface animate-pulse" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F4F4F5]">
              <Building2 size={18} className="text-text-secondary" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-text-primary">No companies yet</p>
            <p className="mt-1 text-sm text-text-secondary">Create your first company to get started.</p>
            <Link
              to="/company/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-text transition-colors duration-150"
            >
              <Plus size={14} />
              Create a company
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {companies.map((company) => (
              <Link
                key={company.id}
                to="/c/$companySlug"
                params={{ companySlug: company.slug }}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5 hover:bg-[#F4F4F5] hover:border-[#D4D4D8] transition-colors duration-150"
              >
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">{company.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5 font-mono">{company.slug}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {(company.taskCount ?? 0) > 0 && (
                    <span className="text-xs text-text-secondary">
                      {company.taskCount} tasks
                    </span>
                  )}
                  <span className="text-text-disabled">→</span>
                </div>
              </Link>
            ))}

            <Link
              to="/company/new"
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-3.5 text-sm text-text-secondary hover:bg-[#F4F4F5] hover:border-[#D4D4D8] transition-colors duration-150"
            >
              <Plus size={14} />
              Create a company
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <p className="text-xs text-text-secondary">
          Looking for a specific company? Visit its URL directly, e.g.{" "}
          <code className="font-mono text-text-primary">/c/wknd-01HXYZ</code>
        </p>
      </div>
    </main>
  );
}

function PublicLanding() {
  return (
    <main className="mx-auto max-w-[560px] px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">WeCan</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Async work tracker for cross-functional teams.
      </p>

      <div className="mt-8 border-t border-border pt-6 space-y-3 text-sm text-text-secondary">
        <p>Access is URL-based — visit a company directly at <code className="font-mono text-text-primary">/c/your-company-slug</code>.</p>
        <p>Sign in to create companies and manage your work.</p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Link
          to="/login"
          className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-text transition-colors duration-150"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-150"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
