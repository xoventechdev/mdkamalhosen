"use client";

import { useState, useTransition } from "react";
import {
  Loader2,
  RefreshCw,
  Mail,
  Zap,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { revalidateAll, saveAiSettings, testAiSettings } from "@/server/actions";
import {
  AI_PROVIDER_IDS,
  AI_DEFAULT_MODELS,
  type AiProviderId,
} from "@/lib/schemas";

export interface AiSettingsView {
  provider: AiProviderId;
  model: string;
  keyMask: string;
  enabled: boolean;
  configured: true;
}

export interface SettingsClientProps {
  revalidateSecretMasked: string;
  smtpConfigured: boolean;
  aiSettings: AiSettingsView | null;
}

const PROVIDER_LABEL: Record<AiProviderId, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google Gemini",
  openrouter: "OpenRouter",
  poolside: "Poolside",
  minimax: "MiniMax",
  deepseek: "DeepSeek",
};

/**
 * Per-provider hint shown under the API key field. Points the user at
 * the dashboard that mints a key for the selected provider. Keep
 * entries short — this slot is a single line.
 */
const PROVIDER_KEY_HINT: Record<AiProviderId, string> = {
  openai: "platform.openai.com → API keys",
  anthropic: "console.anthropic.com → Settings → API Keys",
  google: "aistudio.google.com → API keys",
  openrouter: "openrouter.ai → Keys",
  poolside: "poolside.ai → Dashboard → API keys",
  minimax: "platform.minimaxi.com → API Keys",
  deepseek: "platform.deepseek.com → API Keys",
};

export function SettingsClient({
  revalidateSecretMasked,
  smtpConfigured,
  aiSettings,
}: SettingsClientProps) {
  const [pending, startTransition] = useTransition();
  const [aiPending, startAiTransition] = useTransition();

  // Local form state. Initial values come from the (server-loaded)
  // masked settings — the API key is never in this state on first
  // paint; the user has to explicitly enter a new key.
  const [provider, setProvider] = useState<AiProviderId>(
    aiSettings?.provider ?? "openai",
  );
  const [model, setModel] = useState<string>(aiSettings?.model ?? "");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [enabled, setEnabled] = useState<boolean>(aiSettings?.enabled ?? true);
  // Local copy of the saved-state so the form shows the updated mask
  // after a save without a full reload.
  const [savedView, setSavedView] = useState<AiSettingsView | null>(aiSettings);
  const [editingKey, setEditingKey] = useState(!aiSettings);
  const [error, setError] = useState<string | null>(null);

  function revalidateEverything() {
    startTransition(async () => {
      const res = await revalidateAll();
      if (res.ok) toast.success("All caches revalidated.");
      else toast.error(res.error);
    });
  }

  async function revalidateHome() {
    startTransition(async () => {
      const res = await fetch(`/api/revalidate?secret=${encodeURIComponent(process.env.NEXT_PUBLIC_REVALIDATE_FALLBACK ?? "")}&path=/`);
      if (!res.ok) {
        const res2 = await revalidateAll();
        if (res2.ok) toast.success("All caches revalidated.");
        else toast.error(res2.error);
      } else {
        toast.success("Home revalidated.");
      }
    });
  }

  async function smokeTestSmtp() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/smtp-test", { method: "POST" });
        const data = await res.json();
        if (res.ok && data.ok) toast.success("SMTP transport verified.");
        else toast.error(data.error ?? "SMTP failed.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "SMTP test failed.");
      }
    });
  }

  function saveAi() {
    setError(null);
    startAiTransition(async () => {
      const res = await saveAiSettings({ provider, model, apiKey, enabled });
      if (res.ok) {
        setSavedView({
          provider,
          model,
          keyMask: res.data.keyMask,
          enabled,
          configured: true,
        });
        setApiKey("");
        setEditingKey(false);
        toast.success("AI settings saved.");
      } else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  }

  function testAi() {
    setError(null);
    startAiTransition(async () => {
      const res = await testAiSettings();
      if (res.ok) toast.success("AI connection verified.");
      else toast.error(res.error);
    });
  }

  // When the provider changes, snap the model to the first default
  // for that provider (unless the user already has a custom value that
  // matches the new provider — that case is rare, snap anyway).
  function onProviderChange(next: AiProviderId) {
    setProvider(next);
    const defaults = AI_DEFAULT_MODELS[next];
    if (defaults.length > 0 && !defaults.includes(model)) {
      setModel(defaults[0] ?? model);
    }
  }

  const isConfigured = Boolean(savedView?.configured);
  const isEnabled = enabled && isConfigured;
  const modelOptions = AI_DEFAULT_MODELS[provider];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cache and integration controls. Sensitive values are read from environment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" /> Revalidation
          </CardTitle>
          <CardDescription>
            Flush cached server-rendered pages. Useful if you change content directly in Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={revalidateEverything} disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            <RefreshCw className="h-4 w-4" /> Revalidate everything
          </Button>
          <Button variant="secondary" onClick={revalidateHome} disabled={pending}>
            Revalidate home only
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> SMTP
          </CardTitle>
          <CardDescription>
            Used by the contact form to forward submissions to your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            Status:{" "}
            {smtpConfigured ? (
              <span className="font-medium text-emerald-600">Configured</span>
            ) : (
              <span className="text-muted-foreground">
                Not configured — submissions still land in the inbox.
              </span>
            )}
          </p>
          <Button
            variant="secondary"
            onClick={smokeTestSmtp}
            disabled={pending || !smtpConfigured}
          >
            SMTP smoke test
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> AI review
          </CardTitle>
          <CardDescription>
            Powers the AI review, title/excerpt, and SEO meta suggestions in
            the blog editor. The API key is encrypted at rest with
            <code className="mx-1 text-xs">ADMIN_SESSION_SECRET</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status line */}
          <p className="flex items-center gap-2 text-sm">
            <span
              className={
                isEnabled
                  ? "h-2 w-2 rounded-full bg-emerald-500"
                  : savedView?.configured
                    ? "h-2 w-2 rounded-full bg-amber-500"
                    : "h-2 w-2 rounded-full bg-muted-foreground/50"
              }
              aria-hidden="true"
            />
            <span>
              Status:{" "}
              {isEnabled ? (
                <span className="font-medium text-emerald-600">
                  Enabled and configured
                </span>
              ) : savedView?.configured ? (
                <span className="font-medium text-amber-600">
                  Configured but disabled
                </span>
              ) : (
                <span className="text-muted-foreground">Not configured</span>
              )}
            </span>
          </p>

          {/* Provider + Model */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider" htmlFor="ai-provider">
              <Select
                id="ai-provider"
                value={provider}
                onChange={(e) => onProviderChange(e.target.value as AiProviderId)}
              >
                {AI_PROVIDER_IDS.map((p) => (
                  <option key={p} value={p}>
                    {PROVIDER_LABEL[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Model"
              htmlFor="ai-model"
              hint={
                modelOptions.length > 0
                  ? `Common: ${modelOptions.slice(0, 3).join(", ")}`
                  : undefined
              }
            >
              <Input
                id="ai-model"
                list="ai-model-list"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={modelOptions[0] ?? "model-id"}
              />
              <datalist id="ai-model-list">
                {modelOptions.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>
          </div>

          {/* API Key */}
          <Field
            label="API key"
            htmlFor="ai-key"
            hint={
              isConfigured && !editingKey
                ? `Currently stored: ${savedView?.keyMask}`
                : `Get one at ${PROVIDER_KEY_HINT[provider]}. Encrypted with AES-256-GCM before being stored; never sent back to the browser after save.`
            }
          >
            {isConfigured && !editingKey ? (
              <div className="flex gap-2">
                <Input
                  id="ai-key"
                  value={savedView?.keyMask ?? ""}
                  readOnly
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditingKey(true)}
                >
                  Update key
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="ai-key"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste API key"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </Field>

          {/* Enabled toggle */}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
            />
            Enable AI review in the blog editor
          </label>

          {error && <FieldError message={error} />}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={saveAi}
              disabled={aiPending || !apiKey || !model || !provider}
            >
              {aiPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save AI settings
            </Button>
            <Button
              variant="secondary"
              onClick={testAi}
              disabled={aiPending || !isConfigured}
            >
              Test connection
            </Button>
            {isConfigured && editingKey && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingKey(false);
                  setApiKey("");
                }}
                disabled={aiPending}
              >
                Cancel
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Tip: OpenRouter gives you access to most major models through one
            API key. Rate-limited to 10 requests / minute in the editor.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revalidate secret</CardTitle>
          <CardDescription>
            Set via <code className="text-xs">REVALIDATE_SECRET</code> env var. Required for the
            public revalidate endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block rounded-md border border-border bg-muted/30 p-3 text-sm">
            {revalidateSecretMasked || "(not set)"}
          </code>
        </CardContent>
      </Card>
    </div>
  );
}