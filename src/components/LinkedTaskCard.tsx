import { Link } from "@tanstack/react-router";
import { CheckCircle, Circle } from "lucide-react";
import { useCompany } from "@/context/company-context";
import type { LinkedTask } from "@/api/types";

interface Props {
  task: LinkedTask;
}

function relationLabel(relation: LinkedTask["relation"]) {
  switch (relation) {
    case "follow-up-of":
      return "↳ Follow-up of:";
    case "related-to":
      return "↳ Related to:";
    default:
      return null;
  }
}

export function LinkedTaskCard({ task }: Props) {
  const company = useCompany();
  const label = relationLabel(task.relation);

  return (
    <div>
      {label && (
        <p className="text-xs text-text-disabled font-medium mb-1">
          {label}
        </p>
      )}
      <Link
        to="/c/$companySlug/projects/$projectSlug/tasks/$taskId"
        params={{ companySlug: company.slug, projectSlug: task.project.slug, taskId: task.id }}
        className="block border-l-[3px] border-accent pl-3 py-2.5 bg-surface border border-border rounded-r-lg hover:bg-[#F4F4F5] transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          {task.isDone ? (
            <CheckCircle className="w-4 h-4 text-success shrink-0" />
          ) : (
            <Circle className="w-4 h-4 text-text-disabled shrink-0" />
          )}
          <span className="text-sm font-medium text-text-primary truncate">
            {task.title}
          </span>
        </div>
        <p className="text-xs text-text-secondary mt-0.5 pl-6">
          {task.project.name} · {task.groupTitle}
        </p>
      </Link>
    </div>
  );
}
