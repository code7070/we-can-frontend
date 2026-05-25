import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TaskRow } from "./TaskRow";
import { renameGroup, deleteGroup } from "@/api/projects";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/context/company-context";
import type { TaskGroup as TaskGroupType } from "@/api/types";

interface Props {
  group: TaskGroupType;
  projectSlug: string;
}

export function TaskGroup({ group, projectSlug }: Props) {
  const company = useCompany();
  const [isOpen, setIsOpen] = useState(true);
  const [addHovered, setAddHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(group.title);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoggedIn } = useAuth();
  const qc = useQueryClient();

  const doneCount = group.tasks.filter((t) => t.isDone).length;

  const renameMutation = useMutation({
    mutationFn: () => renameGroup(projectSlug, group.id, editValue.trim()),
    onSuccess: () => {
      setEditing(false);
      toast.success("Group renamed");
      void qc.invalidateQueries({ queryKey: ["companies", company.slug, "project", projectSlug] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to rename group"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroup(projectSlug, group.id),
    onSuccess: () => {
      setDeleting(false);
      toast.success("Group deleted");
      void qc.invalidateQueries({ queryKey: ["companies", company.slug, "project", projectSlug] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete group"),
  });

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleStartRename(e: React.MouseEvent) {
    e.stopPropagation();
    setEditValue(group.title);
    setEditing(true);
  }

  function handleRenameSubmit() {
    if (editValue.trim() && editValue.trim() !== group.title) {
      renameMutation.mutate();
    } else {
      setEditing(false);
    }
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") setEditing(false);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (deleting) {
      // Second click = confirm
      deleteMutation.mutate();
    } else {
      setDeleting(true);
      // Auto-reset after 3s
      setTimeout(() => setDeleting(false), 3000);
    }
  }

  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-surface">
      <div
        className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-hover transition-colors duration-150 group"
      >
        <button onClick={() => setIsOpen((v) => !v)} className="flex items-center gap-2 flex-1 text-left">
          <ChevronDown
            className={cn(
              "w-4 h-4 text-text-secondary transition-transform duration-150 shrink-0",
              !isOpen && "-rotate-90"
            )}
          />

          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-7 px-2 rounded-md bg-surface text-xs font-semibold text-text-primary
                         uppercase tracking-wider border border-accent outline-none
                         [box-shadow:0_0_0_3px_var(--tf-focus-ring)]"
            />
          ) : (
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {group.title}
            </span>
          )}

          <span className="text-xs text-text-disabled ml-auto">{group.tasks.length}</span>
        </button>

        {/* Group actions — visible on hover when logged in */}
        {isLoggedIn && !editing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={handleStartRename}
              className="w-7 h-7 rounded-md flex items-center justify-center text-text-disabled hover:text-text-secondary hover:bg-border-strong transition-colors duration-150"
              title="Rename group"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleDelete}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150",
                deleting
                  ? "text-white bg-danger hover:bg-red-700"
                  : "text-text-disabled hover:text-danger hover:bg-danger-bg"
              )}
              title={deleting ? "Click again to confirm" : "Delete group"}
            >
              {deleting ? <Check size={14} /> : <Trash2 size={13} />}
            </button>
          </div>
        )}

        {editing && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleRenameSubmit(); }}
              disabled={!editValue.trim() || renameMutation.isPending}
              className="w-7 h-7 rounded-md flex items-center justify-center text-accent hover:bg-accent-hover transition-colors duration-150"
            >
              <Check size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(false); }}
              className="w-7 h-7 rounded-md flex items-center justify-center text-text-disabled hover:text-text-secondary hover:bg-border-strong transition-colors duration-150"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <>
          {[...group.tasks].sort((a, b) => b.id.localeCompare(a.id)).map((task) => (
            <TaskRow key={task.id} task={task} projectSlug={projectSlug} />
          ))}

          {/* Inline add task CTA */}
          <Link
            to="/c/$companySlug/projects/$projectSlug/tasks/new"
            params={{ companySlug: company.slug, projectSlug }}
            search={{ group: group.title }}
            onMouseEnter={() => setAddHovered(true)}
            onMouseLeave={() => setAddHovered(false)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150",
              "border-t border-hover",
              addHovered ? "text-accent bg-soft" : "text-text-disabled bg-transparent"
            )}
          >
            <Plus size={14} />
            Add task
          </Link>
        </>
      )}

      {!isOpen && group.tasks.length > 0 && (
        <p className="text-sm text-text-disabled px-4 pb-2">
          {doneCount} of {group.tasks.length} completed
        </p>
      )}
    </div>
  );
}
