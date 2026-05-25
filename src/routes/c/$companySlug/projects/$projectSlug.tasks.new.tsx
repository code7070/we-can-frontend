import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  Plus,
  X,
  FileText,
  Users,
  Layers,
  Link as LinkIcon,
  Check,
  ChevronDown,
} from "lucide-react";
import { companyProjectQueryOptions } from "@/api/projects";
import { useCompany } from "@/context/company-context";
import { createStandaloneTask } from "@/api/tasks";
import { usersQueryOptions } from "@/api/users";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/RichTextEditor";
import { FormInput } from "@/components/FormInput";
import { getAvatarColor } from "@/lib/avatar-colors";
import { cn } from "@/lib/utils";
import type { TaskGroup, User } from "@/api/types";

// ─── Route ──────────────────────────────────────────────────────────────────

const searchSchema = z.object({
  group: z.string().optional(),
});

export const Route = createFileRoute("/c/$companySlug/projects/$projectSlug/tasks/new")({
  validateSearch: searchSchema,
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(companyProjectQueryOptions(params.companySlug, params.projectSlug)),
  component: CreateTaskPage,
});

// ─── Shared primitives ───────────────────────────────────────────────────────

function Avatar({ name, initials, size = 28 }: { name: string; initials: string; size?: number }) {
  const fs = size <= 22 ? 9 : size <= 28 ? 10 : 13;
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0 font-semibold text-white"
      style={{ width: size, height: size, background: getAvatarColor(name), fontSize: fs, letterSpacing: "0.02em" }}
    >
      {initials}
    </div>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3.5">
      {icon}
      <span className="text-xs font-semibold text-text-secondary uppercase tracking-[0.07em]">
        {children}
      </span>
    </div>
  );
}

// ─── Member Chip ─────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function MemberChip({ user, onRemove }: { user: User; onRemove: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full transition-all duration-150",
        hovered ? "bg-accent-subtle border border-accent-border" : "bg-hover border border-transparent"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar name={user.name} initials={getInitials(user.name)} size={22} />
      <span className="text-xs font-medium text-text-primary">{user.name}</span>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150 ml-0.5",
          hovered ? "bg-accent-hover text-text-secondary" : "bg-border text-text-secondary"
        )}
      >
        <X size={8} />
      </button>
    </div>
  );
}

// ─── Member Picker ───────────────────────────────────────────────────────────

function MemberPicker({ selected, users, onToggle }: { selected: string[]; users: User[]; onToggle: (id: string) => void }) {
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

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.role ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const selectedUsers = users.filter((u) => selected.includes(u.id));

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-sm font-medium text-text-label">Assignees</label>
        <span className="text-xs text-text-disabled">Optional</span>
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedUsers.map((u) => (
            <MemberChip key={u.id} user={u} onRemove={() => onToggle(u.id)} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                   text-text-secondary hover:bg-hover transition-colors duration-150"
      >
        <Plus size={13} />
        Add assignee
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-surface border border-border
                        rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.06)]
                        z-50 overflow-hidden">
          <div className="p-2 border-b border-hover">
            <input
              autoFocus
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border text-sm
                         text-text-primary font-sans outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.map((u) => (
              <div
                key={u.id}
                onClick={() => onToggle(u.id)}
                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer
                           hover:bg-hover transition-colors duration-150"
              >
                <Avatar name={u.name} initials={getInitials(u.name)} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{u.name}</div>
                  {u.role && <div className="text-xs text-text-disabled capitalize">{u.role}</div>}
                </div>
                {selected.includes(u.id) && <Check size={14} className="text-accent shrink-0" />}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-text-disabled text-center">No members found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Group Select ─────────────────────────────────────────────────────────────

interface GroupSelectProps {
  value: string | null;
  groups: TaskGroup[];
  onChange: (groupId: string | null) => void;
}

function GroupSelect({ value, groups, onChange }: GroupSelectProps) {
  const [open, setOpen] = useState(false);
  const [hIdx, setHIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = groups.find((g) => g.id === value);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-text-label">Task Group</label>
        <span className="text-xs text-text-disabled">Optional</span>
      </div>
      <div ref={ref} className="relative">
        <div
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-2.5 h-11 px-4 border-[1.5px] rounded-lg bg-surface cursor-pointer transition-all duration-150",
            open
              ? "border-accent [box-shadow:0_0_0_3px_var(--tf-focus-ring)]"
              : "border-border"
          )}
        >
          <Layers size={15} className="text-text-disabled shrink-0" />
          <span className={cn("flex-1 text-sm", selected ? "text-text-primary font-medium" : "text-text-disabled")}>
            {selected ? selected.title : "Select a group…"}
          </span>
          <ChevronDown
            size={16}
            className={cn("text-text-disabled transition-transform duration-150", open && "rotate-180")}
          />
        </div>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border
                          rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.06)]
                          z-50 overflow-hidden py-1">
            <div
              onClick={() => { onChange(null); setOpen(false); }}
              onMouseEnter={() => setHIdx(-1)}
              className={cn(
                "px-3.5 py-2.5 text-sm cursor-pointer transition-colors duration-100 flex items-center justify-between",
                !value ? "font-medium text-text-primary bg-hover" : "text-text-secondary hover:bg-hover"
              )}
            >
              No group
              {!value && <Check size={14} className="text-accent" />}
            </div>
            {groups.length > 0 && <div className="h-px bg-border mx-2 my-1" />}
            {groups.map((g, i) => (
              <div
                key={g.id}
                onClick={() => { onChange(g.id); setOpen(false); }}
                onMouseEnter={() => setHIdx(i)}
                onMouseLeave={() => setHIdx(-1)}
                className={cn(
                  "px-3.5 py-2.5 text-sm cursor-pointer transition-colors duration-100 flex items-center justify-between",
                  hIdx === i ? "bg-hover" : "bg-transparent",
                  g.id === value ? "font-medium text-text-primary" : "font-normal text-text-primary"
                )}
              >
                {g.title}
                {g.id === value && <Check size={14} className="text-accent" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Date Input ───────────────────────────────────────────────────────────────

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-text-label">Due Date</label>
        <span className="text-xs text-text-disabled">Optional</span>
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "w-full h-11 px-4 border-[1.5px] rounded-lg bg-surface text-sm font-sans outline-none transition-all duration-150",
          value ? "text-text-primary" : "text-text-disabled",
          focused
            ? "border-accent [box-shadow:0_0_0_3px_var(--tf-focus-ring)]"
            : "border-border"
        )}
      />
    </div>
  );
}

// ─── Linked Task Chip ─────────────────────────────────────────────────────────

interface ExistingTask {
  id: string;
  title: string;
  isDone: boolean;
  groupTitle: string;
}

function LinkedTaskChip({ task, onRemove }: { task: ExistingTask; onRemove: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-2.5 bg-surface border border-border rounded-lg transition-colors duration-150"
      style={{ borderLeft: "3px solid var(--accent)", background: hovered ? "var(--tf-soft)" : "var(--tf-surface)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{
          width: 16, height: 16,
          border: `2px solid ${task.isDone ? "var(--accent)" : "var(--tf-border-strong)"}`,
          background: task.isDone ? "var(--accent)" : "var(--tf-surface)",
        }}
      >
        {task.isDone && (
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--accent-foreground)" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm font-medium truncate", task.isDone ? "text-text-secondary line-through" : "text-text-primary")}>
          {task.title}
        </div>
        <div className="text-xs text-text-disabled mt-0.5">{task.groupTitle}</div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          "w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 shrink-0",
          hovered ? "bg-danger-bg text-danger" : "bg-transparent text-border"
        )}
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Linked Task Picker ───────────────────────────────────────────────────────

function LinkedTaskPicker({
  linked,
  allTasks,
  onAdd,
  onRemove,
}: {
  linked: string[];
  allTasks: ExistingTask[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
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

  const filtered = allTasks.filter(
    (t) => !linked.includes(t.id) && t.title.toLowerCase().includes(search.toLowerCase())
  );
  const linkedTasks = allTasks.filter((t) => linked.includes(t.id));

  return (
    <div ref={ref} className="relative">
      {linkedTasks.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {linkedTasks.map((t) => (
            <LinkedTaskChip key={t.id} task={t} onRemove={() => onRemove(t.id)} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                   text-text-secondary hover:bg-hover transition-colors duration-150"
      >
        <LinkIcon size={13} />
        Link existing task
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 max-w-[480px] bg-surface border border-border
                        rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.06)]
                        z-50 overflow-hidden">
          <div className="p-2 border-b border-hover">
            <input
              autoFocus
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md border border-border text-sm
                         text-text-primary font-sans outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => { onAdd(t.id); setOpen(false); setSearch(""); }}
                className="px-3.5 py-2.5 cursor-pointer hover:bg-hover transition-colors duration-100"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{
                      width: 16, height: 16,
                      border: `2px solid ${t.isDone ? "var(--accent)" : "var(--tf-border-strong)"}`,
                      background: t.isDone ? "var(--accent)" : "var(--tf-surface)",
                    }}
                  >
                    {t.isDone && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--accent-foreground)" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={cn("text-sm font-medium", t.isDone ? "text-text-secondary line-through" : "text-text-primary")}>
                    {t.title}
                  </span>
                </div>
                <div className="text-xs text-text-disabled mt-0.5 pl-6">{t.groupTitle}</div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-text-disabled text-center">
                {search ? "No matching tasks." : "All tasks already linked."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create Task Form ─────────────────────────────────────────────────────────

function CreateTaskForm() {
  const { projectSlug } = Route.useParams();
  const company = useCompany();
  const { group: preselectedGroupTitle } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: project } = useSuspenseQuery(companyProjectQueryOptions(company.slug, projectSlug));
  const { data: users = [] } = useQuery(usersQueryOptions);

  // Pre-select group by title from search param
  const preselectedGroup = project.groups.find(
    (g) => g.title === preselectedGroupTitle
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState<string | null>(preselectedGroup?.id ?? null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [linkedTaskIds, setLinkedTaskIds] = useState<string[]>([]);
  const [titleError, setTitleError] = useState("");

  // Flatten all tasks from all groups for the linked task picker
  const allTasks: ExistingTask[] = project.groups.flatMap((g) =>
    g.tasks.map((t) => ({ id: t.id, title: t.title, isDone: t.isDone, groupTitle: g.title }))
  );

  const mutation = useMutation({
    mutationFn: () =>
      createStandaloneTask(company.slug, {
        title: title.trim(),
        description: description || undefined,
        projectId: project.id,
        groupId,
        assigneeIds: selectedMembers,
        dueDate: dueDate || undefined,
        linkedTaskIds: linkedTaskIds.length > 0 ? linkedTaskIds : undefined,
      }),
    onSuccess: async () => {
      toast.success("Task created");
      await queryClient.invalidateQueries({ queryKey: ["companies", company.slug, "project", projectSlug] });
      void navigate({ to: "/c/$companySlug/projects/$projectSlug", params: { companySlug: company.slug, projectSlug } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create task"),
  });

  function handleSubmit() {
    if (!title.trim()) {
      setTitleError("Task title is required.");
      return;
    }
    setTitleError("");
    mutation.mutate();
  }

  function toggleMember(id: string) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const canSubmit = title.trim().length > 0 && !mutation.isPending;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-8 pt-5 sm:pt-8 pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-7">
        <Link
          to="/c/$companySlug/projects/$projectSlug"
          params={{ companySlug: company.slug, projectSlug }}
          className="flex items-center gap-1 text-accent-text font-medium hover:underline"
        >
          <ArrowLeft size={14} />
          {project.name}
        </Link>
        <span className="text-border">/</span>
        <span className="text-text-secondary font-medium">New task</span>
      </nav>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-text-primary tracking-tight">Add a new task</h1>
        <p className="text-sm text-text-secondary mt-1">
          Fill in the details below. Only the title is required.
        </p>
      </div>

      <div className="flex flex-col gap-7">
        {/* Card: Task Info */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-5">
          <SectionLabel icon={<FileText size={15} className="text-text-disabled" />}>
            Task Info
          </SectionLabel>

          <FormInput
            label="Title"
            placeholder="e.g. QA pass — homepage mobile"
            value={title}
            onChange={(v) => { setTitle(v); if (titleError) setTitleError(""); }}
            required
            error={titleError}
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium text-text-label">Description</label>
              <span className="text-xs text-text-disabled">Optional</span>
            </div>
            <RichTextEditor
              placeholder="What needs to be done? Add acceptance criteria, links, or context."
              minHeight={160}
              onChange={setDescription}
            />
            <span className="text-xs text-text-disabled">Format text, add links, or insert notes.</span>
          </div>

          <GroupSelect value={groupId} groups={project.groups} onChange={setGroupId} />
        </div>

        {/* Card: People & Dates */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-5">
          <SectionLabel icon={<Users size={15} className="text-text-disabled" />}>
            People &amp; Dates
          </SectionLabel>
          <MemberPicker selected={selectedMembers} users={users} onToggle={toggleMember} />
          <DateInput value={dueDate} onChange={setDueDate} />
        </div>

        {/* Card: Linked Tasks */}
        {allTasks.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <SectionLabel icon={<LinkIcon size={15} className="text-text-disabled" />}>
              Linked Tasks
            </SectionLabel>
            <p className="text-sm text-text-disabled mb-4 -mt-2">
              Connect this task to existing ones for context.
            </p>
            <LinkedTaskPicker
              linked={linkedTaskIds}
              allTasks={allTasks}
              onAdd={(id) => setLinkedTaskIds((prev) => [...prev, id])}
              onRemove={(id) => setLinkedTaskIds((prev) => prev.filter((x) => x !== id))}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Link
            to="/c/$companySlug/projects/$projectSlug"
            params={{ companySlug: company.slug, projectSlug }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary
                       hover:bg-hover transition-colors duration-150"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150",
              canSubmit
                ? "bg-accent hover:bg-accent-text text-accent-foreground cursor-pointer"
                : "bg-border text-text-disabled cursor-not-allowed"
            )}
          >
            {mutation.isPending ? "Creating..." : (
              <>
                <Plus size={15} />
                Create task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateTaskPage() {
  return (
    <Suspense fallback={<div className="max-w-[720px] mx-auto px-4 sm:px-8 pt-5 sm:pt-8"><div className="h-8 w-48 bg-border rounded animate-pulse mb-8" /></div>}>
      <CreateTaskForm />
    </Suspense>
  );
}
