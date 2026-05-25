import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCompany } from "@/api/companies";
import { useError } from "@/context/error-context";

export const Route = createFileRoute("/company/new")({
  component: NewCompanyPage,
});

function NewCompanyPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { showError } = useError();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const company = await createCompany({ name: name.trim(), description: description.trim() || undefined });
      await qc.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company created");
      void navigate({ to: `/c/${company.slug}` });
    } catch (err) {
      showError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-[720px] px-4 py-8">
      <h1 className="text-xl font-semibold text-text-primary mb-6">
        Create a company
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-text-primary">
            Name <span className="text-danger">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Acme Corp"
            className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-disabled outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-text-primary">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this company do?"
            rows={3}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-colors resize-none"
          />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating…" : "Create company"}
          </button>
          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
