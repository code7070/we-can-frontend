import {
  createRootRouteWithContext,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorProvider } from "@/context/error-context";
import { ErrorDialog } from "@/components/ErrorDialog";
import { PersistentHeader } from "@/components/layout/PersistentHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { CommandBar } from "@/components/command-bar/CommandBar";
import { Toaster } from "sonner";
import type { QueryClient } from "@tanstack/react-query";

interface RouterContext {
  queryClient: QueryClient;
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <ErrorProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-bg">
          <PersistentHeader />
          {!isAuthPage && (
            <div className="relative z-[90] isolate bg-surface/0 backdrop-blur">
              <div className="max-w-content mx-auto px-4 sm:px-6 py-3 grid grid-cols-2 items-center gap-4">
                <div className="min-w-0 flex-1">
                  <Breadcrumb />
                </div>
                <CommandBar className="hidden w-full lg:block flex-none relative z-[110]" />
              </div>
            </div>
          )}
          <main className="pb-16 lg:pb-0">
            <Outlet />
          </main>
          <BottomNav />
        </div>
        <ErrorDialog />
        <Toaster position="bottom-right" richColors />
        <TanStackRouterDevtools />
      </TooltipProvider>
    </ErrorProvider>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
