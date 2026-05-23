import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { taskQueryOptions } from "@/api/tasks";
import { usersQueryOptions } from "@/api/users";
import { apiFetch } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useError } from "@/context/error-context";
import { AssigneeAvatars } from "@/components/AssigneeAvatars";
import { RichTextEditor } from "@/components/RichTextEditor";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { MediaSelector, type InsertedMedia } from "@/components/MediaSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { getAvatarColor } from "@/lib/avatar-colors";
import { cn } from "@/lib/utils";
import type { User } from "@/api/types";
import {
  Users,
  Calendar,
  FolderOpen,
  Layers,
  Link as LinkIcon,
  ArrowUpRight,
  Paperclip,
  Send,
  X,
  UserPlus,
  Clock,
  Pencil,
  Check,
  Plus,
  GitBranch,
} from "lucide-react";

export const Route = createFileRoute("/projects/$slug/tasks/$taskId")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(taskQueryOptions(params.taskId)),
  component: TaskDetailPage,
});

// ─── Checkbox ────────────────────────────────────────────────────────────────

function Checkbox({
  checked,
  onChange,
  size = 22,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  size?: number;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={disabled ? undefined : onChange}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center justify-center rounded-full shrink-0 transition-all duration-150"
      style={{
        width: size,
        height: size,
        border: `2px solid ${checked ? "#2563EB" : hovered ? "#2563EB" : "#D4D4D8"}`,
        background: checked ? "#2563EB" : "#FFF",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {checked && (
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, initials, size = 36 }: { name: string; initials: string; size?: number }) {
  const fs = size <= 24 ? 9 : size <= 28 ? 10 : size <= 36 ? 13 : 15;
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0 font-semibold text-white"
      style={{ width: size, height: size, background: getAvatarColor(name), fontSize: fs, letterSpacing: "0.02em" }}
    >
      {initials}
    </div>
  );
}

// ─── File Attachment ──────────────────────────────────────────────────────────

function FileAttachment({ name, size: fileSize, mimeType }: { name: string; size: number; mimeType: string; url: string }) {
  const [hovered, setHovered] = useState(false);
  const ext = name.split(".").pop()?.toUpperCase() ?? "FILE";
  const typeColors: Record<string, string> = {
    PNG: "#2563EB", JPG: "#2563EB", JPEG: "#2563EB", GIF: "#2563EB",
    PDF: "#DC2626", FIG: "#059669", ZIP: "#71717A", MP4: "#D97706",
  };
  const bg = typeColors[ext] ?? "#71717A";
  void mimeType;

  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 border border-border rounded-lg cursor-pointer transition-colors duration-150 max-w-[280px]"
      style={{ background: hovered ? "#F4F4F5" : "#FFF" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex items-center justify-center rounded-md shrink-0"
        style={{ width: 36, height: 36, background: bg, fontSize: 10, fontWeight: 700, color: "#FFF", letterSpacing: "0.04em" }}
      >
        {ext}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary truncate">{name}</div>
        <div className="text-xs text-text-disabled mt-0.5">{Math.round(fileSize / 1024)} KB</div>
      </div>
      <ArrowUpRight size={12} className="text-text-disabled shrink-0" />
    </div>
  );
}

// ─── Meta Row ─────────────────────────────────────────────────────────────────

function MetaRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0 py-2.5 border-b border-[#F4F4F5] last:border-b-0">
      <div className="flex items-center gap-1.5 w-36 shrink-0 text-text-secondary">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex-1 text-sm text-text-primary">{children}</div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ icon, children, count }: { icon?: React.ReactNode; children: React.ReactNode; count?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3.5">
      {icon}
      <span className="text-xs font-semibold text-text-secondary uppercase tracking-[0.07em]">{children}</span>
      {count && <span className="text-xs text-text-disabled font-normal">{count}</span>}
    </div>
  );
}

// ─── Assignee Picker (inline, edit mode) ──────────────────────────────────────

function AssigneePicker({
  selectedIds,
  allUsers,
  onChange,
}: {
  selectedIds: string[];
  allUsers: User[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  const filtered = allUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );
  const selected = allUsers.filter((u) => selectedIds.includes(u.id));

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center flex-wrap gap-1.5">
        {selected.map((u) => {
          const initials = u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div
              key={u.id}
              className="inline-flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-full bg-[#F4F4F5] border border-transparent hover:bg-accent-subtle hover:border-[#BFDBFE] transition-colors duration-150"
            >
              <Avatar name={u.name} initials={initials} size={20} />
              <span className="text-xs font-medium text-text-primary">{u.name}</span>
              <button
                type="button"
                onClick={() => toggle(u.id)}
                className="w-4 h-4 rounded-full bg-border text-text-secondary hover:bg-[#DBEAFE] flex items-center justify-center"
              >
                <X size={8} />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-text-secondary hover:bg-[#F4F4F5] transition-colors duration-150"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-surface border border-border rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.06)] z-50 overflow-hidden">
          <div className="p-2 border-b border-[#F4F4F5]">
            <input
              autoFocus
              placeholder="Search members…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border text-sm text-text-primary font-sans outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.map((u) => {
              const initials = u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              const checked = selectedIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggle(u.id)}
                  className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-[#F4F4F5] transition-colors duration-150"
                >
                  <Avatar name={u.name} initials={initials} size={26} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">{u.name}</div>
                    {u.role && <div className="text-xs text-text-disabled">{u.role}</div>}
                  </div>
                  {checked && <Check size={14} className="text-accent shrink-0" />}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-text-disabled text-center">No members found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Task Detail Content ──────────────────────────────────────────────────────

function TaskDetailContent() {
  const { slug, taskId } = Route.useParams();
  const { data: task } = useSuspenseQuery(taskQueryOptions(taskId));
  const { isLoggedIn } = useAuth();
  const { showError } = useError();
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const [commentKey, setCommentKey] = useState(0);
  const [commentEmpty, setCommentEmpty] = useState(true);
  const [showMedia, setShowMedia] = useState(false);
  const [commentAttachments, setCommentAttachments] = useState<InsertedMedia[]>([]);

  // ─── Edit mode ──────────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description ?? "");
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>(
    task.assignees.map((a) => a.id)
  );
  const [editDueDate, setEditDueDate] = useState(task.dueDate ?? "");
  const [editBranch, setEditBranch] = useState(task.branch ?? "");

  // Fetch all users for assignee picker — only when in edit mode
  const usersQuery = useQuery({ ...usersQueryOptions, enabled: editMode });
  const allUsers = usersQuery.data ?? [];

  const updateTask = useMutation({
    mutationFn: (body: {
      title?: string;
      description?: string;
      assigneeIds?: string[];
      dueDate?: string | null;
      branch?: string | null;
    }) =>
      apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["task", taskId] });
      void qc.invalidateQueries({ queryKey: ["project"] });
      setEditMode(false);
    },
    onError: showError,
  });

  function enterEditMode() {
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditAssigneeIds(task.assignees.map((a) => a.id));
    setEditDueDate(task.dueDate ?? "");
    setEditBranch(task.branch ?? "");
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditAssigneeIds(task.assignees.map((a) => a.id));
    setEditDueDate(task.dueDate ?? "");
    setEditBranch(task.branch ?? "");
  }

  function saveEdit() {
    const title = editTitle.trim();
    if (!title) return;
    updateTask.mutate({
      title,
      description: editDescription || undefined,
      assigneeIds: editAssigneeIds,
      dueDate: editDueDate ? editDueDate : null,
      branch: editBranch.trim() ? editBranch.trim() : null,
    });
  }

  const toggleTask = useMutation({
    mutationFn: (isDone: boolean) =>
      apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ isDone }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["project"] });
      void qc.invalidateQueries({ queryKey: ["task", taskId] });
    },
    onError: showError,
  });

  const addComment = useMutation({
    mutationFn: (body: string) =>
      apiFetch(`/tasks/${taskId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["task", taskId] });
      setCommentKey((k) => k + 1);
      setComment("");
      setCommentEmpty(true);
      setCommentAttachments([]);
    },
    onError: showError,
  });

  function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) return;
    if (commentEmpty && commentAttachments.length === 0) return;
    addComment.mutate(comment);
  }

  const handleCommentChange = useCallback((value: string) => {
    setComment(value);
    setCommentEmpty(value.trim() === "");
  }, []);

  return (
    <div className="max-w-[720px] mx-auto px-8 pt-8 pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-7">
        <Link to="/" className="text-accent-text font-medium hover:underline">Home</Link>
        <span className="text-border">/</span>
        <Link
          to="/projects/$slug"
          params={{ slug }}
          className="text-accent-text font-medium hover:underline"
        >
          {task.project.name}
        </Link>
        <span className="text-border">/</span>
        <span className="text-text-secondary font-medium truncate max-w-[200px]">{task.title}</span>
      </nav>

      {/* Task header */}
      <div className="flex items-start gap-3.5 mb-7">
        <div className="pt-0.5">
          <Checkbox
            checked={task.isDone}
            onChange={() => isLoggedIn && toggleTask.mutate(!task.isDone)}
            size={24}
            disabled={!isLoggedIn || toggleTask.isPending}
          />
        </div>
        <div className="flex-1 min-w-0">
          {editMode ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              autoFocus
              className="w-full text-xl font-semibold leading-snug tracking-tight bg-transparent
                         text-text-primary border-b-2 border-accent outline-none pb-0.5
                         transition-all duration-150 font-sans"
              placeholder="Task title"
            />
          ) : (
            <h1
              className={cn(
                "text-xl font-semibold leading-snug tracking-tight transition-all duration-150",
                task.isDone ? "line-through text-text-secondary opacity-50" : "text-text-primary"
              )}
            >
              {task.title}
            </h1>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-text-secondary">
            <span className="bg-[#F4F4F5] px-2 py-0.5 rounded text-xs font-medium text-text-secondary">
              {task.group.title}
            </span>
            <span>·</span>
            <span>{task.project.name}</span>
          </div>
        </div>
        {!editMode && isLoggedIn && (
          <button
            onClick={enterEditMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                       text-text-secondary hover:bg-[#F4F4F5] transition-colors duration-150 shrink-0 mt-0.5"
          >
            <Pencil size={14} />
            Edit
          </button>
        )}
      </div>

      {/* Metadata card */}
      <div className="bg-surface border border-border rounded-xl px-5 py-1 mb-7">
        <MetaRow icon={<Users size={15} className="text-text-disabled" />} label="Assignees">
          {editMode ? (
            usersQuery.isLoading ? (
              <span className="text-text-disabled text-sm">Loading members…</span>
            ) : (
              <AssigneePicker
                selectedIds={editAssigneeIds}
                allUsers={allUsers}
                onChange={setEditAssigneeIds}
              />
            )
          ) : task.assignees.length > 0 ? (
            <div className="flex items-center gap-2.5">
              <AssigneeAvatars assignees={task.assignees} />
              <span className="text-sm text-text-primary">
                {task.assignees.map((a) => a.name).join(", ")}
              </span>
            </div>
          ) : (
            <span className="text-text-disabled">Unassigned</span>
          )}
        </MetaRow>

        <MetaRow icon={<Calendar size={15} className="text-text-disabled" />} label="Due Date">
          {editMode ? (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className={cn(
                  "h-8 px-2.5 rounded-md bg-surface text-sm font-sans outline-none",
                  "border border-border focus:border-accent focus:[box-shadow:0_0_0_3px_rgba(37,99,235,0.12)]",
                  "transition-all duration-150",
                  editDueDate ? "text-text-primary" : "text-text-disabled"
                )}
              />
              {editDueDate && (
                <button
                  type="button"
                  onClick={() => setEditDueDate("")}
                  className="text-xs font-medium text-text-secondary hover:text-text-primary px-1.5 py-1 rounded hover:bg-[#F4F4F5] transition-colors duration-150"
                >
                  Clear
                </button>
              )}
            </div>
          ) : task.dueDate ? (
            new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
          ) : (
            <span className="text-text-disabled">No due date</span>
          )}
        </MetaRow>

        {(task.branch || editMode) && (
          <MetaRow icon={<GitBranch size={15} className="text-text-disabled" />} label="Branch">
            {editMode ? (
              <input
                type="text"
                value={editBranch}
                onChange={(e) => setEditBranch(e.target.value)}
                placeholder="e.g. feat/login-flow"
                className={cn(
                  "w-full max-w-[320px] h-8 px-2.5 rounded-md bg-surface text-sm font-mono outline-none",
                  "border border-border focus:border-accent focus:[box-shadow:0_0_0_3px_rgba(37,99,235,0.12)]",
                  "transition-all duration-150 text-text-primary"
                )}
              />
            ) : task.branch ? (
              <span className="font-mono text-sm text-text-primary bg-[#F4F4F5] px-2 py-0.5 rounded">
                {task.branch}
              </span>
            ) : (
              <span className="text-text-disabled">—</span>
            )}
          </MetaRow>
        )}

        <MetaRow icon={<FolderOpen size={15} className="text-text-disabled" />} label="Project">
          <Link
            to="/projects/$slug"
            params={{ slug }}
            className="text-accent-text font-medium hover:underline"
          >
            {task.project.name}
          </Link>
        </MetaRow>

        <MetaRow icon={<Layers size={15} className="text-text-disabled" />} label="Task Group">
          {task.group.title}
        </MetaRow>

        {task.linkedTasks.length > 0 && (
          <MetaRow icon={<LinkIcon size={15} className="text-text-disabled" />} label="Linked Tasks">
            <span className="text-text-secondary">{task.linkedTasks.length} linked {task.linkedTasks.length === 1 ? "task" : "tasks"}</span>
          </MetaRow>
        )}

        {task.createdAt && (
          <MetaRow icon={<UserPlus size={15} className="text-text-disabled" />} label="Created by">
            {task.createdBy ? (
              <div className="flex items-center gap-2">
                <Avatar
                  name={task.createdBy.name}
                  initials={task.createdBy.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  size={22}
                />
                <span className="text-sm font-medium text-text-primary">{task.createdBy.name}</span>
                <span className="text-xs text-text-disabled">
                  · {new Date(task.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            ) : (
              <span className="text-xs text-text-disabled">
                {new Date(task.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </MetaRow>
        )}

        {task.updatedAt && task.updatedBy && (
          <MetaRow icon={<Clock size={15} className="text-text-disabled" />} label="Last edited">
            <div className="flex items-center gap-2">
              <Avatar
                name={task.updatedBy.name}
                initials={task.updatedBy.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                size={22}
              />
              <span className="text-sm font-medium text-text-primary">{task.updatedBy.name}</span>
              <span className="text-xs text-text-disabled">
                · {new Date(task.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </MetaRow>
        )}
      </div>

      {/* Description */}
      {(task.description || editMode) && (
        <div className="mb-7">
          <div className="flex items-center justify-between mb-3.5">
            <SectionLabel>Description</SectionLabel>
          </div>
          {editMode ? (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <RichTextEditor
                key={`desc-${editMode}`}
                placeholder="Add a description…"
                minHeight={140}
                initialValue={task.description ?? ""}
                onChange={setEditDescription}
              />
            </div>
          ) : (
            task.description && (
              <div className="bg-surface border border-border rounded-xl px-6 py-5 break-all">
                <MarkdownRenderer content={task.description} />
              </div>
            )
          )}
        </div>
      )}

      {/* Edit mode actions */}
      {editMode && (
        <div className="flex items-center justify-end gap-2 pt-1 mb-7">
          <button
            onClick={cancelEdit}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary
                       hover:bg-[#F4F4F5] transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={saveEdit}
            disabled={!editTitle.trim() || updateTask.isPending}
            className={cn(
              "inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150",
              editTitle.trim() && !updateTask.isPending
                ? "bg-accent hover:bg-accent-text text-white cursor-pointer"
                : "bg-border text-text-disabled cursor-not-allowed"
            )}
          >
            <Check size={14} />
            {updateTask.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      )}

      {/* Linked Tasks */}
      {task.linkedTasks.length > 0 && (
        <div className="mb-7">
          <SectionLabel icon={<LinkIcon size={14} className="text-text-disabled" />}>
            Linked Tasks
          </SectionLabel>
          <div className="flex flex-col gap-2">
            {task.linkedTasks.map((lt) => {
              const relationLabel = lt.relation === "follow-up-of" ? "↳ Follow-up of:" : "↳ Related to:";
              return (
                <div key={lt.id}>
                  <div className="text-xs text-text-disabled font-medium mb-1.5">{relationLabel}</div>
                  <Link
                    to="/projects/$slug/tasks/$taskId"
                    params={{ slug: lt.project.slug, taskId: lt.id }}
                    className="flex items-center gap-3 px-4 py-3.5 bg-surface border border-border rounded-lg hover:bg-[#FAFAFA] transition-colors duration-150"
                    style={{ borderLeft: "3px solid #2563EB" }}
                  >
                    <div
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: 18, height: 18,
                        border: `2px solid ${lt.isDone ? "#2563EB" : "#D4D4D8"}`,
                        background: lt.isDone ? "#2563EB" : "#FFF",
                      }}
                    >
                      {lt.isDone && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium", lt.isDone ? "text-text-secondary line-through" : "text-text-primary")}>
                        {lt.title}
                      </div>
                      <div className="text-xs text-text-disabled mt-0.5">
                        {lt.project.name} · {lt.groupTitle}
                      </div>
                    </div>
                    <ArrowUpRight size={12} className="text-text-disabled shrink-0" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Thread */}
      <div>
        <SectionLabel
          icon={<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-disabled"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>}
          count={task.thread.length > 0 ? `${task.thread.length} ${task.thread.length === 1 ? "comment" : "comments"}` : undefined}
        >
          Thread
        </SectionLabel>

        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {task.thread.length === 0 && (
            <p className="text-sm text-text-secondary text-center py-8 px-6">
              No comments yet. Start the conversation.
            </p>
          )}

          {task.thread.map((c) => {
            const initials = c.author.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <div key={c.id} className="flex gap-3 px-6 py-5 border-b border-[#F4F4F5] last:border-b-0">
                <Avatar name={c.author.name} initials={initials} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary">{c.author.name}</span>
                    {c.author.role && (
                      <span className="text-xs text-text-disabled">{c.author.role}</span>
                    )}
                    <span className="text-xs text-text-disabled">
                      · {new Date(c.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <MarkdownRenderer content={c.body} />
                  {c.attachments && c.attachments.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-3 max-w-[280px]">
                      {c.attachments.map((a) => (
                        <FileAttachment key={a.id} {...a} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Comment composer */}
          <div className={cn("px-6 py-4", task.thread.length > 0 && "border-t border-border")}>
            {isLoggedIn ? (
              <form onSubmit={handleCommentSubmit} className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-full bg-[#D97706] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  AM
                </div>
                <div className="flex-1 min-w-0">
                  <RichTextEditor
                    key={commentKey}
                    placeholder="Write a comment..."
                    minHeight={80}
                    onChange={handleCommentChange}
                    className="mb-2"
                  />
                  {commentAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {commentAttachments.map((a, i) => (
                        <div
                          key={`${a.name}-${i}`}
                          className="inline-flex items-center gap-2 pl-2 pr-1 py-1 bg-[#F4F4F5] border border-border rounded-full text-xs"
                        >
                          {a.type === "image" ? (
                            <img src={a.url} alt={a.name} className="w-5 h-5 rounded object-cover" />
                          ) : (
                            <Paperclip size={11} className="text-text-secondary" />
                          )}
                          <span className="text-text-primary font-medium max-w-[160px] truncate">{a.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setCommentAttachments((prev) => prev.filter((_, j) => j !== i))
                            }
                            className="w-4 h-4 rounded-full bg-border text-text-secondary hover:bg-[#DBEAFE] flex items-center justify-center"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowMedia(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg
                                 text-sm font-medium text-text-secondary hover:bg-[#F4F4F5] transition-colors duration-150"
                    >
                      <Paperclip size={14} />
                      Attach
                    </button>
                    <button
                      type="submit"
                      disabled={(commentEmpty && commentAttachments.length === 0) || addComment.isPending}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold",
                        "transition-all duration-150",
                        (!commentEmpty || commentAttachments.length > 0) && !addComment.isPending
                          ? "bg-accent hover:bg-accent-text text-white cursor-pointer"
                          : "bg-border text-text-disabled cursor-not-allowed"
                      )}
                    >
                      <Send size={13} />
                      {addComment.isPending ? "Posting..." : "Comment"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <p className="text-sm text-text-secondary text-center py-2">
                <Link to="/login" className="text-accent-text hover:underline">Sign in</Link>{" "}
                to leave a comment.
              </p>
            )}
          </div>
        </div>
      </div>

      <MediaSelector
        open={showMedia}
        onClose={() => setShowMedia(false)}
        onInsert={(m) => setCommentAttachments((prev) => [...prev, m])}
      />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TaskDetailSkeleton() {
  return (
    <div className="max-w-[720px] mx-auto px-8 pt-8 flex flex-col gap-6">
      <Skeleton className="h-4 w-48" />
      <div className="flex items-start gap-3.5">
        <Skeleton className="w-6 h-6 rounded-full shrink-0 mt-0.5" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="border border-border rounded-xl px-5 py-4 flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
      <div className="border border-border rounded-xl p-6 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 pb-5 border-b border-[#F4F4F5] last:border-b-0">
            <Skeleton className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-16 w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskDetailPage() {
  return (
    <Suspense fallback={<TaskDetailSkeleton />}>
      <TaskDetailContent />
    </Suspense>
  );
}
