import { AlertTriangle } from "lucide-react";
import { useError } from "@/context/error-context";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button } from "@/components/ui/button";

const CODE_LABELS: Record<string, string> = {
  VALIDATION_ERROR: "Validation Error",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Not Found",
  EMAIL_EXISTS: "Email Already Registered",
  INTERNAL_ERROR: "Server Error",
  UNKNOWN_ERROR: "Error",
};

export function ErrorDialog() {
  const { error, clearError } = useError();

  return (
    <DialogPrimitive.Root
      open={!!error}
      onOpenChange={(open) => {
        if (!open) clearError();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]" />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white ring-1 ring-black/8 shadow-lg outline-none">
          <div className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-bg-soft">
                <AlertTriangle size={16} className="text-danger" />
              </div>
              <div className="min-w-0">
                <DialogPrimitive.Title className="text-sm font-semibold text-text-primary leading-snug">
                  {CODE_LABELS[error?.code ?? ""] ?? error?.code ?? "Error"}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="mt-1 text-sm text-text-secondary">
                  {error?.message}
                </DialogPrimitive.Description>
              </div>
            </div>

            {error?.fields && Object.keys(error.fields).length > 0 && (
              <ul className="mb-4 rounded-lg border border-border bg-bg px-4 py-3 space-y-1">
                {Object.entries(error.fields).map(([field, messages]) =>
                  messages.map((msg, i) => (
                    <li key={`${field}-${i}`} className="text-xs text-text-secondary">
                      <span className="font-medium text-text-primary capitalize">{field}:</span> {msg}
                    </li>
                  ))
                )}
              </ul>
            )}

            <div className="flex justify-end">
              <Button onClick={clearError} size="sm">
                Dismiss
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
