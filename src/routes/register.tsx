import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { registerUser } from "@/api/users";
import { useAuth } from "@/hooks/useAuth";
import { useError } from "@/context/error-context";
import { ApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/api/types";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const ROLES: { value: UserRole; label: string; sub: string }[] = [
  { value: "pm", label: "Product Manager", sub: "PM" },
  { value: "designer", label: "Designer", sub: "Design" },
  { value: "engineer", label: "Engineer", sub: "Dev" },
  { value: "qa", label: "QA", sub: "QA" },
];

function FieldError({ message }: { message: string }) {
  return <p className="text-xs text-danger mt-1">{message}</p>;
}

function RegisterPage() {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { showError } = useError();
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required";
    else if (name.trim().length > 80) e.name = "Name must be 80 characters or less";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (!role) e.role = "Please select a role";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const { token } = await registerUser({ name: name.trim(), email: email.trim(), password, role: role! });
      setToken(token);
      void navigate({ to: "/" });
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_EXISTS") {
        setErrors({ email: "This email is already registered" });
      } else {
        showError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-text-primary mb-2 text-center">
          Create your account
        </h1>
        <p className="text-sm text-text-secondary text-center mb-8">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Full name</label>
            <input
              type="text"
              autoFocus
              autoComplete="name"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
              placeholder="Ada Lovelace"
              className={cn(
                "w-full px-3 py-2.5 rounded-lg border text-sm text-text-primary",
                "placeholder:text-text-disabled focus:outline-none transition-colors",
                errors.name
                  ? "border-danger focus:border-danger"
                  : "border-border focus:border-accent"
              )}
            />
            {errors.name && <FieldError message={errors.name} />}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
              placeholder="you@example.com"
              className={cn(
                "w-full px-3 py-2.5 rounded-lg border text-sm text-text-primary",
                "placeholder:text-text-disabled focus:outline-none transition-colors",
                errors.email
                  ? "border-danger focus:border-danger"
                  : "border-border focus:border-accent"
              )}
            />
            {errors.email && <FieldError message={errors.email} />}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                placeholder="Min. 8 characters"
                className={cn(
                  "w-full px-3 py-2.5 pr-10 rounded-lg border text-sm text-text-primary",
                  "placeholder:text-text-disabled focus:outline-none transition-colors",
                  errors.password
                    ? "border-danger focus:border-danger"
                    : "border-border focus:border-accent"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <FieldError message={errors.password} />}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(({ value, label, sub }) => {
                const selected = role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setRole(value); setErrors((p) => ({ ...p, role: undefined })); }}
                    className={cn(
                      "flex flex-col items-start px-3 py-2.5 rounded-lg border text-left",
                      "transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      selected
                        ? "border-accent bg-accent-subtle text-accent"
                        : "border-border bg-surface text-text-primary hover:bg-hover"
                    )}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider leading-none mb-0.5 opacity-60">
                      {sub}
                    </span>
                    <span className="text-sm font-medium leading-snug">{label}</span>
                  </button>
                );
              })}
            </div>
            {errors.role && <FieldError message={errors.role} />}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full justify-center mt-1">
            {isLoading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
