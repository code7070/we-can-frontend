import { cn } from "@/lib/utils";

export type TaskFilter =
  | "all"
  | "my"
  | "unassigned"
  | "no-project"
  | "closed-120d";

const ALL_FILTERS: { id: TaskFilter; label: string; requiresAuth: boolean }[] = [
  { id: "all", label: "All", requiresAuth: false },
  { id: "my", label: "My Tasks", requiresAuth: true },
  { id: "unassigned", label: "Unassigned", requiresAuth: false },
  { id: "no-project", label: "No Project", requiresAuth: false },
  { id: "closed-120d", label: "Closed (120d)", requiresAuth: false },
];

interface Props {
  value: TaskFilter;
  onChange: (f: TaskFilter) => void;
  isLoggedIn: boolean;
}

export function TaskFilters({ value, onChange, isLoggedIn }: Props) {
  const filters = ALL_FILTERS.filter((f) => !f.requiresAuth || isLoggedIn);

  return (
    <div className="flex items-center gap-0.5">
      {filters.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150",
            value === id
              ? "bg-accent/10 text-accent"
              : "text-text-secondary hover:text-text-primary hover:bg-hover"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
