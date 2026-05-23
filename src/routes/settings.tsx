import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { Key, Plus, Copy, Trash2, Check, BookOpen } from "lucide-react";
import { tokensQueryOptions, createToken, revokeToken } from "@/api/tokens";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiToken, CreatedApiToken } from "@/api/types";

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    const token = localStorage.getItem("taskflow_token");
    if (!token) throw redirect({ to: "/login" });
  },
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(tokensQueryOptions),
  component: SettingsPage,
});

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-hover transition-colors"
    >
      {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
    </button>
  );
}

function NewTokenBanner({ token, onDismiss }: { token: CreatedApiToken; onDismiss: () => void }) {
  return (
    <div className="rounded-lg border border-success/30 bg-success/5 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text-primary">Token created — copy it now</p>
          <p className="text-xs text-text-secondary mt-0.5">
            This is the only time the full token will be shown.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs text-text-secondary hover:text-text-primary transition-colors shrink-0"
        >
          Dismiss
        </button>
      </div>
      <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-3 py-2">
        <code className="text-xs text-text-primary font-mono flex-1 break-all">{token.token}</code>
        <CopyButton text={token.token} />
      </div>
    </div>
  );
}

function TokenRow({ token, onRevoke }: { token: ApiToken; onRevoke: (id: string) => void }) {
  const isRevoked = !!token.revokedAt;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <Key size={16} className={isRevoked ? "text-text-disabled" : "text-text-secondary"} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isRevoked ? "text-text-disabled line-through" : "text-text-primary"}`}>
          {token.name}
        </p>
        <p className="text-xs text-text-secondary font-mono mt-0.5">
          {token.prefix}…
          {token.lastUsedAt && (
            <span className="font-sans ml-2">
              · Last used {new Date(token.lastUsedAt).toLocaleDateString()}
            </span>
          )}
          {isRevoked && (
            <span className="font-sans ml-2 text-danger">Revoked</span>
          )}
        </p>
      </div>
      <p className="text-xs text-text-secondary shrink-0">
        {new Date(token.createdAt).toLocaleDateString()}
      </p>
      {!isRevoked && (
        <button
          onClick={() => onRevoke(token.id)}
          title="Revoke token"
          className="p-1.5 rounded text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

function TokensList({ onRevoke }: { onRevoke: (id: string) => void }) {
  const { data: tokens } = useSuspenseQuery(tokensQueryOptions);

  if (tokens.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-text-secondary">No API tokens yet.</p>
        <p className="text-xs text-text-disabled mt-1">Create one above to access the API programmatically.</p>
      </div>
    );
  }

  return (
    <div>
      {tokens.map((token) => (
        <TokenRow key={token.id} token={token} onRevoke={onRevoke} />
      ))}
    </div>
  );
}

function TokensSkeleton() {
  return (
    <div className="flex flex-col py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
          <Skeleton className="w-4 h-4 rounded shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-52 rounded" />
          </div>
          <Skeleton className="h-3 w-16 rounded shrink-0" />
          <Skeleton className="w-6 h-6 rounded shrink-0" />
        </div>
      ))}
    </div>
  );
}


function SettingsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [newTokenName, setNewTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<CreatedApiToken | null>(null);

  const createMutation = useMutation({
    mutationFn: (name: string) => createToken(name),
    onSuccess: (data) => {
      toast.success("API token created");
      setCreatedToken(data);
      setNewTokenName("");
      void queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create token"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeToken(id),
    onSuccess: () => {
      toast.success("Token revoked");
      void queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to revoke token"),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    createMutation.mutate(newTokenName.trim());
  }

  function handleRevoke(id: string) {
    if (!confirm("Revoke this token? Apps using it will stop working.")) return;
    revokeMutation.mutate(id);
  }

  // Decode user info from JWT
  let userEmail = "";
  let userRole = "";
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userEmail = payload.email ?? "";
      userRole = payload.role ?? "";
    }
  } catch {}

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <h1 className="text-lg sm:text-xl font-semibold text-text-primary mb-6 sm:mb-8">Settings</h1>

      {/* Profile section */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
          Account
        </h2>
        <div className="bg-surface border border-border rounded-lg p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Email</span>
            <span className="text-sm text-text-primary font-medium">{userEmail || "—"}</span>
          </div>
          <div className="border-t border-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Role</span>
            <span className="text-sm text-text-primary capitalize">{userRole || "—"}</span>
          </div>
        </div>
      </section>

      {/* API Tokens section */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
          API Tokens
        </h2>
        <p className="text-sm text-text-secondary mb-3">
          Tokens allow external tools and scripts to call the WeCan API on your behalf.
          Pass the token in the{" "}
          <code className="font-mono text-xs bg-hover px-1 py-0.5 rounded">Authorization</code>{" "}
          header.
        </p>

        <Link
          to="/documentation"
          className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors mb-5"
        >
          <BookOpen size={13} />
          View API documentation &amp; examples
        </Link>

        {/* New token banner */}
        {createdToken && (
          <div className="mb-4">
            <NewTokenBanner token={createdToken} onDismiss={() => setCreatedToken(null)} />
          </div>
        )}

        {/* Create form */}
        <form onSubmit={handleCreate} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Token name (e.g. CI Pipeline)"
            value={newTokenName}
            onChange={(e) => setNewTokenName(e.target.value)}
            maxLength={80}
            className="flex-1 px-3 py-2 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent transition-colors"
          />
          <Button
            type="submit"
            disabled={!newTokenName.trim() || createMutation.isPending}
            className="shrink-0 gap-1.5"
          >
            <Plus size={14} />
            {createMutation.isPending ? "Creating…" : "Create token"}
          </Button>
        </form>

        {/* Tokens list */}
        <div className="bg-surface border border-border rounded-lg px-5">
          <Suspense fallback={<TokensSkeleton />}>
            <TokensList onRevoke={handleRevoke} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
