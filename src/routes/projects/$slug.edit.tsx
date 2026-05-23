import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { projectQueryOptions, updateProject } from "@/api/projects";
import { useError } from "@/context/error-context";
import { FormInput } from "@/components/FormInput";
import { FormTextarea } from "@/components/FormTextarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/$slug/edit")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(projectQueryOptions(params.slug)),
  component: EditProjectPage,
});

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

// ─── Edit Form (needs project data) ───────────────────────────────────────
function EditProjectForm() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showError } = useError();
  const { data: project } = useSuspenseQuery(projectQueryOptions(slug));

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [nameError, setNameError] = useState("");

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof updateProject>[1]) => updateProject(slug, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["project", slug] });
      void navigate({ to: "/projects/$slug", params: { slug } });
    },
    onError: showError,
  });

  function handleSubmit() {
    if (!name.trim()) {
      setNameError("Project name is required.");
      return;
    }
    setNameError("");
    mutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  }

  const canSubmit = name.trim().length > 0 && !mutation.isPending;

  return (
    <div className="max-w-[720px] mx-auto px-8 pt-8 pb-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-7">
        <Link
          to="/projects/$slug"
          params={{ slug }}
          className="flex items-center gap-1 text-accent-text font-medium hover:underline"
        >
          <ArrowLeft size={14} />
          {project.name}
        </Link>
        <span className="text-border">/</span>
        <span className="text-text-secondary font-medium">Edit project</span>
      </nav>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-text-primary tracking-tight">Edit project</h1>
        <p className="text-sm text-text-secondary mt-1">Update project details.</p>
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

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-1">
          <Link
            to="/projects/$slug"
            params={{ slug }}
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
            {mutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page wrapper with Suspense ────────────────────────────────────────────
function EditProjectPage() {
  return (
    <Suspense fallback={null}>
      <EditProjectForm />
    </Suspense>
  );
}
