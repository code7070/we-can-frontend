import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { patchTask } from "@/api/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { AssigneeAvatars } from "@/components/AssigneeAvatars";
import { useCompany } from "@/context/company-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { TaskListItem, TaskListResponse } from "@/api/types";

// ── Cell components ─────────────────────────────────────────────────────────

function StatusCell({ task }: { task: TaskListItem }) {
  const { isLoggedIn } = useAuth();
  const qc = useQueryClient();
  const company = useCompany();

  const toggle = useMutation({
    mutationFn: (isDone: boolean) => patchTask(task.id, { isDone }),
    onMutate: async (isDone) => {
      await qc.cancelQueries({ queryKey: ["companies", company.slug, "tasks"] });
      const prev = qc.getQueriesData<TaskListResponse>({ queryKey: ["companies", company.slug, "tasks"] });
      qc.setQueriesData<TaskListResponse>({ queryKey: ["companies", company.slug, "tasks"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t) => (t.id === task.id ? { ...t, isDone } : t)),
        };
      });
      return { prev };
    },
    onError: (err, _, ctx) => {
      ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["companies", company.slug, "tasks"] });
      void qc.invalidateQueries({ queryKey: ["companies", company.slug, "project"] });
    },
  });

  return (
    <Checkbox
      checked={task.isDone}
      onCheckedChange={(v) => isLoggedIn && toggle.mutate(!!v)}
      disabled={!isLoggedIn || toggle.isPending}
      className="shrink-0"
    />
  );
}

function TitleCell({ task }: { task: TaskListItem }) {
  const company = useCompany();
  const text = (
    <span
      className={cn(
        "text-sm transition-colors duration-150",
        task.isDone
          ? "line-through text-text-secondary"
          : "text-text-primary group-hover/row:text-accent"
      )}
    >
      {task.title}
    </span>
  );

  if (task.project) {
    return (
      <Link
        to="/c/$companySlug/projects/$projectSlug/tasks/$taskId"
        params={{ companySlug: company.slug, projectSlug: task.project.slug, taskId: task.id }}
        className="flex-1 min-w-0 truncate"
      >
        {text}
      </Link>
    );
  }

  return <span className="flex-1 min-w-0 truncate">{text}</span>;
}

function ProjectCell({ task }: { task: TaskListItem }) {
  const company = useCompany();
  if (!task.project) {
    return <span className="text-xs text-text-disabled">No project</span>;
  }
  return (
    <Link
      to="/c/$companySlug/projects/$projectSlug"
      params={{ companySlug: company.slug, projectSlug: task.project.slug }}
      className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#EFF6FF] text-xs font-medium text-accent hover:bg-accent/20 transition-colors duration-150 max-w-[160px] truncate"
    >
      {task.project.name}
    </Link>
  );
}

function DueDateCell({ task }: { task: TaskListItem }) {
  if (!task.dueDate || task.isDone) {
    return <span className="text-xs text-text-disabled">—</span>;
  }

  const due = new Date(task.dueDate);
  const now = new Date();
  const days = Math.ceil((due.getTime() - now.getTime()) / 86400000);

  const tone =
    days < 0
      ? ("danger" as const)
      : days <= 7
        ? ("warn" as const)
        : ("muted" as const);

  const label =
    days < 0
      ? `${Math.abs(days)}d overdue`
      : days === 0
        ? "Today"
        : due.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap",
        tone === "danger" && "text-[#DC2626]",
        tone === "warn" && "text-[#D97706]",
        tone === "muted" && "text-text-secondary"
      )}
    >
      <Clock size={11} strokeWidth={2} />
      {label}
    </span>
  );
}

// ── Column definitions ───────────────────────────────────────────────────────

const col = createColumnHelper<TaskListItem>();

const columns = [
  col.display({
    id: "isDone",
    header: "",
    cell: ({ row }) => <StatusCell task={row.original} />,
    size: 36,
  }),
  col.accessor("title", {
    header: "Task",
    cell: ({ row }) => <TitleCell task={row.original} />,
  }),
  col.accessor("project", {
    id: "project",
    header: "Project",
    cell: ({ row }) => <ProjectCell task={row.original} />,
    size: 180,
  }),
  col.accessor("assignees", {
    id: "assignees",
    header: "Assignees",
    cell: ({ row }) =>
      row.original.assignees.length > 0 ? (
        <AssigneeAvatars assignees={row.original.assignees} />
      ) : (
        <span className="text-xs text-text-disabled">—</span>
      ),
    size: 80,
  }),
  col.accessor("dueDate", {
    id: "dueDate",
    header: "Due",
    cell: ({ row }) => <DueDateCell task={row.original} />,
    size: 110,
  }),
];

// ── Table ────────────────────────────────────────────────────────────────────

interface Props {
  tasks: TaskListItem[];
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
}

export function TasksTable({ tasks, emptyMessage = "No tasks found.", emptyAction }: Props) {
  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (tasks.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-xl bg-surface py-12 px-6 text-center">
        <p className="text-sm text-text-secondary">{emptyMessage}</p>
        {emptyAction && <div className="mt-2">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop Table ── */}
      <div className="hidden lg:block border border-border rounded-xl overflow-hidden bg-surface">
        {/* Header */}
        <div className="border-b border-border">
          {table.getHeaderGroups().map((hg) => (
            <div key={hg.id} className="flex items-center px-4 py-2 gap-3">
              {hg.headers.map((header) => (
                <div
                  key={header.id}
                  className={cn(
                    "text-xs font-semibold text-text-disabled uppercase tracking-wide",
                    header.column.id === "title" ? "flex-1 min-w-0" : "shrink-0"
                  )}
                  style={
                    header.column.id !== "title"
                      ? { width: header.column.getSize() }
                      : undefined
                  }
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Rows */}
        {table.getRowModel().rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center px-4 py-2.5 gap-3 min-h-[44px] border-b border-border last:border-b-0 hover:bg-[#F4F4F5] transition-colors duration-150 group/row"
          >
            {row.getVisibleCells().map((cell) => (
              <div
                key={cell.id}
                className={cn(
                  cell.column.id === "title"
                    ? "flex-1 min-w-0 truncate"
                    : "shrink-0 flex items-center"
                )}
                style={
                  cell.column.id !== "title"
                    ? { width: cell.column.getSize() }
                    : undefined
                }
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Mobile Task Cards ── */}
      <div className="lg:hidden flex flex-col gap-2">
        {table.getRowModel().rows.map((task) => {
          const t = task.original;
          const dueLabel = t.dueDate && !t.isDone ? formatDueDate(t.dueDate) : null;

          return (
            <div
              key={t.id}
              className="bg-surface border border-border rounded-xl p-3 space-y-2.5 transition-colors duration-150 active:bg-[#F4F4F5]"
            >
              {/* Top row: checkbox + title */}
              <div className="flex items-start gap-2.5">
                <StatusCell task={t} />
                <div className="flex-1 min-w-0">
                  <TitleCell task={t} />
                </div>
              </div>

              {/* Meta row: project + due date + stats */}
              <div className="flex flex-wrap items-center gap-1.5 pl-8">
                <ProjectCell task={t} />

                {dueLabel && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap",
                      dueLabel.tone === "danger" && "bg-[#FEE2E2] text-[#DC2626]",
                      dueLabel.tone === "warn" && "bg-[#FEF3C7] text-[#D97706]",
                      dueLabel.tone === "muted" && "bg-[#F4F4F5] text-text-secondary"
                    )}
                  >
                    <Clock size={10} strokeWidth={2} />
                    {dueLabel.label}
                  </span>
                )}

                {t.commentCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#F4F4F5] text-text-secondary whitespace-nowrap">
                    <MessageSquareText size={10} strokeWidth={2} />
                    {t.commentCount}
                  </span>
                )}
              </div>

              {/* Assignees row */}
              {t.assignees.length > 0 && (
                <div className="flex items-center gap-1.5 pl-8">
                  <AssigneeAvatars assignees={t.assignees} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function formatDueDate(dueDate: string): { label: string; tone: "warn" | "danger" | "muted" } | null {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "danger" };
  if (days === 0) return { label: "Today", tone: "danger" };
  if (days <= 7) return { label: `Due in ${days}d`, tone: "warn" };
  return {
    label: due.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    tone: "muted",
  };
}
