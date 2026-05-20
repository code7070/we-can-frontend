import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, FileText, ExternalLink, CornerDownRight } from "lucide-react";
import { apiFetch } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { AssigneeAvatars } from "./AssigneeAvatars";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { taskQueryOptions } from "@/api/tasks";
import type { Task } from "@/api/types";

interface Props {
  task: Task;
  projectSlug: string;
}

export function TaskRow({ task, projectSlug }: Props) {
  const { isLoggedIn } = useAuth();
  const qc = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePanel, setActivePanel] = useState<"thread" | "details" | null>(null);

  const toggle = useMutation({
    mutationFn: (isDone: boolean) =>
      apiFetch(`/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isDone }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["project"] });
      void qc.invalidateQueries({ queryKey: ["task", task.id] });
    },
  });

  // Lazy-fetch task detail only when panel is open
  const taskDetailQuery = useQuery({
    ...taskQueryOptions(task.id),
    enabled: activePanel !== null,
  });

  function handleTitleClick() {
    if (isExpanded) {
      setActivePanel(null);
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  }

  function handlePanelToggle(panel: "thread" | "details") {
    if (!isExpanded) {
      setIsExpanded(true);
      setActivePanel(panel);
    } else {
      setActivePanel((prev) => (prev === panel ? null : panel));
    }
  }

  const lastComment =
    taskDetailQuery.data?.thread?.[taskDetailQuery.data.thread.length - 1] ?? null;

  return (
    <div>
      {/* ── Task Row ── */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 min-h-[44px] transition-colors duration-150 group",
          isExpanded ? "bg-[#F4F4F5]" : "hover:bg-[#F4F4F5]"
        )}
      >
        <Checkbox
          checked={task.isDone}
          onCheckedChange={(v) => isLoggedIn && toggle.mutate(!!v)}
          disabled={!isLoggedIn || toggle.isPending}
          className="shrink-0"
        />

        <button
          onClick={handleTitleClick}
          className={cn(
            "text-md flex-1 truncate text-left transition-colors duration-150 cursor-pointer",
            task.isDone
              ? "line-through text-text-secondary"
              : "text-text-primary hover:text-accent"
          )}
        >
          {task.title}
        </button>

        {task.assignees.length > 0 && (
          <AssigneeAvatars assignees={task.assignees} />
        )}

        {task.dueDate && (
          <span className="text-xs text-text-secondary whitespace-nowrap shrink-0">
            {new Date(task.dueDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {/* ── Expanded Section (aligned with title text) ── */}
      {isExpanded && (
        <div className="border-t border-border bg-[#FAFAFA]">
          {/* Action bar */}
          <div className="flex items-center gap-3 px-4 py-2">
            {/* Spacer — matches checkbox width so content aligns with title */}
            <div className="w-5 shrink-0" />

            {/* ↳ enter indicator — visual cue that this section extends from the task */}
            <CornerDownRight
              size={14}
              className="text-text-disabled shrink-0"
              strokeWidth={1.5}
              aria-hidden
            />

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePanelToggle("thread")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
                    activePanel === "thread"
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:bg-accent/80 hover:text-white"
                )}
              >
                <MessageSquareText size={14} strokeWidth={1.5} />
                <span>Latest Comment</span>
              </button>

              <button
                onClick={() => handlePanelToggle("details")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150",
                    activePanel === "details"
                      ? "bg-accent text-white"
                      : "text-text-secondary hover:bg-accent/80 hover:text-white"
                )}
              >
                <FileText size={14} strokeWidth={1.5} />
                <span>Task Details</span>
              </button>
            </div>
          </div>

          {/* Panel content (only when active) */}
          {activePanel && (
            <div className="flex gap-3 px-4 pb-3">
              {/* Same spacer as action bar */}
              <div className="w-5 shrink-0" />

              {/* Push content to align with button text (↳ width + gap-3) */}
              <div className="pl-[26px] flex-1 min-w-0 space-y-2">
                {/* Thread panel */}
                {activePanel === "thread" && (
                  <div>
                    {taskDetailQuery.isLoading ? (
                      <p className="text-xs text-text-disabled animate-pulse">
                        Loading comment...
                      </p>
                    ) : lastComment ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-text-primary">
                            {lastComment.author.name}
                          </span>
                          <span className="text-xs text-text-disabled">
                            {new Date(lastComment.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                        <div className="line-clamp-2 text-sm text-text-secondary">
                          <MarkdownRenderer content={lastComment.body} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-text-disabled">
                        No comments yet.
                      </p>
                    )}
                  </div>
                )}

                {/* Details panel */}
                {activePanel === "details" && (
                  <div>
                    {taskDetailQuery.isLoading ? (
                      <p className="text-xs text-text-disabled animate-pulse">
                        Loading details...
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {taskDetailQuery.data?.description && (
                          <div className="line-clamp-2 text-sm text-text-secondary">
                            <MarkdownRenderer content={taskDetailQuery.data.description} />
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-text-secondary">
                          {task.assignees.length > 0 && (
                            <span>
                              {task.assignees.length}{" "}
                              assignee{task.assignees.length > 1 ? "s" : ""}
                            </span>
                          )}
                          {task.dueDate && (
                            <span>
                              Due{" "}
                              {new Date(task.dueDate).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          )}
                          {task.commentCount !== undefined &&
                            task.commentCount > 0 && (
                              <span>
                                {task.commentCount}{" "}
                                comment{task.commentCount > 1 ? "s" : ""}
                              </span>
                            )}
                        </div>

                        {taskDetailQuery.data?.linkedTasks &&
                          taskDetailQuery.data.linkedTasks.length > 0 && (
                            <p className="text-xs text-text-secondary">
                              {taskDetailQuery.data.linkedTasks.length} linked
                              task
                              {taskDetailQuery.data.linkedTasks.length > 1
                                ? "s"
                                : ""}
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                )}

                {/* See Details link */}
                <div className="pt-0.5">
                  <Link
                    to="/projects/$slug/tasks/$taskId"
                    params={{ slug: projectSlug, taskId: task.id }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-text transition-colors duration-150"
                  >
                    See Details
                    <ExternalLink size={12} strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
