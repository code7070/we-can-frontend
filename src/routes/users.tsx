import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { usersQueryOptions, createUser } from "@/api/users";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserRole } from "@/api/types";

export const Route = createFileRoute("/users")({
  beforeLoad: () => {
    const token = localStorage.getItem("taskflow_token");
    if (!token) throw redirect({ to: "/login" });
  },
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(usersQueryOptions),
  component: UsersPage,
});

const ROLES: { value: UserRole; label: string }[] = [
  { value: "pm", label: "Product Manager" },
  { value: "designer", label: "Designer" },
  { value: "engineer", label: "Engineer" },
  { value: "qa", label: "QA" },
];

const ROLE_LABELS: Record<string, string> = {
  pm: "PM",
  designer: "Design",
  engineer: "Eng",
  qa: "QA",
};

const ROLE_COLORS: Record<string, string> = {
  pm: "bg-accent/10 text-accent",
  designer: "bg-purple-100 text-purple-700",
  engineer: "bg-emerald-100 text-emerald-700",
  qa: "bg-amber-100 text-amber-700",
};

function UserRow({ name, email, role, createdAt }: { name: string; email?: string; role?: string; createdAt?: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-full bg-accent/10 text-accent text-xs font-semibold flex items-center justify-center shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{name}</p>
        {email && <p className="text-xs text-text-secondary">{email}</p>}
      </div>
      {role && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[role] ?? "bg-hover text-text-secondary"}`}>
          {ROLE_LABELS[role] ?? role}
        </span>
      )}
      {createdAt && (
        <p className="text-xs text-text-secondary shrink-0 hidden sm:block">
          Joined {new Date(createdAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function UsersList() {
  const { data: users } = useSuspenseQuery(usersQueryOptions);

  if (users.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-text-secondary">No users yet.</p>
      </div>
    );
  }

  return (
    <div>
      {users.map((user) => (
        <UserRow
          key={user.id}
          name={user.name}
          email={user.email}
          role={user.role}
          createdAt={user.createdAt}
        />
      ))}
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="flex flex-col py-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
          <Skeleton className="h-5 w-12 rounded-full shrink-0" />
          <Skeleton className="h-3 w-20 rounded shrink-0 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "engineer" as UserRole });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => createUser({ ...form }),
    onSuccess: () => {
      toast.success("User created");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess();
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError && err.fields) {
        setFieldErrors(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, v[0]])));
      } else {
        toast.error(err instanceof Error ? err.message : "Failed to create user");
      }
    },
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => ({ ...e, [field]: "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">New user</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Full name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Smith"
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent transition-colors"
            />
            {fieldErrors.name && <p className="text-xs text-danger">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jane@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent transition-colors"
            />
            {fieldErrors.email && <p className="text-xs text-danger">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent transition-colors"
            />
            {fieldErrors.password && <p className="text-xs text-danger">{fieldErrors.password}</p>}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Role</label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-text-primary bg-surface focus:outline-none focus:border-accent transition-colors"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 justify-center"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 justify-center"
            >
              {mutation.isPending ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsersPage() {
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  function handleSuccess() {
    setSuccessMsg("User created successfully.");
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
        <h1 className="text-lg sm:text-xl font-semibold text-text-primary">Users</h1>
        <Button onClick={() => setShowModal(true)} className="gap-1.5 shrink-0">
          <UserPlus size={14} />
          <span className="hidden sm:inline">New user</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {successMsg && (
        <div className="mb-4 rounded-lg bg-success/10 border border-success/30 px-4 py-3 text-sm text-success font-medium">
          {successMsg}
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg px-3 sm:px-5">
        <Suspense fallback={<UsersSkeleton />}>
          <UsersList />
        </Suspense>
      </div>

      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
