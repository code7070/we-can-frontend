import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  X,
  GripVertical,
  FolderOpen,
  Layers,
  Users,
  Check,
} from "lucide-react";
import { createProject } from "@/api/projects";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import { FormTextarea } from "@/components/FormTextarea";
import { cn } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-colors";

export const Route = createFileRoute("/projects/new")({
  component: CreateProjectPage,
});

// ─── Static member list (replace with API when backend is ready) ───────────
const AVAILABLE_MEMBERS = [
  { id: "ra", initials: "RA", name: "Rizky Aditya", role: "Product Manager" },
  { id: "sn", initials: "SN", name: "Sarah Natalia", role: "UI/UX Designer" },
  { id: "bh", initials: "BH", name: "Bima Hartono", role: "Frontend Engineer" },
  { id: "dw", initials: "DW", name: "Dinda Wijaya", role: "Backend Engineer" },
  { id: "fp", initials: "FP", name: "Fahmi Pratama", role: "QA Engineer" },
  { id: "am", initials: "AM", name: "Ayu Maharani", role: "Project Manager" },
];

// ─── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ name, initials, size = 28 }: { name: string; initials: string; size?: number }) {
  const bg = getAvatarColor(name);
  const fontSize = size <= 24 ? 9 : size <= 28 ? 10 : 13;
  return (
    <div
      className="flex items-center justify-center rounded-full shrink-0 font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize, letterSpacing: "0.02em" }}
    >
      {initials}
    </div>
  );
}

// ─── Task Group Row ────────────────────────────────────────────────────────
function TaskGroupRow({
  value,
  onChange,
  onRemove,
  placeholder,
  autoFocus,
  canRemove,
}: {
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  canRemove: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-2 px-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <GripVertical size={14} className="text-border shrink-0 cursor-grab" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? "Group name"}
        autoFocus={autoFocus}
        className={cn(
          "flex-1 h-10 px-3 rounded-lg bg-surface text-sm text-text-primary",
          "border-[1.5px] outline-none transition-all duration-150 font-sans",
          focused
            ? "border-accent [box-shadow:0_0_0_3px_rgba(37,99,235,0.12)]"
            : "border-border"
        )}
      />
      <button
        onClick={onRemove}
        disabled={!canRemove}
        className={cn(
          "w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-150",
          canRemove
            ? hovered
              ? "text-danger"
              : "text-border"
            : "text-border opacity-30 cursor-not-allowed"
        )}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Member Chip ───────────────────────────────────────────────────────────
function MemberChip({
  member,
  onRemove,
}: {
  member: (typeof AVAILABLE_MEMBERS)[0];
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full transition-all duration-150",
        hovered ? "bg-accent-subtle border border-[#BFDBFE]" : "bg-[#F4F4F5] border border-transparent"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Avatar name={member.name} initials={member.initials} size={22} />
      <span className="text-xs font-medium text-text-primary">{member.name}</span>
      <button
        onClick={onRemove}
        className={cn(
          "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150 ml-0.5",
          hovered ? "bg-[#DBEAFE] text-text-secondary" : "bg-border text-text-secondary"
        )}
      >
        <X size={8} />
      </button>
    </div>
  );
}

// ─── Member Picker ─────────────────────────────────────────────────────────
function MemberPicker({
  selected,
  onToggle,
}: {
  selected: string[];
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

  const filtered = AVAILABLE_MEMBERS.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMembers = AVAILABLE_MEMBERS.filter((m) => selected.includes(m.id));

  return (
    <div ref={ref} className="relative">
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedMembers.map((m) => (
            <MemberChip key={m.id} member={m} onRemove={() => onToggle(m.id)} />
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                   text-text-secondary hover:bg-[#F4F4F5] transition-colors duration-150"
      >
        <Plus size={13} />
        Add member
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-surface border border-border
                        rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.06)]
                        z-50 overflow-hidden">
          <div className="p-2 border-b border-[#F4F4F5]">
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
            {filtered.map((m) => (
              <div
                key={m.id}
                onClick={() => onToggle(m.id)}
                className="flex items-center gap-2.5 px-3 py-2 cursor-pointer
                           hover:bg-[#F4F4F5] transition-colors duration-150"
              >
                <Avatar name={m.name} initials={m.initials} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{m.name}</div>
                  <div className="text-xs text-text-disabled">{m.role}</div>
                </div>
                {selected.includes(m.id) && <Check size={14} className="text-accent shrink-0" />}
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

// ─── Section Label ─────────────────────────────────────────────────────────
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

// ─── Main Page ─────────────────────────────────────────────────────────────
function CreateProjectPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groups, setGroups] = useState([
    { id: 1, value: "Planning" },
    { id: 2, value: "Design" },
    { id: 3, value: "Development" },
  ]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [nameError, setNameError] = useState("");
  const nextId = useRef(4);

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: async (project) => {
      toast.success("Project created");
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      void navigate({ to: "/projects/$slug", params: { slug: project.slug } });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create project"),
  });

  function addGroup() {
    setGroups((prev) => [...prev, { id: nextId.current++, value: "" }]);
  }

  function updateGroup(id: number, value: string) {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, value } : g)));
  }

  function removeGroup(id: number) {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  function toggleMember(id: string) {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    if (!name.trim()) {
      setNameError("Project name is required.");
      return;
    }
    setNameError("");
    mutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      groups: groups.map((g) => g.value).filter(Boolean),
      memberIds: selectedMembers,
    });
  }

  const canSubmit = name.trim().length > 0 && !mutation.isPending;

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-8 pt-5 sm:pt-8 pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-7">
        <Link
          to="/"
          className="flex items-center gap-1 text-accent-text font-medium hover:underline"
        >
          <ArrowLeft size={14} />
          Home
        </Link>
        <span className="text-border">/</span>
        <span className="text-text-secondary font-medium">New project</span>
      </nav>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-text-primary tracking-tight">Create a new project</h1>
        <p className="text-sm text-text-secondary mt-1">Set up the basics. You can always change these later.</p>
      </div>

      <div className="flex flex-col gap-7">
        {/* Card: Project Info */}
        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-5">
          <SectionLabel icon={<FolderOpen size={15} className="text-text-disabled" />}>
            Project Info
          </SectionLabel>
          <FormInput
            label="Project name"
            placeholder="e.g. Website Redesign 2025"
            value={name}
            onChange={(v) => { setName(v); if (nameError) setNameError(""); }}
            required
            error={nameError}
            autoFocus
          />
          <FormTextarea
            label="Description"
            placeholder="A brief description of the project's goals and scope."
            value={description}
            onChange={setDescription}
            rows={3}
            hint="Visible to all members. Keep it short."
          />
        </div>

        {/* Card: Task Groups */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <SectionLabel icon={<Layers size={15} className="text-text-disabled" />}>
            Task Groups
          </SectionLabel>
          <p className="text-sm text-text-disabled mb-4 -mt-2">
            Organize tasks into groups. You can rename or add more later.
          </p>
          <div className="flex flex-col gap-2">
            {groups.map((g, i) => (
              <TaskGroupRow
                key={g.id}
                value={g.value}
                onChange={(v) => updateGroup(g.id, v)}
                onRemove={() => removeGroup(g.id)}
                placeholder={`Group ${i + 1}`}
                autoFocus={i === groups.length - 1 && g.value === ""}
                canRemove={groups.length > 1}
              />
            ))}
          </div>
          <div className="mt-3">
            <button
              onClick={addGroup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                         font-medium text-text-secondary hover:bg-[#F4F4F5] transition-colors duration-150"
            >
              <Plus size={13} />
              Add group
            </button>
          </div>
        </div>

        {/* Card: Members */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <SectionLabel icon={<Users size={15} className="text-text-disabled" />}>
            Members
          </SectionLabel>
          <p className="text-sm text-text-disabled mb-4 -mt-2">
            Add team members who will collaborate on this project.
          </p>
          <MemberPicker selected={selectedMembers} onToggle={toggleMember} />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-1">
          <Link
            to="/"
            className="px-4 py-2 rounded-lg text-sm font-semibold text-text-secondary
                       hover:bg-[#F4F4F5] transition-colors duration-150"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-semibold",
              "transition-all duration-150",
              canSubmit
                ? "bg-accent hover:bg-accent-text text-white cursor-pointer"
                : "bg-border text-text-disabled cursor-not-allowed"
            )}
          >
            {mutation.isPending ? (
              "Creating..."
            ) : (
              <>
                <Plus size={15} />
                Create project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
