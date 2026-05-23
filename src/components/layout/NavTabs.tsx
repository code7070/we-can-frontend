import { Link, useRouterState } from "@tanstack/react-router";

const TABS = [
  { label: "Home", to: "/" as const, exact: true },
  { label: "Tasks", to: "/tasks" as const, exact: false },
  { label: "Projects", to: "/projects" as const, exact: false },
] as const;

export function NavTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function isActive(to: string, exact: boolean) {
    const normalized = to.replace(/\/$/, "");
    if (exact) return pathname === normalized || pathname === normalized + "/";
    return pathname === normalized || pathname === normalized + "/" || pathname.startsWith(normalized + "/");
  }

  return (
    <nav className="flex items-center gap-0.5">
      {TABS.map(({ label, to, exact }) => {
        const active = isActive(to, exact);
        return (
          <Link
            key={to}
            to={to}
            className={[
              "relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              active
                ? "text-accent"
                : "text-text-secondary hover:text-text-primary hover:bg-[#f4f4f5]",
            ].join(" ")}
          >
            {label}
            {active && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-accent" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
