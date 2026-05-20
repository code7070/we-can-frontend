import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskRow } from "./TaskRow";
import type { TaskGroup as TaskGroupType } from "@/api/types";

interface Props {
  group: TaskGroupType;
  projectSlug: string;
}

export function TaskGroup({ group, projectSlug }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [addHovered, setAddHovered] = useState(false);
  const doneCount = group.tasks.filter((t) => t.isDone).length;

  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-surface">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-4 py-2.5 hover:bg-[#F4F4F5] transition-colors duration-150 text-left group"
      >
        <ChevronDown
          className={cn(
            "w-4 h-4 text-text-secondary transition-transform duration-150",
            !isOpen && "-rotate-90"
          )}
        />
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {group.title}
        </span>
        <span className="text-xs text-text-disabled ml-auto">
          {group.tasks.length}
        </span>
      </button>

      {isOpen && (
        <>
          {group.tasks.map((task) => (
            <TaskRow key={task.id} task={task} projectSlug={projectSlug} />
          ))}

          {/* Inline add task CTA */}
          <Link
            to="/projects/$slug/tasks/new"
            params={{ slug: projectSlug }}
            search={{ group: group.title }}
            onMouseEnter={() => setAddHovered(true)}
            onMouseLeave={() => setAddHovered(false)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-150",
              "border-t border-[#F4F4F5]",
              addHovered ? "text-accent bg-[#FAFAFA]" : "text-text-disabled bg-transparent"
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
