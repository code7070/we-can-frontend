import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Settings, Users, LogOut, BookOpen, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { NavTabs } from "./NavTabs";
import { MobileSearchOverlay } from "@/components/command-bar/MobileSearchOverlay";
import { companyQueryOptions } from "@/api/companies";

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
        <div className="absolute right-0 top-full z-[140] mt-2 w-44 rounded-lg border border-border bg-surface py-1 shadow-md">
          <Link
            to="/users"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-[#f4f4f5] transition-colors"
          >
            <Users size={14} className="text-text-secondary" />
            Users
          </Link>
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-[#f4f4f5] transition-colors"
          >
            <Settings size={14} className="text-text-secondary" />
            Settings
          </Link>
          <Link
            to="/documentation"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-[#f4f4f5] transition-colors"
          >
            <BookOpen size={14} className="text-text-secondary" />
            API Docs
          </Link>
          <div className="border-t border-border my-1" />
          <button
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-[#f4f4f5] transition-colors"
          >
            <LogOut size={14} className="text-text-secondary" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function PersistentHeader() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const matches = useRouterState({ select: (s) => s.matches });
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Detect company slug from active route matches
  const companyMatch = matches.find(
    (m) => "companySlug" in (m.params as Record<string, string>)
  );
  const companySlug = companyMatch
    ? (companyMatch.params as { companySlug: string }).companySlug
    : null;

  const { data: company } = useQuery({
    ...companyQueryOptions(companySlug!),
    enabled: !!companySlug,
  });

  function handleLogout() {
    logout();
    void navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-[130] border-b border-border bg-surface/95 backdrop-blur">
      <div className="max-w-content mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center gap-2 sm:gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-sm font-semibold text-text-primary hover:text-accent transition-colors shrink-0"
        >
          WeCan
        </Link>

        {/* Company name label */}
        {company && (
          <span
            className="text-sm text-text-secondary hidden sm:inline"
            title={company.slug}
          >
            {company.name}
          </span>
        )}

        {/* Nav tabs — desktop only, inside company routes only */}
        {!isAuthPage && company && (
          <>
            <div className="w-px h-4 bg-border shrink-0 hidden lg:block" />
            <div className="hidden lg:block">
              <NavTabs companySlug={company.slug} />
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Mobile search trigger — only inside a company */}
          {!isAuthPage && company && (
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="flex lg:hidden items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-text-primary hover:bg-[#F4F4F5] transition-colors"
              aria-label="Search"
            >
              <Search size={16} />
            </button>
          )}

          {/* Desktop "New" button — only inside company */}
          {isLoggedIn && !isAuthPage && company && (
            <Link
              to="/c/$companySlug/projects/new"
              params={{ companySlug: company.slug }}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-surface bg-accent hover:bg-accent-text px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus size={14} />
              New
            </Link>
          )}

          {isLoggedIn ? (
            <UserMenu onLogout={handleLogout} />
          ) : !isAuthPage ? (
            <div className="flex items-center gap-2 sm:gap-3">
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
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile search overlay */}
      {mobileSearchOpen && (
        <MobileSearchOverlay onClose={() => setMobileSearchOpen(false)} />
      )}
    </header>
  );
}
