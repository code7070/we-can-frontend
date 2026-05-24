import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, ListChecks, Plus, CheckCircle2, Circle } from "lucide-react";
import { useCompany } from "@/context/company-context";
import { companyProjectsQueryOptions } from "@/api/projects";
import { companyTasksListQueryOptions } from "@/api/tasks";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { Project, TaskListItem } from "@/api/types";
import { z } from "zod";

const searchSchema = z.object({
  tab: z.enum(["overview", "projects-tasks"]).optional().default("overview"),
});

export const Route = createFileRoute("/c/$companySlug/")({
  validateSearch: searchSchema,
  component: CompanyHome,
});

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  to,
  params,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  to: string;
  params: Record<string, string>;
}) {
  return (
    <Link
      to={to as "/"}
      params={params}
      className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-4 hover:bg-[#F4F4F5] transition-colors duration-150"
    >
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/8 text-accent shrink-0">
        <Icon size={16} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-2xl font-semibold text-text-primary leading-tight">{value}</p>
        {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
      </div>
    </Link>
  );
}

function RecentProjects() {
  const company = useCompany();
  const { data: projects = [] } = useQuery(companyProjectsQueryOptions(company.slug));
  const recent = projects.slice(0, 4);

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface py-10 text-center">
        <p className="text-sm text-text-secondary">No projects yet.</p>
        <Link
          to="/c/$companySlug/projects/new"
          params={{ companySlug: company.slug }}
          className="mt-2 inline-block text-sm font-medium text-accent hover:text-accent-text transition-colors"
        >
          Create your first project
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
      {recent.map((project) => {
        const done = project.taskCount - project.remainingCount;
        const pct = project.taskCount === 0 ? 0 : Math.round((done / project.taskCount) * 100);
        return (
          <Link
            key={project.id}
            to="/c/$companySlug/projects/$projectSlug"
            params={{ companySlug: company.slug, projectSlug: project.slug }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[#F4F4F5] transition-colors duration-150"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{project.name}</p>
              <p className="text-xs text-text-secondary mt-0.5">
                {done} / {project.taskCount} tasks done
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-text-secondary w-8 text-right">{pct}%</span>
            </div>
          </Link>
        );
      })}
      {projects.length > 4 && (
        <Link
          to="/c/$companySlug/projects"
          params={{ companySlug: company.slug }}
          className="flex items-center justify-center px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors duration-150"
        >
          View all {projects.length} projects →
        </Link>
      )}
    </div>
  );
}

function TaskRow({
  task,
  companySlug,
}: {
  task: TaskListItem;
  companySlug: string;
}) {
  const inner = (
    <>
      {task.isDone ? (
        <CheckCircle2 size={15} className="text-success shrink-0" strokeWidth={2} />
      ) : (
        <Circle size={15} className="text-text-disabled shrink-0" strokeWidth={1.5} />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm truncate", task.isDone ? "text-text-secondary line-through" : "text-text-primary")}>
          {task.title}
        </p>
      </div>
      {task.dueDate && (
        <span className="text-xs text-text-secondary shrink-0">
          {new Date(task.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
        </span>
      )}
    </>
  );

  const className = "flex items-center gap-3 px-4 py-2.5 hover:bg-[#F4F4F5] transition-colors duration-150";

  if (task.project) {
    return (
      <Link
        to="/c/$companySlug/projects/$projectSlug/tasks/$taskId"
        params={{ companySlug, projectSlug: task.project.slug, taskId: task.id }}
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

function RecentTasks() {
  const company = useCompany();
  const { data } = useQuery({
    ...companyTasksListQueryOptions(company.slug, { is_done: "false" }),
    select: (d) => d.tasks.slice(0, 5),
  });
  const tasks = data ?? [];

  if (tasks.length === 0) return null;

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface overflow-hidden">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} companySlug={company.slug} />
      ))}
      <Link
        to="/c/$companySlug/tasks"
        params={{ companySlug: company.slug }}
        className="flex items-center justify-center px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors duration-150"
      >
        View all tasks →
      </Link>
    </div>
  );
}

function ProjectTasksGroup({
  project,
  tasks,
  companySlug,
}: {
  project: Project | null;
  tasks: TaskListItem[];
  companySlug: string;
}) {
  if (tasks.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Project header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-[#FAFAFA]">
        {project ? (
          <Link
            to="/c/$companySlug/projects/$projectSlug"
            params={{ companySlug, projectSlug: project.slug }}
            className="text-sm font-semibold text-text-primary hover:text-accent transition-colors truncate"
          >
            {project.name}
          </Link>
        ) : (
          <span className="text-sm font-semibold text-text-secondary">Standalone tasks</span>
        )}
        <span className="text-xs text-text-disabled shrink-0 ml-3">
          {tasks.filter((t) => !t.isDone).length} open · {tasks.length} total
        </span>
      </div>

      {/* Task rows */}
      <div className="divide-y divide-border">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} companySlug={companySlug} />
        ))}
      </div>
    </div>
  );
}

function ProjectsTasksTab() {
  const company = useCompany();
  const { data: projects = [] } = useQuery(companyProjectsQueryOptions(company.slug));
  const { data: tasksData } = useQuery(companyTasksListQueryOptions(company.slug, {}));
  const allTasks = tasksData?.tasks ?? [];

  // Group tasks by project id
  const tasksByProject = new Map<string | null, TaskListItem[]>();
  for (const task of allTasks) {
    const key = task.project?.id ?? null;
    if (!tasksByProject.has(key)) tasksByProject.set(key, []);
    tasksByProject.get(key)!.push(task);
  }

  // Projects that have tasks
  const projectsWithTasks = projects.filter((p) => tasksByProject.has(p.id));
  // Standalone tasks (no project)
  const standaloneTasks = tasksByProject.get(null) ?? [];

  if (allTasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface py-12 text-center">
        <p className="text-sm text-text-secondary">No tasks yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projectsWithTasks.map((project) => (
        <ProjectTasksGroup
          key={project.id}
          project={project}
          tasks={tasksByProject.get(project.id) ?? []}
          companySlug={company.slug}
        />
      ))}
      {/* Projects with no tasks are skipped */}
      {standaloneTasks.length > 0 && (
        <ProjectTasksGroup
          project={null}
          tasks={standaloneTasks}
          companySlug={company.slug}
        />
      )}
    </div>
  );
}

function CompanyHome() {
  const company = useCompany();
  const { isLoggedIn } = useAuth();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: projects = [] } = useQuery(companyProjectsQueryOptions(company.slug));
  const { data: tasksData } = useQuery(companyTasksListQueryOptions(company.slug, {}));
  const { data: openTasks } = useQuery({
    ...companyTasksListQueryOptions(company.slug, { is_done: "false" }),
    select: (d) => d.total,
  });

  const totalTasks = tasksData?.total ?? 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "projects-tasks", label: "Projects & Tasks" },
  ] as const;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            {company.name}
          </h1>
          {company.description && (
            <p className="mt-1 text-sm text-text-secondary">{company.description}</p>
          )}
          <p className="mt-1.5 text-xs text-text-disabled font-mono">{company.slug}</p>
        </div>
        {isLoggedIn && (
          <Link
            to="/c/$companySlug/projects/new"
            params={{ companySlug: company.slug }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-accent hover:bg-accent-text text-white transition-colors duration-150 shrink-0"
          >
            <Plus size={14} />
            New project
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:mb-8">
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={projects.length}
          to="/c/$companySlug/projects"
          params={{ companySlug: company.slug }}
        />
        <StatCard
          icon={ListChecks}
          label="Open tasks"
          value={openTasks ?? 0}
          sub={`${totalTasks} total`}
          to="/c/$companySlug/tasks"
          params={{ companySlug: company.slug }}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6 -mx-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => navigate({ search: { tab: id } })}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px",
              tab === id
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" ? (
        <>
          {/* Projects */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Projects</h2>
              <Link
                to="/c/$companySlug/projects"
                params={{ companySlug: company.slug }}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                View all
              </Link>
            </div>
            <RecentProjects />
          </div>

          {/* Open tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">Open tasks</h2>
              <Link
                to="/c/$companySlug/tasks"
                params={{ companySlug: company.slug }}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                View all
              </Link>
            </div>
            <RecentTasks />
          </div>
        </>
      ) : (
        <ProjectsTasksTab />
      )}
    </div>
  );
}
