import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSearch: (q: string) => void;
  defaultValue?: string;
}

export function SearchBar({ onSearch, defaultValue = "" }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      onSearch(value);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    // Debounced live search after 2+ chars
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (e.target.value.length > 1) {
      debounceRef.current = setTimeout(() => {
        onSearch(e.target.value);
      }, 300);
    }
  }

  return (
    <div className="relative w-full max-w-search">
      <Search
        className={cn(
          "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 transition-colors duration-150",
          focused ? "text-accent" : "text-text-disabled"
        )}
      />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search tasks, projects, threads…"
        className={cn(
          "w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 rounded-xl border-[1.5px]",
          "text-sm sm:text-base text-text-primary placeholder:text-text-disabled bg-surface",
          "outline-none transition-all duration-150",
          focused
            ? "border-accent shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
            : "border-border shadow-none"
        )}
      />
    </div>
  );
}
