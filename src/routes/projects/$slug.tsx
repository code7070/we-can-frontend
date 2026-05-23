import { useState, Suspense, useMemo } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings, X, Check, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { projectQueryOptions, createGroup } from "@/api/projects";
import { TaskGroup } from "@/components/TaskGroup";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getAvatarColor } from "@/lib/avatar-colors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(projectQueryOptions(params.slug)),
  component: ProjectPage,
});

function AddGroupForm({
  slug,
  sortOrder,
  onDone,
}: {
  slug: string;
  sortOrder?: number;
  onDone?: () => void;
}) {
  const [title, setTitle] = useState("");
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => createGroup(slug, title.trim(), sortOrder),
    onSuccess: () => {
      toast.success("Group created");
      setTitle("");
      onDone?.();
      void qc.invalidateQueries({ queryKey: ["project", slug] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create group"),
  });

  function handleSubmit() {
    if (!title.trim() || mutation.isPending) return;
    mutation.mutate();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      setTitle("");
      onDone?.();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Group name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className={cn(
          "flex-1 h-9 px-3 rounded-lg bg-surface text-sm text-text-primary",
          "border border-border outline-none transition-all duration-150",
          "focus:border-accent focus:[box-shadow:0_0_0_3px_rgba(37,99,235,0.12)]"
        )}
        disabled={mutation.isPending}
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!title.trim() || mutation.isPending}
      >
        {mutation.isPending ? "Adding..." : "Add"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setTitle("");
          onDone?.();
        }}
        className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors duration-150"
        aria-label="Cancel"
      >
        <X size={16} />
      </button>
    </div>
  );
}

type TaskFilter = "all" | "my";

function ProjectContent() {
  const { slug } = Route.useParams();
  const { isLoggedIn, userId } = useAuth();
  const { data: project } = useSuspenseQuery(projectQueryOptions(slug));
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>("all");

  // Compute filtered groups — client-side, no extra API call
  const filteredGroups = useMemo(() => {
    if (filter === "all" || !userId) return project.groups;
    return project.groups
      .map((g) => ({
        ...g,
        tasks: g.tasks.filter((t) =>
          t.assignees.some((a) => a.id === userId)
        ),
      }))
      .filter((g) => g.tasks.length > 0);
  }, [project.groups, filter, userId]);

  const totalTasks = project.groups.reduce((acc, g) => acc + g.tasks.length, 0);
  const doneTasks = project.groups.reduce((acc, g) => acc + g.tasks.filter((t) => t.isDone).length, 0);
  const myTotalTasks = filteredGroups.reduce((acc, g) => acc + g.tasks.length, 0);
  const myDoneTasks = filteredGroups.reduce((acc, g) => acc + g.tasks.filter((t) => t.isDone).length, 0);

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-start justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight truncate">
            {project.name}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {filter === "my" ? (
              <>{myDoneTasks} of {myTotalTasks} my tasks completed</>
            ) : (
              <>{doneTasks} of {totalTasks} tasks completed</>
            )}
          </p>
          <div className="flex flex-col gap-1.5 mt-3">
            {project.createdAt && project.createdBy && (
              <div className="flex items-center gap-1.5">
                <div
                  className="flex items-center justify-center rounded-full shrink-0 text-white font-semibold"
                  style={{
                    width: 18, height: 18, fontSize: 8,
                    background: getAvatarColor(project.createdBy.name),
                  }}
                >
                  {project.createdBy.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs text-text-secondary">
                  <span className="font-medium">{project.createdBy.name}</span>
                  <span className="text-text-disabled">
                    {" "}created · {new Date(project.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </span>
              </div>
            )}
            {project.updatedAt && project.updatedBy && (
              <div className="flex items-center gap-1.5">
                <div
                  className="flex items-center justify-center rounded-full shrink-0 text-white font-semibold"
                  style={{
                    width: 18, height: 18, fontSize: 8,
                    background: getAvatarColor(project.updatedBy.name),
                  }}
                >
                  {project.updatedBy.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs text-text-secondary">
                  <span className="font-medium">{project.updatedBy.name}</span>
                  <span className="text-text-disabled">
                    {" "}edited · {new Date(project.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
        {isLoggedIn && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to="/projects/$slug/edit"
              params={{ slug }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold
                         text-text-secondary border border-border hover:bg-[#F4F4F5] transition-colors duration-150"
            >
              <Settings size={13} className="sm:size-[15]" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
            <Link
              to="/projects/$slug/tasks/new"
              params={{ slug }}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold
                         bg-accent hover:bg-accent-text text-white transition-colors duration-150"
            >
              <Plus size={13} className="sm:size-[15]" />
              <span className="hidden sm:inline">New task</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter dropdown — visible only when logged in */}
      {isLoggedIn && (
        <div className="mb-5">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary border border-border hover:bg-[#F4F4F5] hover:text-text-primary transition-colors duration-150 cursor-pointer outline-none">
              {filter === "my" ? <User size={14} /> : <Check size={14} />}
              {filter === "my" ? "My tasks" : "All tasks"}
              <ChevronDown size={14} className="text-text-disabled" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={filter}
                onValueChange={(value) => setFilter(value as TaskFilter)}
              >
                <DropdownMenuRadioItem value="all">
                  <Check size={14} />
                  All tasks
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="my">
                  <User size={14} />
                  My tasks
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Groups — each in its own card */}
      {filteredGroups.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl bg-surface py-12 px-6 text-center">
          <p className="text-sm text-text-secondary">
            {filter === "my"
              ? "No tasks assigned to you in this project."
              : "No task groups yet."}
          </p>
          {filter === "all" && isLoggedIn && (
            <button
              onClick={() => setIsAddingGroup(true)}
              className="mt-2 text-sm font-semibold text-accent hover:text-accent-text transition-colors duration-150"
            >
              Add a group to get started
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredGroups.map((group) => (
            <TaskGroup
              key={group.id}
              group={group}
              projectSlug={slug}
            />
          ))}
        </div>
      )}

      {/* Add Group — outside the container, clear hierarchy */}
      {isLoggedIn && (
        <div className="mt-4">
          {isAddingGroup ? (
            <AddGroupForm
              slug={slug}
              sortOrder={project.groups.length}
              onDone={() => setIsAddingGroup(false)}
            />
          ) : (
            <button
              onClick={() => setIsAddingGroup(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                         text-text-disabled hover:text-text-secondary hover:bg-[#F4F4F5]
                         border border-dashed border-border hover:border-solid
                         transition-all duration-150 cursor-pointer w-full"
            >
              <Plus size={14} />
              Add group
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-start justify-between mb-6 sm:mb-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 sm:h-7 w-48 sm:w-56" />
          <Skeleton className="h-3 sm:h-4 w-28 sm:w-36" />
        </div>
        <Skeleton className="h-8 sm:h-9 w-20 sm:w-28 rounded-lg" />
      </div>
      <div className="flex flex-col border border-border rounded-xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-surface border-b border-border last:border-b-0">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="w-16 h-4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectPage() {
  const { slug } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Render child routes (task detail, create task) when navigating deeper
  const isProjectRoot =
    pathname === `/projects/${slug}` || pathname === `/projects/${slug}/`;

  if (!isProjectRoot) {
    return <Outlet />;
  }

  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectContent />
    </Suspense>
  );
}
