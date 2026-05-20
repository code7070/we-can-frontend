import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { Key, Plus, Copy, Trash2, Check, ChevronDown, Terminal } from "lucide-react";
import { tokensQueryOptions, createToken, revokeToken } from "@/api/tokens";
import { useAuth } from "@/hooks/useAuth";
import { useError } from "@/context/error-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiToken, CreatedApiToken } from "@/api/types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8787/api/v1";

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
      <p className="text-sm text-text-secondary py-6 text-center">
        No API tokens yet. Create one to access the API programmatically.
      </p>
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
    <div className="flex flex-col gap-3 py-2">
      {[1, 2].map((i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  );
}

function CodeExamples({ apiBase }: { apiBase: string }) {
  const T = "{YOUR_TOKEN}";
  const PS = "{PROJECT_SLUG}";
  const GI = "{GROUP_ID}";

  const curl = `\
<span class="text-text-secondary"># List all projects (public)</span>
curl ${apiBase}/projects

<span class="text-text-secondary"># List your API tokens (authenticated)</span>
curl -H "Authorization: Bearer <span class="text-warning">${T}</span>" \\
  ${apiBase}/api-tokens

<span class="text-text-secondary"># Create a task (authenticated)</span>
curl -X POST \\
  -H "Authorization: Bearer <span class="text-warning">${T}</span>" \\
  -H "Content-Type: application/json" \\
  -d '&#123;"title":"Implement API integration","groupId":"GROUP_ID"&#125;' \\
  ${apiBase}/projects/${PS}/groups/${GI}/tasks`;

  const js = `\
<span class="text-text-secondary">// List projects (public)</span>
const res = await fetch("${apiBase}/projects");
const projects = await res.json();

<span class="text-text-secondary">// Fetch with Bearer token</span>
const res = await fetch("${apiBase}/api-tokens", &#123;
  headers: &#123;
    "Authorization": \`Bearer <span class="text-warning">${T}</span>\`,
  &#125;,
&#125;);

<span class="text-text-secondary">// Create a task</span>
const res = await fetch("${apiBase}/projects/${PS}/groups/${GI}/tasks", &#123;
  method: "POST",
  headers: &#123;
    "Authorization": \`Bearer <span class="text-warning">${T}</span>\`,
    "Content-Type": "application/json",
  &#125;,
  body: JSON.stringify(&#123;title: "Implement API integration"&#125;),
&#125;);`;

  const py = `\
<span class="text-text-secondary"># List projects (public)</span>
import requests
res = requests.get("${apiBase}/projects")

<span class="text-text-secondary"># Fetch with Bearer token</span>
headers = &#123;"Authorization": f"Bearer <span class="text-warning">${T}</span>"&#125;
res = requests.get("${apiBase}/api-tokens", headers=headers)

<span class="text-text-secondary"># Create a task</span>
res = requests.post(
  "${apiBase}/projects/${PS}/groups/${GI}/tasks",
  headers=&#123;"Authorization": f"Bearer <span class="text-warning">${T}</span>"&#125;,
  json=&#123;"title": "Implement API integration"&#125;,
)`;

  return (
    <details className="group mb-5">
      <summary className="flex items-center gap-1.5 text-xs font-medium text-accent cursor-pointer hover:text-accent/80 transition-colors select-none">
        <Terminal size={14} />
        Implementation examples
        <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 grid gap-3">
        <CodeBlock label="curl" code={curl} />
        <CodeBlock label="JavaScript &mdash; fetch" code={js} />
        <CodeBlock label="Python &mdash; requests" code={py} />
        <p className="text-xs text-text-secondary leading-relaxed">
          Replace <code className="font-mono text-xs bg-hover px-1 py-0.5 rounded text-warning">YOUR_TOKEN</code> with the token value and adjust the URL/params for your endpoint.
          All authenticated endpoints use the same <code className="font-mono text-xs bg-hover px-1 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code> pattern.
        </p>
      </div>
    </details>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-hover/50">
        <span className="text-xs font-mono text-text-secondary font-medium">{label}</span>
      </div>
      <pre
        className="p-3 text-xs font-mono text-text-primary leading-relaxed overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: code }}
      />
    </div>
  );
}

function SettingsPage() {
  const { token } = useAuth();
  const { showError } = useError();
  const queryClient = useQueryClient();
  const [newTokenName, setNewTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<CreatedApiToken | null>(null);

  const createMutation = useMutation({
    mutationFn: (name: string) => createToken(name),
    onSuccess: (data) => {
      setCreatedToken(data);
      setNewTokenName("");
      void queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
    },
    onError: (err) => showError(err),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeToken(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
    },
    onError: (err) => showError(err),
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
    <div className="max-w-content mx-auto px-6 py-10">
      <h1 className="text-xl font-semibold text-text-primary mb-8">Settings</h1>

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
          Pass the token in the <code className="font-mono text-xs bg-hover px-1 py-0.5 rounded">Authorization</code> header.
        </p>

        <CodeExamples apiBase={API_BASE} />

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
