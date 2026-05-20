import { createContext, useContext, useState, useCallback } from "react";
import type { ApiError } from "@/lib/api-error";

interface ErrorState {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
}

interface ErrorContextValue {
  error: ErrorState | null;
  showError: (err: unknown) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<ErrorState | null>(null);

  const showError = useCallback((err: unknown) => {
    if (err && typeof err === "object" && "code" in err) {
      const apiErr = err as ApiError;
      setError({ code: apiErr.code, message: apiErr.message, fields: apiErr.fields });
    } else if (err instanceof Error) {
      setError({ code: "UNKNOWN_ERROR", message: err.message });
    } else {
      setError({ code: "UNKNOWN_ERROR", message: "An unexpected error occurred" });
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <ErrorContext.Provider value={{ error, showError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error("useError must be used inside ErrorProvider");
  return ctx;
}
