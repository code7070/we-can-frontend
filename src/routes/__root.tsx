import {
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorProvider } from "@/context/error-context";
import { ThemeProvider } from "@/context/theme-context";
import { ErrorDialog } from "@/components/ErrorDialog";
import { PersistentHeader } from "@/components/layout/PersistentHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Toaster } from "sonner";
import type { QueryClient } from "@tanstack/react-query";

interface RouterContext {
  queryClient: QueryClient;
}

function RootLayout() {
  return (
    <ThemeProvider>
    <ErrorProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-bg">
          <PersistentHeader />
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
    </ThemeProvider>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
