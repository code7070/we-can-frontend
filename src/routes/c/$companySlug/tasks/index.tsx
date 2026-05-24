import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { companyTasksListQueryOptions } from "@/api/tasks";
import type { TasksFilter } from "@/api/tasks";
import { useCompany } from "@/context/company-context";
import { TaskFilters } from "@/components/TaskFilters";
import type { TaskFilter } from "@/components/TaskFilters";
import { TasksTable } from "@/components/TasksTable";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/c/$companySlug/tasks/")({
  component: TasksPage,
});

function TasksSkeleton() {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-surface">
      <div className="border-b border-border px-4 py-2 flex items-center gap-3">
        <Skeleton className="h-3 w-16 rounded" />
        <Skeleton className="h-3 flex-1 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-2.5 min-h-[44px] border-b border-border last:border-b-0 bg-surface"
        >
          <Skeleton className="w-4 h-4 rounded shrink-0" />
          <Skeleton className="h-4 flex-1 rounded" />
          <Skeleton className="h-5 w-24 rounded-md shrink-0" />
          <Skeleton className="w-5 h-5 rounded-full shrink-0" />
          <Skeleton className="h-4 w-16 rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}

function TasksPage() {
  const { isLoggedIn, userId } = useAuth();
  const company = useCompany();
  const [filter, setFilter] = useState<TaskFilter>("all");

  const apiFilters: TasksFilter = useMemo(() => {
    if (filter === "my" && userId) return { assignee_id: userId };
    if (filter === "no-project") return { project_id: "null" };
    return {};
  }, [filter, userId]);

  const { data, isLoading } = useQuery(companyTasksListQueryOptions(company.slug, apiFilters));

  const tasks = useMemo(() => {
    if (!data) return [];
    if (filter === "unassigned")
      return data.tasks.filter((t) => t.assignees.length === 0);
    return data.tasks;
  }, [data, filter]);

  function handleFilterChange(f: TaskFilter) {
    if (f === "my" && !isLoggedIn) return;
    setFilter(f);
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Page header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
            Tasks
          </h1>
          {!isLoading && data && (
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
              {data.total} task{data.total !== 1 ? "s" : ""}
              {tasks.length !== data.total && ` · ${tasks.length} shown`}
            </p>
          )}
        </div>
        {isLoggedIn && (
          <Link
            to="/c/$companySlug/tasks/new"
            params={{ companySlug: company.slug }}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold
                       bg-accent hover:bg-accent-text text-white transition-colors duration-150 shrink-0"
          >
            <Plus size={14} className="sm:size-[15]" />
            <span className="hidden sm:inline">New task</span>
            <span className="sm:hidden">New</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4">
        <TaskFilters
          value={filter}
          onChange={handleFilterChange}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <TasksSkeleton />
      ) : (
        <TasksTable
          tasks={tasks}
          emptyMessage={
            filter === "my"
              ? "No tasks assigned to you."
              : filter === "unassigned"
                ? "No unassigned tasks."
                : filter === "no-project"
                  ? "No tasks without a project."
                  : "No tasks yet."
          }
          emptyAction={
            filter === "all" && isLoggedIn && (!data || data.total === 0) ? (
              <Link
                to="/c/$companySlug/tasks/new"
                params={{ companySlug: company.slug }}
                className="text-sm font-semibold text-accent hover:text-accent-text transition-colors duration-150"
              >
                Create your first task
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
