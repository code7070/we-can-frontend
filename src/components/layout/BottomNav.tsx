import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ListChecks, FolderKanban, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyOptional } from "@/context/company-context";

function isActive(pathname: string, to: string, exact: boolean): boolean {
  const normalized = to.replace(/\/$/, "");
  if (exact) return pathname === normalized || pathname === normalized + "/";
  return (
    pathname === normalized ||
    pathname === normalized + "/" ||
    pathname.startsWith(normalized + "/")
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isLoggedIn } = useAuth();
  const company = useCompanyOptional();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) return null;

  const navItems = company
    ? [
        { label: "Home", to: `/c/${company.slug}/`, exact: true, icon: Home },
        { label: "Tasks", to: `/c/${company.slug}/tasks/`, exact: false, icon: ListChecks },
        { label: "Projects", to: `/c/${company.slug}/projects/`, exact: false, icon: FolderKanban },
        { label: "Account", to: isLoggedIn ? "/settings" : "/login", exact: true, icon: User },
      ]
    : [
        { label: "Home", to: "/", exact: true, icon: Home },
        { label: "Account", to: isLoggedIn ? "/settings" : "/login", exact: true, icon: User },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {navItems.map(({ label, to, exact, icon: Icon }) => {
          const active = isActive(pathname, to, exact);

          return (
            <Link
              key={label}
              to={to as "/"}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 w-14 h-11 rounded-lg transition-colors duration-150",
                active
                  ? "text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5]"
              )}
            >
              <Icon
                size={18}
                strokeWidth={active ? 2.5 : 1.5}
                className="transition-all duration-150"
              />
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {active && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
