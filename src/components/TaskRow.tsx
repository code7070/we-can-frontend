import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CornerDownRight, CornerUpRight, MessageSquareText, Clock } from "lucide-react";
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

function formatDueChip(dueDate: string): { label: string; tone: "warn" | "danger" | "muted" } {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "danger" };
  if (days === 0) return { label: "Due today", tone: "danger" };
  if (days <= 7) return { label: `Due in ${days}d`, tone: "warn" };
  return {
    label: `Due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
    tone: "muted",
  };
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TaskRow({ task, projectSlug }: Props) {
  const { isLoggedIn } = useAuth();
  const qc = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const taskDetailQuery = useQuery({
    ...taskQueryOptions(task.id),
    enabled: isExpanded,
  });

  const detail = taskDetailQuery.data;
  const lastComment = detail?.thread?.[detail.thread.length - 1] ?? null;
  const linkedCount = detail?.linkedTasks?.length ?? 0;
  const commentCount = task.commentCount ?? detail?.thread?.length ?? 0;
  const dueChip = task.dueDate && !task.isDone ? formatDueChip(task.dueDate) : null;

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
          onClick={() => setIsExpanded((v) => !v)}
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

      {/* ── Expanded Section (Variant B — Conversational) ── */}
      {isExpanded && (
        <div className="border-t border-border bg-[#FAFAFA]">
          <div className="flex gap-3 px-4 py-3">
            {/* Spacer matches checkbox + gap so content aligns with title */}
            <div className="w-5 shrink-0" />
            <CornerDownRight
              size={14}
              className="text-text-disabled shrink-0 mt-1"
              strokeWidth={1.5}
              aria-hidden
            />

            <div className="flex-1 min-w-0 space-y-3">
              {/* Chips row */}
              {(dueChip || linkedCount > 0 || commentCount > 0) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {dueChip && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                        dueChip.tone === "danger" && "bg-[#FEE2E2] text-[#DC2626]",
                        dueChip.tone === "warn" && "bg-[#FEF3C7] text-[#D97706]",
                        dueChip.tone === "muted" && "bg-[#F4F4F5] text-text-secondary"
                      )}
                    >
                      <Clock size={11} strokeWidth={2} />
                      {dueChip.label}
                    </span>
                  )}
                  {linkedCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#F4F4F5] text-text-secondary">
                      <CornerUpRight size={11} strokeWidth={2} />
                      {linkedCount} linked
                    </span>
                  )}
                  {commentCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#F4F4F5] text-text-secondary">
                      <MessageSquareText size={11} strokeWidth={2} />
                      {commentCount} comment{commentCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}

              {/* Description block */}
              {taskDetailQuery.isLoading ? (
                <div className="space-y-1.5">
                  <div className="h-2.5 w-16 bg-[#F4F4F5] rounded animate-pulse" />
                  <div className="h-3 w-full bg-[#F4F4F5] rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-[#F4F4F5] rounded animate-pulse" />
                </div>
              ) : detail?.description ? (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold tracking-wider text-text-disabled uppercase">
                    Description
                  </p>
                  <div className="line-clamp-2 text-sm text-[#3F3F46]">
                    <MarkdownRenderer content={detail.description} />
                  </div>
                </div>
              ) : null}

              {/* Divider */}
              {(detail?.description || taskDetailQuery.isLoading) && (
                <div className="h-px bg-[#F4F4F5]" />
              )}

              {/* Comment bubble */}
              {taskDetailQuery.isLoading ? (
                <div className="rounded-lg border border-border bg-white p-3 space-y-1.5">
                  <div className="h-3 w-32 bg-[#F4F4F5] rounded animate-pulse" />
                  <div className="h-3 w-full bg-[#F4F4F5] rounded animate-pulse" />
                </div>
              ) : lastComment ? (
                <div className="rounded-lg border border-border bg-white p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-text-primary">
                      {lastComment.author.name}
                    </span>
                    <span className="text-xs text-text-disabled">
                      · {timeAgo(lastComment.createdAt)}
                    </span>
                  </div>
                  <div className="line-clamp-2 text-sm text-text-secondary">
                    <MarkdownRenderer content={lastComment.body} />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-disabled italic">No comments yet.</p>
              )}

              {/* Composer / open task */}
              <Link
                to="/projects/$slug/tasks/$taskId"
                params={{ slug: projectSlug, taskId: task.id }}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-white hover:border-accent hover:bg-accent/5 transition-colors duration-150 group/composer"
              >
                <span className="text-sm text-text-disabled">
                  Reply or @mention…
                </span>
                <span className="text-xs font-medium text-accent group-hover/composer:text-accent-text whitespace-nowrap">
                  Open task →
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
