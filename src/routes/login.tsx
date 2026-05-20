import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { apiFetch } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useError } from "@/context/error-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const { showError } = useError();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await apiFetch<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      void navigate({ to: "/" });
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-text-primary mb-2 text-center">
          Sign in
        </h1>
        <p className="text-sm text-text-secondary text-center mb-8">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-accent hover:underline font-medium">
            Sign up
          </Link>
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full justify-center"
          >
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
