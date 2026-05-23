import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { ArrowRight, Clock, LogIn } from "lucide-react";
import { projectsQueryOptions } from "@/api/projects";
import { tasksListQueryOptions, patchTask } from "@/api/tasks";
import { meQueryOptions } from "@/api/users";
import { ProjectCard, ProjectCardSkeleton } from "@/components/ProjectCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { TaskListItem, TaskListResponse } from "@/api/types";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(projectsQueryOptions),
  component: HomePage,
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDue(dueDate: string, isDone: boolean): { label: string; tone: "danger" | "warn" | "muted" } | null {
  if (isDone) return null;
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "danger" };
  if (days === 0) return { label: "Today", tone: "danger" };
  if (days <= 7) return { label: `Due in ${days}d`, tone: "warn" };
  return {
    label: new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    tone: "muted",
  };
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  count,
  viewAllTo,
  children,
}: {
  title: string;
  count?: number;
  viewAllTo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-[#F4F4F5] text-text-secondary tabular-nums">
              {count}
            </span>
          )}
        </div>
        <Link
          to={viewAllTo as "/tasks" | "/projects"}
          className="flex items-center gap-1 text-xs font-medium text-text-secondary
                     hover:text-accent transition-colors duration-150"
        >
          View all
          <ArrowRight size={12} />
        </Link>
      </div>
      <div className="border border-border rounded-xl overflow-hidden bg-surface">
        {children}
      </div>
    </section>
  );
}

// ── Sign-in prompt (shared by Inbox + Recent) ─────────────────────────────────

function SignInPrompt({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8 px-4">
      <LogIn size={15} className="text-text-disabled shrink-0" />
      <p className="text-sm text-text-secondary">
        {message}{" "}
        <Link to="/login" className="text-accent hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}

// ── Dashboard task row ────────────────────────────────────────────────────────

function DashboardTaskRow({ task }: { task: TaskListItem }) {
  const { isLoggedIn } = useAuth();
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: (isDone: boolean) => patchTask(task.id, { isDone }),
    onMutate: async (isDone) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueriesData<TaskListResponse>({ queryKey: ["tasks"] });
      qc.setQueriesData<TaskListResponse>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return old;
        return { ...old, tasks: old.tasks.map((t) => (t.id === task.id ? { ...t, isDone } : t)) };
      });
      return { prev };
    },
    onError: (err, _, ctx) => {
      ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const due = task.dueDate ? formatDue(task.dueDate, task.isDone) : null;

  const titleNode = (
    <span
      className={cn(
        "text-sm truncate transition-colors duration-150",
        task.isDone ? "line-through text-text-secondary" : "text-text-primary"
      )}
    >
      {task.title}
    </span>
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 px-4 py-2.5 sm:py-2.5 sm:min-h-[44px] border-b border-border last:border-b-0 hover:bg-[#F4F4F5] transition-colors duration-150">
      {/* Top row: checkbox + title (mobile) / everything inline (desktop) */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <Checkbox
          checked={task.isDone}
          onCheckedChange={(v) => isLoggedIn && toggle.mutate(!!v)}
          disabled={!isLoggedIn || toggle.isPending}
          className="shrink-0"
        />

        {/* Title — linked if task has a project */}
        <div className="flex-1 min-w-0 truncate sm:flex-none sm:max-w-[300px] lg:max-w-none">
          {task.project ? (
            <Link
              to="/projects/$slug/tasks/$taskId"
              params={{ slug: task.project.slug, taskId: task.id }}
              className="hover:text-accent transition-colors duration-150"
            >
              {titleNode}
            </Link>
          ) : (
            titleNode
          )}
        </div>
      </div>

      {/* Meta row (mobile only — below checkbox + title) */}
      <div className="flex flex-wrap items-center gap-1.5 pl-7 sm:pl-0 sm:ml-auto sm:flex-row">
        {task.project && (
          <Link
            to="/projects/$slug"
            params={{ slug: task.project.slug }}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] sm:text-xs font-medium
                       bg-[#EFF6FF] text-accent hover:bg-accent/20 transition-colors duration-150
                       shrink-0 max-w-[120px] truncate"
          >
            {task.project.name}
          </Link>
        )}

        {due && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0",
              due.tone === "danger" && "text-[#DC2626]",
              due.tone === "warn" && "text-[#D97706]",
              due.tone === "muted" && "text-text-secondary"
            )}
          >
            <Clock size={10} strokeWidth={2} className="sm:hidden" />
            <Clock size={11} strokeWidth={2} className="hidden sm:inline" />
            {due.label}
          </span>
        )}
      </div>
    </div>
  );
}

function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 min-h-[44px] border-b border-border last:border-b-0">
      <Skeleton className="w-4 h-4 rounded shrink-0" />
      <Skeleton className="h-4 flex-1 rounded" />
      <Skeleton className="h-5 w-20 rounded shrink-0" />
    </div>
  );
}

// ── Inbox section ─────────────────────────────────────────────────────────────

function InboxSection({ userId }: { userId: string | null }) {
  const { data, isLoading } = useQuery({
    ...tasksListQueryOptions({ project_id: "null", assignee_id: userId! }),
    enabled: !!userId,
  });

  const tasks = data?.tasks ?? [];
  const shown = tasks.slice(0, 5);
  const overflow = Math.max(0, (data?.total ?? 0) - 5);

  return (
    <Section title="Inbox" count={data?.total} viewAllTo="/tasks">
      {!userId ? (
        <SignInPrompt message="Your orphan tasks will appear here." />
      ) : isLoading ? (
        <>
          {Array.from({ length: 3 }).map((_, i) => <TaskRowSkeleton key={i} />)}
        </>
      ) : shown.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-8">
          No orphan tasks assigned to you.
        </p>
      ) : (
        <>
          {shown.map((task) => <DashboardTaskRow key={task.id} task={task} />)}
          {overflow > 0 && (
            <div className="px-4 py-2.5 border-t border-border">
              <Link
                to="/tasks"
                className="text-xs font-medium text-text-secondary hover:text-accent transition-colors"
              >
                +{overflow} more
              </Link>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

// ── My Recent Tasks section ───────────────────────────────────────────────────

function RecentTasksSection({ userId }: { userId: string | null }) {
  const { data, isLoading } = useQuery({
    ...tasksListQueryOptions({ assignee_id: userId! }),
    enabled: !!userId,
  });

  // Sort client-side by updatedAt desc, take top 5
  const tasks = useMemo(() => {
    if (!data) return [];
    return [...data.tasks]
      .sort((a, b) => {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 5);
  }, [data]);

  return (
    <Section title="My Recent Tasks" viewAllTo="/tasks">
      {!userId ? (
        <SignInPrompt message="Your recent tasks will appear here." />
      ) : isLoading ? (
        <>
          {Array.from({ length: 3 }).map((_, i) => <TaskRowSkeleton key={i} />)}
        </>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-text-secondary text-center py-8">
          No tasks assigned to you yet.
        </p>
      ) : (
        tasks.map((task) => <DashboardTaskRow key={task.id} task={task} />)
      )}
    </Section>
  );
}

// ── Active Projects section ───────────────────────────────────────────────────

function ActiveProjectsSection() {
  const { data: projects, isLoading } = useQuery(projectsQueryOptions);

  const active = useMemo(() => {
    if (!projects) return [];
    return [...projects]
      .filter((p) => p.remainingCount > 0)
      .sort((a, b) => b.remainingCount - a.remainingCount)
      .slice(0, 6);
  }, [projects]);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Active Projects</h2>
          {active.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-[#F4F4F5] text-text-secondary tabular-nums">
              {active.length}
            </span>
          )}
        </div>
        <Link
          to="/projects"
          className="flex items-center gap-1 text-xs font-medium text-text-secondary
                     hover:text-accent transition-colors duration-150"
        >
          View all
          <ArrowRight size={12} />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : active.length === 0 ? (
        <div className="border border-border rounded-xl bg-surface py-8 text-center">
          <p className="text-sm text-text-secondary">All projects are up to date.</p>
          <Link
            to="/projects"
            className="mt-1 inline-block text-sm font-medium text-accent hover:text-accent-text transition-colors"
          >
            View all projects
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {active.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function HomePage() {
  const { isLoggedIn, userId } = useAuth();

  const { data: me } = useQuery({
    ...meQueryOptions,
    enabled: isLoggedIn,
  });

  const greeting = `${getGreeting()}${me?.name ? `, ${me.name}` : ""}`;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Greeting */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
          {greeting}
        </h1>
        {!isLoggedIn && (
          <p className="text-sm text-text-secondary mt-1">
            <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
            {" "}to track your tasks and projects.
          </p>
        )}
      </div>

      {/* Three sections */}
      <div className="flex flex-col gap-8">
        <InboxSection userId={userId} />
        <RecentTasksSection userId={userId} />
        <ActiveProjectsSection />
      </div>
    </div>
  );
}
