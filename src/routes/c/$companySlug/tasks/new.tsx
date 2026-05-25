import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  FileText,
  Users,
  Layers,
  Plus,
  X,
  Check,
  ChevronDown,
  Folder,
} from "lucide-react";
import { companyProjectsQueryOptions, companyProjectQueryOptions } from "@/api/projects";
import { useCompany } from "@/context/company-context";
import { usersQueryOptions } from "@/api/users";
import { createStandaloneTask } from "@/api/tasks";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/RichTextEditor";
import { FormInput } from "@/components/FormInput";
import { getAvatarColor } from "@/lib/avatar-colors";
import { cn } from "@/lib/utils";
import type { User } from "@/api/types";

export const Route = createFileRoute("/c/$companySlug/tasks/new")({
  validateSearch: z.object({
    project: z.string().optional(),
  }),
  component: CreateStandaloneTaskPage,
});

// ── Shared primitives ────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ user, size = 28 }: { user: User; size?: number }) {
  const fs = size <= 22 ? 9 : size <= 28 ? 10 : 13;
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0 font-semibold text-white"
      style={{
        width: size,
        height: size,
        background: getAvatarColor(user.name),
        fontSize: fs,
        letterSpacing: "0.02em",
      }}
    >
      {getInitials(user.name)}
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

// ── Project Select ───────────────────────────────────────────────────────────

function ProjectSelect({
  value,
  onChange,
  companySlug,
}: {
  value: string | null;
  onChange: (slug: string | null) => void;
  companySlug: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: projects = [] } = useQuery(companyProjectsQueryOptions(companySlug));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = projects.find((p) => p.slug === value) ?? null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-text-label">Project</label>
        <span className="text-xs text-text-disabled">Optional</span>
      </div>
      <div ref={ref} className="relative">
        <div
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex items-center gap-2.5 h-11 px-4 border-[1.5px] rounded-lg bg-surface cursor-pointer transition-all duration-150",
            open
              ? "border-accent [box-shadow:0_0_0_3px_var(--tf-focus-ring)]"
              : "border-border"
          )}
        >
          <Folder size={15} className="text-text-disabled shrink-0" />
          <span
            className={cn(
              "flex-1 text-sm",
              selected ? "text-text-primary font-medium" : "text-text-disabled"
            )}
          >
            {selected ? selected.name : "No project"}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "text-text-disabled transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </div>

        {open && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border
                        rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.06)]
                        z-50 overflow-hidden py-1"
          >
            {/* No project option */}
            <div
              onClick={() => { onChange(null); setOpen(false); }}
              className={cn(
                "px-3.5 py-2.5 text-sm cursor-pointer transition-colors duration-100 flex items-center justify-between",
                !value ? "font-medium text-text-primary bg-hover" : "text-text-secondary hover:bg-hover"
              )}
            >
              No project
              {!value && <Check size={14} className="text-accent" />}
            </div>
            {projects.length > 0 && <div className="h-px bg-border mx-2 my-1" />}
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => { onChange(p.slug); setOpen(false); }}
                className={cn(
                  "px-3.5 py-2.5 text-sm cursor-pointer transition-colors duration-100 flex items-center justify-between",
                  p.slug === value
                    ? "font-medium text-text-primary bg-hover"
                    : "text-text-primary hover:bg-hover"
                )}
              >
                <span className="truncate">{p.name}</span>
                {p.slug === value && <Check size={14} className="text-accent shrink-0" />}
              </div>
            ))}
            {projects.length === 0 && (
              <div className="px-4 py-3 text-sm text-text-disabled text-center">
                No projects yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Group Select ─────────────────────────────────────────────────────────────

function GroupSelect({
  value,
  groups,
  loading,
  onChange,
}: {
  value: string | null;
  groups: { id: string; title: string }[];
  loading: boolean;
  onChange: (groupId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = groups.find((g) => g.id === value) ?? null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-text-label">Group</label>
        <span className="text-xs text-text-disabled">Optional</span>
      </div>
      <div ref={ref} className="relative">
        <div
          onClick={() => !loading && setOpen((o) => !o)}
          className={cn(
            "flex items-center gap-2.5 h-11 px-4 border-[1.5px] rounded-lg bg-surface transition-all duration-150",
            loading ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            open
              ? "border-accent [box-shadow:0_0_0_3px_var(--tf-focus-ring)]"
              : "border-border"
          )}
        >
          <Layers size={15} className="text-text-disabled shrink-0" />
          <span
            className={cn(
              "flex-1 text-sm",
              selected ? "text-text-primary font-medium" : "text-text-disabled"
            )}
          >
            {loading ? "Loading groups…" : selected ? selected.title : "No group"}
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "text-text-disabled transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </div>

        {open && !loading && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border
                        rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.06)]
                        z-50 overflow-hidden py-1"
          >
            <div
              onClick={() => { onChange(null); setOpen(false); }}
              className={cn(
                "px-3.5 py-2.5 text-sm cursor-pointer transition-colors duration-100 flex items-center justify-between",
                !value ? "font-medium text-text-primary bg-hover" : "text-text-secondary hover:bg-hover"
              )}
            >
              No group
              {!value && <Check size={14} className="text-accent" />}
            </div>
            {groups.length > 0 && <div className="h-px bg-border mx-2 my-1" />}
            {groups.map((g) => (
              <div
                key={g.id}
                onClick={() => { onChange(g.id); setOpen(false); }}
                className={cn(
                  "px-3.5 py-2.5 text-sm cursor-pointer transition-colors duration-100 flex items-center justify-between",
                  g.id === value
                    ? "font-medium text-text-primary bg-hover"
                    : "text-text-primary hover:bg-hover"
                )}
              >
                {g.title}
                {g.id === value && <Check size={14} className="text-accent" />}
              </div>
            ))}
            {groups.length === 0 && (
              <div className="px-4 py-3 text-sm text-text-disabled text-center">
                This project has no groups.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Assignee Picker ──────────────────────────────────────────────────────────

function AssigneeChip({ user, onRemove }: { user: User; onRemove: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full transition-all duration-150",
        hovered
          ? "bg-accent-subtle border border-accent-border"
          : "bg-hover border border-transparent"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar user={user} size={22} />
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

function AssigneePicker({
  selected,
  users,
  onToggle,
}: {
  selected: string[];
  users: User[];
  onToggle: (id: string) => void;
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
            <AssigneeChip key={u.id} user={u} onRemove={() => onToggle(u.id)} />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                   text-text-secondary hover:bg-hover transition-colors duration-150"
      >
        <Plus size={13} />
        Add assignee
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-72 bg-surface border border-border
                      rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.06)]
                      z-50 overflow-hidden"
        >
          <div className="p-2 border-b border-hover">
            <input
              autoFocus
              placeholder="Search members…"
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
                <Avatar user={u} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">{u.name}</div>
                  {u.role && <div className="text-xs text-text-disabled capitalize">{u.role}</div>}
                </div>
                {selected.includes(u.id) && (
                  <Check size={14} className="text-accent shrink-0" />
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-sm text-text-disabled text-center">
                No members found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Date Input ───────────────────────────────────────────────────────────────

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

// ── Form ─────────────────────────────────────────────────────────────────────

function CreateStandaloneTaskForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const company = useCompany();
  const { project: projectParam } = Route.useSearch();

  const { data: projects = [] } = useQuery(companyProjectsQueryOptions(company.slug));
  const { data: users = [] } = useQuery(usersQueryOptions);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectSlug, setProjectSlug] = useState<string | null>(projectParam ?? null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [titleError, setTitleError] = useState("");

  // Fetch selected project's groups (only when a project is chosen)
  const { data: projectDetail, isLoading: groupsLoading } = useQuery({
    ...companyProjectQueryOptions(company.slug, projectSlug!),
    enabled: !!projectSlug,
  });
  const groups = projectDetail?.groups ?? [];

  // Reset group whenever project changes
  useEffect(() => {
    setGroupId(null);
  }, [projectSlug]);

  const selectedProject = projects.find((p) => p.slug === projectSlug) ?? null;

  const mutation = useMutation({
    mutationFn: () =>
      createStandaloneTask(company.slug, {
        title: title.trim(),
        description: description || undefined,
        projectId: selectedProject?.id ?? null,
        groupId: groupId,
        assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
        dueDate: dueDate || undefined,
      }),
    onSuccess: async () => {
      toast.success("Task created");
      await qc.invalidateQueries({ queryKey: ["companies", company.slug, "tasks"] });
      await qc.invalidateQueries({ queryKey: ["companies", company.slug, "projects"] });
      if (projectSlug) {
        await qc.invalidateQueries({ queryKey: ["companies", company.slug, "project", projectSlug] });
      }
      void navigate({ to: "/c/$companySlug", params: { companySlug: company.slug } });
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

  const canSubmit = title.trim().length > 0 && !mutation.isPending;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-8 pt-5 sm:pt-8 pb-20">
      {/* Back nav */}
      <nav className="flex items-center gap-1.5 text-sm mb-7">
        <Link
          to="/c/$companySlug"
          params={{ companySlug: company.slug }}
          className="flex items-center gap-1 text-accent-text font-medium hover:underline"
        >
          <ArrowLeft size={14} />
          {projectSlug
            ? (projects.find((p) => p.slug === projectSlug)?.name ?? "Project")
            : company.name}
        </Link>
        <span className="text-border">/</span>
        <span className="text-text-secondary font-medium">New task</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-xl font-bold text-text-primary tracking-tight">New task</h1>
        <p className="text-sm text-text-secondary mt-1">
          Only the title is required. Project and group are optional.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Card: Task Info */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-5">
          <SectionLabel icon={<FileText size={15} className="text-text-disabled" />}>
            Task Info
          </SectionLabel>

          <FormInput
            label="Title"
            placeholder="e.g. Fix login redirect on mobile"
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
              placeholder="What needs to be done? Add acceptance criteria, context, or links."
              minHeight={160}
              onChange={setDescription}
            />
          </div>
        </div>

        {/* Card: Project & Group */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-5">
          <SectionLabel icon={<Layers size={15} className="text-text-disabled" />}>
            Project &amp; Group
          </SectionLabel>

          <ProjectSelect value={projectSlug} onChange={setProjectSlug} companySlug={company.slug} />

          {projectSlug && (
            <GroupSelect
              value={groupId}
              groups={groups}
              loading={groupsLoading}
              onChange={setGroupId}
            />
          )}
        </div>

        {/* Card: People & Dates */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-5">
          <SectionLabel icon={<Users size={15} className="text-text-disabled" />}>
            People &amp; Dates
          </SectionLabel>
          <AssigneePicker
            selected={assigneeIds}
            users={users}
            onToggle={(id) =>
              setAssigneeIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              )
            }
          />
          <DateInput value={dueDate} onChange={setDueDate} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <Link
            to="/c/$companySlug"
            params={{ companySlug: company.slug }}
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
            {mutation.isPending ? (
              "Creating…"
            ) : (
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

// ── Page ─────────────────────────────────────────────────────────────────────

function CreateStandaloneTaskPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      void navigate({ to: "/login" });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;

  return <CreateStandaloneTaskForm />;
}
