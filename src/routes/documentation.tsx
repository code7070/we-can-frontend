import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, Terminal, Lock, Globe, Copy, Check, Settings } from "lucide-react";
import { apiFetch } from "@/api/client";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8787/api/v1";

// ---- Types ----------------------------------------------------------------

interface OpenApiSpec {
  info: { title: string; version: string; description?: string };
  paths: Record<string, Record<string, OpenApiOperation>>;
  tags: Array<{ name: string; description?: string }>;
}

interface OpenApiOperation {
  summary: string;
  description?: string;
  operationId: string;
  tags: string[];
  security?: Array<Record<string, string[]>>;
  parameters?: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    content: Record<string, { schema: OpenApiSchema }>;
  };
  responses: Record<string, { description: string }>;
}

interface OpenApiParameter {
  name: string;
  in: "path" | "query" | "header";
  required?: boolean;
  schema: { type: string };
  description?: string;
  example?: unknown;
}

interface OpenApiSchema {
  type?: string;
  properties?: Record<string, OpenApiPropSchema>;
  required?: string[];
}

interface OpenApiPropSchema {
  type?: string;
  format?: string;
  description?: string;
  example?: unknown;
  enum?: string[];
  nullable?: boolean;
  items?: { type?: string };
}

interface EndpointEntry {
  method: string;
  path: string;
  operation: OpenApiOperation;
}

// ---- Query ----------------------------------------------------------------

const openApiQueryOptions = queryOptions({
  queryKey: ["openapi"],
  queryFn: () => apiFetch<OpenApiSpec>("/openapi.json"),
  staleTime: Infinity,
});

// ---- Helpers --------------------------------------------------------------

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

function groupPathsByTag(spec: OpenApiSpec): Record<string, EndpointEntry[]> {
  const groups: Record<string, EndpointEntry[]> = {};
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.includes(method)) continue;
      const op = operation as OpenApiOperation;
      const tag = op.tags?.[0] ?? "Other";
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push({ method, path, operation: op });
    }
  }
  return groups;
}

function shortDescription(desc: string): string {
  const idx = desc.indexOf("```");
  return (idx > -1 ? desc.slice(0, idx) : desc).trim();
}

function statusBadgeClass(status: string): string {
  if (status.startsWith("2")) return "bg-success/10 text-success";
  if (status.startsWith("4")) return "bg-warning/10 text-warning";
  if (status.startsWith("5")) return "bg-danger/10 text-danger";
  return "bg-hover text-text-secondary";
}

// ---- Sub-components -------------------------------------------------------

const METHOD_STYLES: Record<string, string> = {
  get: "bg-success/10 text-success",
  post: "bg-accent/10 text-accent",
  patch: "bg-warning/10 text-warning",
  put: "bg-warning/10 text-warning",
  delete: "bg-danger/10 text-danger",
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`inline-block text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 w-14 text-center ${METHOD_STYLES[method] ?? "bg-hover text-text-secondary"}`}
    >
      {method}
    </span>
  );
}

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

function CodeBlock({ label, code }: { label: string; code: string }) {
  const rawText = code.replace(/<[^>]+>/g, "");
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-hover/50">
        <span className="text-xs font-mono text-text-secondary font-medium">{label}</span>
        <CopyButton text={rawText} />
      </div>
      <pre
        className="p-3 text-xs font-mono text-text-primary leading-relaxed overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: code }}
      />
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

<span class="text-text-secondary"># Get your API tokens (authenticated)</span>
curl -H "Authorization: Bearer <span class="text-warning">${T}</span>" \\
  ${apiBase}/api-tokens

<span class="text-text-secondary"># Create a task (authenticated)</span>
curl -X POST \\
  -H "Authorization: Bearer <span class="text-warning">${T}</span>" \\
  -H "Content-Type: application/json" \\
  -d '&#123;"title":"Implement API integration","groupId":"${GI}"&#125;' \\
  ${apiBase}/projects/${PS}/groups/${GI}/tasks`;

  const js = `\
<span class="text-text-secondary">// List projects (public)</span>
const res = await fetch("${apiBase}/projects");
const { data: projects } = await res.json();

<span class="text-text-secondary">// Authenticated request</span>
const res = await fetch("${apiBase}/api-tokens", &#123;
  headers: &#123; "Authorization": \`Bearer <span class="text-warning">${T}</span>\` &#125;,
&#125;);

<span class="text-text-secondary">// Create a task</span>
const res = await fetch(\`${apiBase}/projects/${PS}/groups/${GI}/tasks\`, &#123;
  method: "POST",
  headers: &#123;
    "Authorization": \`Bearer <span class="text-warning">${T}</span>\`,
    "Content-Type": "application/json",
  &#125;,
  body: JSON.stringify(&#123; title: "Implement API integration" &#125;),
&#125;);`;

  const py = `\
<span class="text-text-secondary"># List projects (public)</span>
import requests
res = requests.get("${apiBase}/projects")

<span class="text-text-secondary"># Authenticated request</span>
headers = &#123;"Authorization": f"Bearer <span class="text-warning">${T}</span>"&#125;
res = requests.get("${apiBase}/api-tokens", headers=headers)

<span class="text-text-secondary"># Create a task</span>
res = requests.post(
  "${apiBase}/projects/${PS}/groups/${GI}/tasks",
  headers=&#123;"Authorization": f"Bearer <span class="text-warning">${T}</span>"&#125;,
  json=&#123;"title": "Implement API integration"&#125;,
)`;

  return (
    <details className="group">
      <summary className="flex items-center gap-1.5 text-xs font-medium text-accent cursor-pointer hover:text-accent/80 transition-colors select-none">
        <Terminal size={14} />
        Implementation examples
        <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <CodeBlock label="curl" code={curl} />
        <CodeBlock label="JavaScript — fetch" code={js} />
        <CodeBlock label="Python — requests" code={py} />
        <p className="text-xs text-text-secondary leading-relaxed">
          Replace{" "}
          <code className="font-mono text-xs bg-hover px-1 py-0.5 rounded text-warning">
            YOUR_TOKEN
          </code>{" "}
          with your token value. All authenticated endpoints use{" "}
          <code className="font-mono text-xs bg-hover px-1 py-0.5 rounded">
            Authorization: Bearer &lt;token&gt;
          </code>
          .{" "}
          <Link to="/settings" className="text-accent hover:underline">
            Create a token →
          </Link>
        </p>
      </div>
    </details>
  );
}

function RequestBodyProps({ schema }: { schema: OpenApiSchema }) {
  const props = schema.properties;
  const required = schema.required ?? [];
  if (!props || Object.keys(props).length === 0) return null;
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {Object.entries(props).map(([name, prop]) => (
        <div key={name} className="flex items-start gap-3 px-3 py-2 border-b border-border last:border-0 text-xs">
          <code className="font-mono text-text-primary w-28 shrink-0 pt-0.5">{name}</code>
          <span className="text-text-disabled bg-hover px-1.5 py-0.5 rounded shrink-0">
            {prop.type ?? "object"}
            {prop.format ? `(${prop.format})` : ""}
          </span>
          <span className="text-text-secondary flex-1">
            {prop.description ??
              (prop.example !== undefined ? `e.g. ${JSON.stringify(prop.example)}` : "—")}
            {prop.enum && (
              <span className="text-text-disabled ml-1">
                ({prop.enum.join(" | ")})
              </span>
            )}
          </span>
          {required.includes(name) && (
            <span className="text-danger shrink-0 pt-0.5">required</span>
          )}
        </div>
      ))}
    </div>
  );
}

function EndpointCard({ method, path, operation }: EndpointEntry) {
  const [expanded, setExpanded] = useState(false);
  const isAuth = !!operation.security?.length;
  const desc = operation.description ? shortDescription(operation.description) : null;

  const requestSchema =
    operation.requestBody?.content?.["application/json"]?.schema ??
    operation.requestBody?.content?.["multipart/form-data"]?.schema;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-hover transition-colors text-left"
      >
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-text-primary flex-1 min-w-0 truncate">{path}</code>
        <span className="text-xs text-text-secondary hidden sm:block shrink-0 max-w-[200px] truncate">
          {operation.summary}
        </span>
        {isAuth ? (
          <Lock
            size={12}
            className="text-text-disabled shrink-0"
            aria-label="Auth required"
          />
        ) : (
          <Globe
            size={12}
            className="text-text-disabled shrink-0"
            aria-label="Public"
          />
        )}
        <ChevronDown
          size={14}
          className={`text-text-secondary shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-primary">{operation.summary}</span>
            {isAuth ? (
              <span className="inline-flex items-center gap-1 text-xs text-text-secondary bg-hover px-2 py-0.5 rounded">
                <Lock size={10} /> Auth required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-text-secondary bg-hover px-2 py-0.5 rounded">
                <Globe size={10} /> Public
              </span>
            )}
          </div>

          {desc && (
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{desc}</p>
          )}

          {operation.parameters && operation.parameters.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Parameters
              </h4>
              <div className="border border-border rounded-lg overflow-hidden">
                {operation.parameters.map((param) => (
                  <div
                    key={param.name}
                    className="flex items-start gap-3 px-3 py-2 border-b border-border last:border-0 text-xs"
                  >
                    <code className="font-mono text-text-primary w-28 shrink-0 pt-0.5">{param.name}</code>
                    <span className="text-text-disabled bg-hover px-1.5 py-0.5 rounded shrink-0">
                      {param.in}
                    </span>
                    <span className="text-text-secondary flex-1">{param.description ?? "—"}</span>
                    {param.required && (
                      <span className="text-danger shrink-0 pt-0.5">required</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {requestSchema && (
            <div>
              <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Request Body
              </h4>
              <RequestBodyProps schema={requestSchema} />
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
              Responses
            </h4>
            <div className="border border-border rounded-lg overflow-hidden">
              {Object.entries(operation.responses).map(([status, response]) => (
                <div
                  key={status}
                  className="flex items-center gap-3 px-3 py-2 border-b border-border last:border-0"
                >
                  <code
                    className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 ${statusBadgeClass(status)}`}
                  >
                    {status}
                  </code>
                  <span className="text-xs text-text-secondary">{response.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48 rounded-md" />
      <Skeleton className="h-16 w-full rounded-lg" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24 rounded" />
          {[1, 2, 3].map((j) => (
            <Skeleton key={j} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ---- Page -----------------------------------------------------------------

function DocumentationPage() {
  const { data: spec, isLoading, isError } = useQuery(openApiQueryOptions);

  return (
    <div className="max-w-content mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-text-primary mb-1">API Documentation</h1>
          {spec && (
            <p className="text-sm text-text-secondary">
              {spec.info.title} — v{spec.info.version}
            </p>
          )}
        </div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <Settings size={13} />
          Manage tokens
        </Link>
      </div>

      {isLoading && <DocsSkeleton />}

      {isError && (
        <div className="text-sm text-text-secondary py-12 text-center">
          Failed to load API spec. Make sure the backend is running.
        </div>
      )}

      {spec && (
        <>
          {/* Base URL */}
          <section className="mb-8">
            <div className="bg-surface border border-border rounded-lg px-4 py-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-text-secondary">Base URL</span>
                <code className="text-xs font-mono text-text-primary bg-hover px-2 py-0.5 rounded">
                  {API_BASE}
                </code>
              </div>
              <p className="text-xs text-text-secondary">
                Pass{" "}
                <code className="font-mono bg-hover px-1 py-0.5 rounded">
                  Authorization: Bearer &lt;token&gt;
                </code>{" "}
                for authenticated endpoints — JWT from login or API token with prefix{" "}
                <code className="font-mono bg-hover px-1 py-0.5 rounded text-warning">wct_</code>.
              </p>
            </div>
          </section>

          {/* Implementation examples */}
          <section className="mb-8 bg-surface border border-border rounded-lg px-4 py-3">
            <CodeExamples apiBase={API_BASE} />
          </section>

          {/* Endpoints by tag */}
          {spec.tags.map((tag) => {
            const grouped = groupPathsByTag(spec);
            const endpoints = grouped[tag.name];
            if (!endpoints || endpoints.length === 0) return null;
            return (
              <section key={tag.name} className="mb-8">
                <div className="mb-3">
                  <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    {tag.name}
                  </h2>
                  {tag.description && (
                    <p className="text-xs text-text-secondary mt-0.5">{tag.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {endpoints.map(({ method, path, operation }) => (
                    <EndpointCard
                      key={`${method}:${path}`}
                      method={method}
                      path={path}
                      operation={operation}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/documentation")({
  component: DocumentationPage,
});
