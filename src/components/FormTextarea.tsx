import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
}

export function FormTextarea({ label, placeholder, value, onChange, rows = 3, hint }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-text-label">{label}</label>
          <span className="text-xs text-text-disabled font-normal">Optional</span>
        </div>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={rows}
        className={cn(
          "w-full px-4 py-3 rounded-lg bg-surface text-base text-text-primary leading-relaxed",
          "border-[1.5px] outline-none transition-all duration-150 font-sans resize-y",
          focused
            ? "border-accent [box-shadow:0_0_0_3px_var(--tf-focus-ring)]"
            : "border-border"
        )}
      />
      {hint && <span className="text-xs text-text-disabled">{hint}</span>}
    </div>
  );
}
