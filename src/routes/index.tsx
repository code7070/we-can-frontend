import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { Plus } from "lucide-react";
import { projectsQueryOptions } from "@/api/projects";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import { ProjectPill } from "@/components/ProjectPill";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(projectsQueryOptions),
  component: HomePage,
});

function NewProjectButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <Link to="/projects/new">
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                   transition-all duration-150 border"
        style={{
          background: hovered ? "#2563EB" : "#FFF",
          borderStyle: "dashed",
          borderColor: hovered ? "#2563EB" : "#D4D4D8",
          color: hovered ? "#FFF" : "#71717A",
        }}
      >
        <Plus size={14} color={hovered ? "#FFF" : "#A1A1AA"} />
        New project
      </button>
    </Link>
  );
}

function ProjectPills() {
  const { data: projects } = useSuspenseQuery(projectsQueryOptions);

  return (
    <div className="flex flex-wrap gap-2 justify-center items-center max-w-[560px]">
      {projects.map((project) => (
        <ProjectPill key={project.id} project={project} />
      ))}
      <NewProjectButton />
    </div>
  );
}

function ProjectPillsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-full" />
      ))}
    </div>
  );
}

function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-8">
      <div className="text-center">
        <h1 className="text-display font-bold text-text-primary mb-2">
          WeCan
        </h1>
        <p className="text-base text-text-secondary">
          Async work tracker for cross-functional teams
        </p>
      </div>
      <GlobalSearchBar variant="hero" autoFocus />
      <Suspense fallback={<ProjectPillsSkeleton />}>
        <ProjectPills />
      </Suspense>
    </div>
  );
}
