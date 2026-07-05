import type { AiProviderId } from "@/lib/schemas";

/**
 * Server-only client for the supported AI providers.
 *
 * Why one function with a switch instead of N classes:
 *   - The public surface is intentionally tiny: `callChat()` returns
 *     `{ text, usage }` or throws `AiError`. We don't model streaming,
 *     tools, or multi-turn. The blog editor only needs single-shot
 *     completions that come back as structured JSON.
 *   - Each provider branch is short. Keeping them in one file makes
 *     it easy to keep headers, timeouts, and error normalisation aligned.
 *     Providers with the OpenAI-compatible chat shape share a single
 *     `openAiCompatible` factory rather than copy-pasted branches.
 *
 * Safety properties:
 *   - 30s hard timeout via `AbortController`. Anything slower is treated
 *     as a failure (the editor would hang otherwise).
 *   - Provider keys are passed in by the caller — never logged. We log
 *     only the provider name + model on failure.
 *   - On non-2xx responses we throw `AiError` with the upstream message
 *     (truncated) so the route can show it in the UI.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatUsage {
  in: number;
  out: number;
}

export interface ChatResult {
  text: string;
  usage?: ChatUsage;
}

export class AiError extends Error {
  constructor(
    message: string,
    public readonly provider: AiProviderId,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AiError";
  }
}

const TIMEOUT_MS = 30_000;

interface ProviderEndpoints {
  url: string;
  headers: (apiKey: string) => Record<string, string>;
  /** Build the request body. */
  buildBody: (model: string, messages: ChatMessage[]) => unknown;
  /** Parse the response body into `{ text, usage }`. */
  extract: (json: unknown) => ChatResult;
}

/**
 * Build a provider endpoint that speaks OpenAI's chat-completions
 * schema. Used by openai/openrouter/deepseek/poolside/minimax —
 * they all accept the same request shape and return the same
 * response shape.
 *
 * Differences between them live entirely in (a) base URL,
 * (b) optional headers (only OpenRouter requires `HTTP-Referer`),
 * and (c) `providerId` so the error message names the failing
 * provider instead of hardcoding "openai".
 */
function openAiCompatible(
  url: string,
  providerId: AiProviderId,
  extraHeaders: (apiKey: string) => Record<string, string> = () => ({}),
  extraBody: (model: string, body: Record<string, unknown>) => Record<string, unknown> = (_, body) => body,
): ProviderEndpoints {
  return {
    url,
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders(apiKey),
    }),
    buildBody: (model, messages) =>
      extraBody(model, {
        model,
        messages,
        temperature: 0.2,
      }),
    extract: (json) => {
      const j = json as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const text = j.choices?.[0]?.message?.content;
      if (!text) {
        throw new AiError(
          `${PROVIDER_LABEL[providerId]} returned no message.`,
          providerId,
        );
      }
      const usage =
        j.usage?.prompt_tokens != null && j.usage?.completion_tokens != null
          ? { in: j.usage.prompt_tokens, out: j.usage.completion_tokens }
          : undefined;
      return { text, usage };
    },
  };
}

/**
 * Human-readable provider names. Kept here (next to the client) so
 * error messages don't depend on a UI-side label map; the Settings
 * page maintains its own copy for the dropdown.
 */
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
 * MiniMax's hosted chat-completion endpoint accepts the same
 * request shape as OpenAI but returns content under
 * `choices[].message.content` and reports usage under
 * `usage.{prompt_tokens, completion_tokens}` — exactly the same
 * structure as OpenAI. Treat it as OpenAI-compatible for parsing.
 */
const ENDPOINTS: Record<AiProviderId, ProviderEndpoints> = {
  // Provider labels are surfaced in the Settings UI — see
  // `PROVIDER_LABEL` in components/admin/settings-client.tsx.
  openai: openAiCompatible(
    "https://api.openai.com/v1/chat/completions",
    "openai",
  ),

  openrouter: openAiCompatible(
    "https://openrouter.ai/api/v1/chat/completions",
    "openrouter",
    () => ({
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000",
      "X-Title": "Md Kamal Hosen — Blog Editor",
    }),
  ),

  /**
   * Poolside exposes an OpenAI-compatible chat-completions endpoint.
   * Model ids are typically `poolside-default` etc.; admins configure
   * the model in Settings.
   */
  poolside: openAiCompatible(
    "https://api.poolside.ai/v1/chat/completions",
    "poolside",
  ),

  /**
   * DeepSeek's public API is OpenAI-compatible. The two named models
   * (`deepseek-chat` = V3, `deepseek-reasoner` = R1) are listed as
   * curated defaults in `AI_DEFAULT_MODELS` in lib/schemas.ts.
   */
  deepseek: openAiCompatible(
    "https://api.deepseek.com/v1/chat/completions",
    "deepseek",
  ),

  /**
   * MiniMax's `chatcompletion_v2` endpoint is OpenAI-compatible
   * in shape; we mirror that. Default model `MiniMax-Text-01` is set
   * in `AI_DEFAULT_MODELS`.
   */
  minimax: openAiCompatible(
    "https://api.minimaxi.chat/v1/text/chatcompletion_v2",
    "minimax",
  ),

  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
    buildBody: (model, messages) => {
      // Anthropic's API takes system separately from the user/assistant turns.
      const system = messages.find((m) => m.role === "system")?.content;
      const rest = messages.filter((m) => m.role !== "system");
      return {
        model,
        system,
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: 1024,
        temperature: 0.2,
      };
    },
    extract: (json) => {
      const j = json as {
        content?: Array<{ type?: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const text = j.content
        ?.filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("")
        .trim();
      if (!text) throw new AiError("Anthropic returned no text content.", "anthropic");
      const usage =
        j.usage?.input_tokens != null && j.usage?.output_tokens != null
          ? { in: j.usage.input_tokens, out: j.usage.output_tokens }
          : undefined;
      return { text, usage };
    },
  },

  google: {
    url: "https://generativelanguage.googleapis.com/v1beta/models",
    headers: () => ({ "Content-Type": "application/json" }),
    buildBody: (model, messages) => ({
      // Gemini's generateContent takes a flat `contents` array.
      contents: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      systemInstruction: messages
        .filter((m) => m.role === "system")
        .map((m) => ({ parts: [{ text: m.content }] }))[0],
      generationConfig: { temperature: 0.2 },
    }),
    extract: (json) => {
      const j = json as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
        };
      };
      const parts = j.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p) => p.text ?? "").join("").trim();
      if (!text) throw new AiError("Gemini returned no text content.", "google");
      const usage =
        j.usageMetadata?.promptTokenCount != null &&
        j.usageMetadata?.candidatesTokenCount != null
          ? {
              in: j.usageMetadata.promptTokenCount,
              out: j.usageMetadata.candidatesTokenCount,
            }
          : undefined;
      return { text, usage };
    },
  },
};

/**
 * Resolve Google's model URL since it embeds both the model name and the
 * API key as query parameters (Gemini uses ?key= instead of a header).
 */
function googleUrl(model: string, apiKey: string): string {
  const base = ENDPOINTS.google.url;
  const params = new URLSearchParams({ key: apiKey });
  return `${base}/${encodeURIComponent(model)}:generateContent?${params.toString()}`;
}

/**
 * Send a single chat completion request. Returns the assistant's text
 * reply. Throws `AiError` on any failure (network, timeout, non-2xx,
 * or empty content).
 */
export async function callChat(
  provider: AiProviderId,
  model: string,
  apiKey: string,
  messages: ChatMessage[],
): Promise<ChatResult> {
  if (!apiKey || apiKey.length < 4) {
    throw new AiError("API key is missing.", provider);
  }
  if (!model) {
    throw new AiError("Model is not set.", provider);
  }

  const endpoints = ENDPOINTS[provider];
  const url = provider === "google" ? googleUrl(model, apiKey) : endpoints.url;
  const headers = endpoints.headers(apiKey);
  const body = endpoints.buildBody(model, messages);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    const msg =
      err instanceof Error && err.name === "AbortError"
        ? `Request to ${provider} timed out after ${TIMEOUT_MS / 1000}s.`
        : err instanceof Error
          ? `Network error talking to ${provider}: ${err.message}`
          : `Unknown error talking to ${provider}.`;
    throw new AiError(msg, provider);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    // Try to extract the upstream error message so the UI can show it.
    let detail = `${res.status} ${res.statusText}`;
    try {
      const errJson = (await res.json()) as {
        error?: { message?: string };
        message?: string;
      };
      const upstream =
        errJson.error?.message ?? errJson.message ?? null;
      if (upstream) detail = `${detail} — ${upstream}`;
    } catch {
      // body wasn't JSON; keep status text.
    }
    throw new AiError(
      `${provider} request failed: ${truncate(detail, 300)}`,
      provider,
      res.status,
    );
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new AiError(`${provider} returned non-JSON response.`, provider);
  }

  return endpoints.extract(json);
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + "…";
}
