import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ListChecks, FolderKanban, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { label: "Home", to: "/" as const, exact: true, icon: Home },
  { label: "Tasks", to: "/tasks" as const, exact: false, icon: ListChecks },
  { label: "Projects", to: "/projects" as const, exact: false, icon: FolderKanban },
  { label: "Search", to: "/search" as const, exact: false, icon: Search },
  { label: "Account", to: "/login" as const, exact: true, icon: User, authOnly: false },
] as const;

function isActive(pathname: string, to: string, exact: boolean): boolean {
  const normalized = to.replace(/\/$/, "");
  if (pathname.startsWith("/search") && to === "/search") return true;
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
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Hide on auth pages and on desktop
  if (isAuthPage) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map(({ label, to, exact, icon: Icon }) => {
          // Account → link to settings when logged in, /login when not
          const actualTo = label === "Account" && isLoggedIn ? "/settings" : to;
          const active = isActive(pathname, actualTo, exact);

          return (
            <Link
              key={label}
              to={actualTo}
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
