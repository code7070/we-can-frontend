import { createRootRouteWithContext, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import { useAuth } from "@/hooks/useAuth";
import { ErrorProvider } from "@/context/error-context";
import { ErrorDialog } from "@/components/ErrorDialog";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Settings, Users, LogOut } from "lucide-react";
import type { QueryClient } from "@tanstack/react-query";

interface RouterContext {
  queryClient: QueryClient;
}

function UserMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        Account
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-surface border border-border rounded-lg shadow-md z-50 py-1">
          <Link
            to="/users"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-hover transition-colors"
          >
            <Users size={14} className="text-text-secondary" />
            Users
          </Link>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-hover transition-colors"
          >
            <Settings size={14} className="text-text-secondary" />
            Settings
          </Link>
          <div className="border-t border-border my-1" />
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-hover transition-colors"
          >
            <LogOut size={14} className="text-text-secondary" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function RootLayout() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function handleLogout() {
    logout();
    void navigate({ to: "/" });
  }

  // Hide header search where it would be redundant or out of place
  const hideHeaderSearch =
    pathname === "/" || pathname === "/search" || pathname === "/login" || pathname === "/register";

  return (
    <ErrorProvider>
    <TooltipProvider>
      <div className="min-h-screen bg-bg">
        <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
          <div className="max-w-content mx-auto px-6 h-14 flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-semibold text-text-primary hover:text-accent transition-colors shrink-0"
            >
              WeCan
            </Link>
            <div className="flex-1 flex justify-center">
              {!hideHeaderSearch && (
                <div className="hidden sm:block w-full max-w-[360px]">
                  <GlobalSearchBar variant="compact" />
                </div>
              )}
            </div>
            <nav className="flex items-center gap-4 shrink-0">
              {isLoggedIn ? (
                <UserMenu onLogout={handleLogout} />
              ) : (
                <>
                  <Link
                    to="/register"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Sign up
                  </Link>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-accent hover:text-accent-text transition-colors"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      <ErrorDialog />
      <TanStackRouterDevtools />
    </TooltipProvider>
    </ErrorProvider>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
