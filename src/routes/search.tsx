import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { searchQueryOptions } from "@/api/search";
import { SearchBar } from "@/components/SearchBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder, CheckSquare, MessageCircle } from "lucide-react";

const searchSchema = z.object({ q: z.string().default("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isLoading } = useQuery(searchQueryOptions(q));

  function handleSearch(newQ: string) {
    void navigate({ search: { q: newQ } });
  }

  const hasResults =
    data &&
    (data.projects.length > 0 ||
      data.tasks.length > 0 ||
      data.comments.length > 0);

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-5 sm:gap-6">
      <SearchBar defaultValue={q} onSearch={handleSearch} />

      {isLoading && q.length > 1 && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && q.length > 1 && !hasResults && (
        <p className="text-sm text-text-secondary text-center py-8">
          No results for &ldquo;{q}&rdquo;. Try a different keyword.
        </p>
      )}

      {data && hasResults && (
        <div className="flex flex-col gap-8">
          {data.projects.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-0.5 h-3.5 bg-border rounded-full shrink-0" />
                <div className="flex items-center gap-1.5">
                  <Folder size={13} className="text-text-disabled" />
                  <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Projects
                  </h2>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {data.projects.map((p) => (
                  <Link
                    key={p.id}
                    to="/projects/$slug"
                    params={{ slug: p.slug }}
                    className="px-4 py-2.5 rounded-lg hover:bg-[#F4F4F5] transition-colors text-sm font-medium text-text-primary"
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.tasks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-0.5 h-3.5 bg-border rounded-full shrink-0" />
                <div className="flex items-center gap-1.5">
                  <CheckSquare size={13} className="text-text-disabled" />
                  <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Tasks
                  </h2>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {data.tasks.map((t) => (
                  <Link
                    key={t.id}
                    to="/projects/$slug/tasks/$taskId"
                    params={{ slug: t.project.slug, taskId: t.id }}
                    className="px-4 py-2.5 rounded-lg hover:bg-[#F4F4F5] transition-colors"
                  >
                    <p className="text-sm font-medium text-text-primary">
                      {t.title}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {t.project.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.comments.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-0.5 h-3.5 bg-border rounded-full shrink-0" />
                <div className="flex items-center gap-1.5">
                  <MessageCircle size={13} className="text-text-disabled" />
                  <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Comments
                  </h2>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {data.comments.map((c) => (
                  <Link
                    key={c.id}
                    to="/projects/$slug/tasks/$taskId"
                    params={{
                      slug: c.task.project.slug,
                      taskId: c.task.id,
                    }}
                    className="px-4 py-2.5 rounded-lg hover:bg-[#F4F4F5] transition-colors"
                  >
                    <p className="text-sm text-text-primary line-clamp-2">
                      {c.body}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {c.task.project.name} · {c.task.title}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
