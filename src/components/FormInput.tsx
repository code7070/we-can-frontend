import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  autoFocus?: boolean;
}

export function FormInput({ label, placeholder, value, onChange, required, error, hint, autoFocus }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium text-text-label">{label}</label>
          {required && <span className="text-danger text-xs">*</span>}
        </div>
      )}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        className={cn(
          "w-full h-11 px-4 rounded-lg bg-surface text-base text-text-primary",
          "border-[1.5px] outline-none transition-all duration-150 font-sans",
          error
            ? "border-danger [box-shadow:0_0_0_3px_rgba(220,38,38,0.12)]"
            : focused
              ? "border-accent [box-shadow:0_0_0_3px_var(--tf-focus-ring)]"
              : "border-border"
        )}
      />
      {error && (
        <div className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
      {hint && !error && (
        <span className="text-xs text-text-disabled">{hint}</span>
      )}
    </div>
  );
}
