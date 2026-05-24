import { Link, useRouterState } from "@tanstack/react-router";

interface NavTabsProps {
  companySlug: string;
}

export function NavTabs({ companySlug }: NavTabsProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function isActive(path: string, exact: boolean) {
    const normalized = path.replace(/\/$/, "");
    if (exact) return pathname === normalized || pathname === normalized + "/";
    return (
      pathname === normalized ||
      pathname === normalized + "/" ||
      pathname.startsWith(normalized + "/")
    );
  }

  const tabs = [
    {
      to: "/c/$companySlug" as const,
      params: { companySlug },
      path: `/c/${companySlug}`,
      label: "Home",
      exact: true,
    },
    {
      to: "/c/$companySlug/tasks" as const,
      params: { companySlug },
      path: `/c/${companySlug}/tasks`,
      label: "Tasks",
      exact: false,
    },
    {
      to: "/c/$companySlug/projects" as const,
      params: { companySlug },
      path: `/c/${companySlug}/projects`,
      label: "Projects",
      exact: false,
    },
  ];

  return (
    <nav className="flex items-center gap-0.5">
      {tabs.map(({ label, to, params, path, exact }) => {
        const active = isActive(path, exact);
        return (
          <Link
            key={label}
            to={to}
            params={params}
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
