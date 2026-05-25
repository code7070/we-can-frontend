import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Circle,
  CheckCircle2,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { companyTasksListQueryOptions } from "@/api/tasks";
import { cn } from "@/lib/utils";
import type { Project, TaskListItem } from "@/api/types";
import type { TasksFilter } from "@/api/tasks";

const PREVIEW_LIMIT = 5;

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = total > 0 && done === total;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-16 h-1 rounded-full bg-hover overflow-hidden shrink-0">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            complete ? "bg-success" : "bg-accent",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-secondary tabular-nums shrink-0">
        {complete ? (
          <span className="text-success font-medium">Done</span>
        ) : (
          `${done}/${total}`
        )}
      </span>
    </div>
  );
}

function TaskRow({
  task,
  companySlug,
  projectSlug,
}: {
  task: TaskListItem;
  companySlug: string;
  projectSlug?: string;
}) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = due && !task.isDone && due < new Date();
  const dueLabel = due
    ? due.toLocaleDateString("en", { month: "short", day: "numeric" })
    : null;

  const inner = (
    <>
      {task.isDone ? (
        <CheckCircle2 size={14} className="text-success shrink-0" strokeWidth={2} />
      ) : (
        <Circle size={14} className="text-text-disabled shrink-0" strokeWidth={1.5} />
      )}
      <p
        className={cn(
          "flex-1 min-w-0 text-sm truncate",
          task.isDone ? "text-text-secondary line-through" : "text-text-primary",
        )}
      >
        {task.title}
      </p>
      {dueLabel && (
        <span
          className={cn(
            "text-xs shrink-0 tabular-nums",
            isOverdue ? "text-danger font-medium" : "text-text-secondary",
          )}
        >
          {isOverdue && <AlertTriangle size={10} className="inline mr-0.5 -mt-0.5" />}
          {dueLabel}
        </span>
      )}
    </>
  );

  const className =
    "flex items-center gap-2.5 px-4 py-2.5 hover:bg-hover transition-colors duration-150";

  if (projectSlug && task.project) {
    return (
      <Link
        to="/c/$companySlug/projects/$projectSlug/tasks/$taskId"
        params={{ companySlug, projectSlug, taskId: task.id }}
        className={className}
      >
        {inner}
      </Link>
    );
  }

  return (
    <Link
      to="/c/$companySlug/tasks"
      params={{ companySlug }}
      className={className}
    >
      {inner}
    </Link>
  );
}

function TasksSkeleton() {
  return (
    <div className="divide-y divide-border border-t border-border">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 px-4 py-2.5">
          <div className="w-3.5 h-3.5 rounded-full bg-hover animate-pulse shrink-0" />
          <div className="h-3.5 flex-1 rounded bg-hover animate-pulse" />
          <div className="h-3 w-12 rounded bg-hover animate-pulse shrink-0" />
        </div>
      ))}
    </div>
  );
}

interface Props {
  project: Project;
  companySlug: string;
  defaultOpen: boolean;
  apiFilter: TasksFilter;
  isLoggedIn: boolean;
  clientFilter?: (tasks: TaskListItem[]) => TaskListItem[];
}

export function ProjectTaskGroup({
  project,
  companySlug,
  defaultOpen,
  apiFilter,
  isLoggedIn,
  clientFilter,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const doneCount = project.taskCount - project.remainingCount;

  const { data, isLoading } = useQuery({
    ...companyTasksListQueryOptions(companySlug, {
      ...apiFilter,
      project_id: project.id,
      is_done: apiFilter.is_done,
    }),
    enabled: open,
  });

  const tasks = useMemo(() => {
    const raw = data?.tasks ?? [];
    return clientFilter ? clientFilter(raw) : raw;
  }, [data, clientFilter]);

  const preview = tasks.slice(0, PREVIEW_LIMIT);
  const remaining = tasks.length - preview.length;

  return (
    <section className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors duration-150"
        aria-expanded={open}
      >
        <ChevronDown
          size={13}
          className={cn(
            "text-text-secondary transition-transform duration-150 shrink-0",
            open ? "" : "-rotate-90",
          )}
        />
        <span className="flex-1 min-w-0 flex items-center gap-2 text-left">
          <span className="text-sm font-semibold text-text-primary truncate">
            {project.name}
          </span>
          {project.remainingCount > 0 && (
            <span className="text-xs text-text-secondary tabular-nums shrink-0">
              {project.remainingCount} open
            </span>
          )}
        </span>
        <ProgressBar done={doneCount} total={project.taskCount} />
        {isLoggedIn && (
          <Link
            to="/c/$companySlug/tasks/new"
            params={{ companySlug }}
            onClick={(e) => e.stopPropagation()}
            className="ml-1 p-1 rounded text-text-secondary hover:text-accent hover:bg-accent/8 transition-colors duration-150 shrink-0"
            title="Add task"
          >
            <Plus size={13} />
          </Link>
        )}
      </button>

      {/* Body */}
      {open && (
        <>
          {isLoading ? (
            <TasksSkeleton />
          ) : preview.length === 0 ? (
            <div className="border-t border-border px-4 py-5 text-center text-sm text-text-secondary">
              No tasks match this filter.
            </div>
          ) : (
            <div className="border-t border-border divide-y divide-border">
              {preview.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  companySlug={companySlug}
                  projectSlug={task.project?.slug ?? project.slug}
                />
              ))}
              {remaining > 0 && (
                <Link
                  to="/c/$companySlug/projects/$projectSlug"
                  params={{ companySlug, projectSlug: project.slug }}
                  className="flex items-center justify-center px-4 py-2.5 text-xs font-medium
                             text-text-secondary hover:text-text-primary hover:bg-hover
                             transition-colors duration-150"
                >
                  Show all {tasks.length} →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

interface OrphanGroupProps {
  companySlug: string;
  apiFilter: TasksFilter;
  isLoggedIn: boolean;
  clientFilter?: (tasks: TaskListItem[]) => TaskListItem[];
}

export function OrphanTaskGroup({
  companySlug,
  apiFilter,
  isLoggedIn,
  clientFilter,
}: OrphanGroupProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    ...companyTasksListQueryOptions(companySlug, {
      ...apiFilter,
      project_id: "null",
    }),
    enabled: open,
  });

  // Count query (always enabled, no tasks fetched)
  const { data: countData } = useQuery({
    ...companyTasksListQueryOptions(companySlug, {
      ...apiFilter,
      project_id: "null",
      limit: 0,
    } as TasksFilter & { limit?: number }),
    select: (d) => d.total,
  });

  const total = countData ?? 0;
  if (total === 0) return null;

  const tasks = useMemo(() => {
    const raw = data?.tasks ?? [];
    return clientFilter ? clientFilter(raw) : raw;
  }, [data, clientFilter]);

  const preview = tasks.slice(0, PREVIEW_LIMIT);
  const remaining = tasks.length - preview.length;

  return (
    <section className="rounded-xl border border-warning-border bg-warning-bg-soft overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-warning-bg-soft/80 transition-colors duration-150"
        aria-expanded={open}
      >
        <ChevronDown
          size={13}
          className={cn(
            "text-warning transition-transform duration-150 shrink-0",
            open ? "" : "-rotate-90",
          )}
        />
        <span className="flex-1 min-w-0 text-left flex items-center gap-2">
          <AlertTriangle size={13} className="text-warning shrink-0" />
          <span className="text-sm font-semibold text-warning-text">No project</span>
          <span className="text-xs text-warning tabular-nums">{total}</span>
        </span>
        {isLoggedIn && (
          <Link
            to="/c/$companySlug/tasks/new"
            params={{ companySlug }}
            onClick={(e) => e.stopPropagation()}
            className="ml-1 p-1 rounded text-warning hover:bg-warning/10 transition-colors duration-150 shrink-0"
            title="Add task"
          >
            <Plus size={13} />
          </Link>
        )}
      </button>

      {open && (
        <>
          {isLoading ? (
            <TasksSkeleton />
          ) : preview.length === 0 ? (
            <div className="border-t border-warning-border px-4 py-5 text-center text-sm text-warning-text">
              No tasks match this filter.
            </div>
          ) : (
            <div className="border-t border-warning-border divide-y divide-warning-border">
              {preview.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  companySlug={companySlug}
                />
              ))}
              {remaining > 0 && (
                <Link
                  to="/c/$companySlug/tasks"
                  params={{ companySlug }}
                  search={{ filter: "no-project" }}
                  className="flex items-center justify-center px-4 py-2.5 text-xs font-medium
                             text-warning hover:text-warning-text hover:bg-warning/5
                             transition-colors duration-150"
                >
                  Show all {tasks.length} →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
