// Shared observability helpers.
//
// - logFunctionCall: persist a row to public.function_logs for every edge function request
// - callLovableAi:   wrapper around the Lovable AI gateway that records token usage + cost to public.ai_usage_logs
//
// Both use the service-role client and NEVER block / throw inside the request path —
// observability failures must not break the user request.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = () =>
  createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

// ---- INR cost table per 1K tokens (rough; update as pricing changes).
// Lovable AI gateway pricing translated to INR (approx, 1 USD = 83 INR).
const COST_TABLE_INR_PER_1K: Record<string, { prompt: number; completion: number }> = {
  // Gemini
  "google/gemini-2.5-flash":        { prompt: 0.025,  completion: 0.10  },
  "google/gemini-2.5-flash-lite":   { prompt: 0.008,  completion: 0.03  },
  "google/gemini-2.5-pro":          { prompt: 0.10,   completion: 0.42  },
  "google/gemini-3-flash-preview":  { prompt: 0.025,  completion: 0.10  },
  "google/gemini-2.5-flash-image":  { prompt: 0.025,  completion: 0.10  },
  // OpenAI
  "openai/gpt-5":                   { prompt: 0.20,   completion: 0.80  },
  "openai/gpt-5-mini":              { prompt: 0.04,   completion: 0.16  },
  "openai/gpt-5-nano":              { prompt: 0.008,  completion: 0.03  },
};

function estimateCostInr(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const row = COST_TABLE_INR_PER_1K[model];
  if (!row) return 0;
  return (
    (promptTokens / 1000) * row.prompt +
    (completionTokens / 1000) * row.completion
  );
}

export type LogFunctionCallArgs = {
  functionName: string;
  requestId?: string;
  userId?: string | null;
  method?: string;
  statusCode: number;
  latencyMs: number;
  error?: string | null;
  metadata?: Record<string, unknown>;
};

export async function logFunctionCall(args: LogFunctionCallArgs): Promise<void> {
  try {
    await admin().from("function_logs").insert({
      request_id: args.requestId ?? null,
      function_name: args.functionName,
      user_id: args.userId ?? null,
      method: args.method ?? null,
      status_code: args.statusCode,
      latency_ms: args.latencyMs,
      error: args.error ?? null,
      metadata: args.metadata ?? {},
    });
  } catch (e) {
    console.error("[observability] logFunctionCall failed:", e);
  }
}

export type AiUsageRecord = {
  functionName: string;
  requestId?: string;
  userId?: string | null;
  provider?: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costInr?: number;
  latencyMs?: number;
  status?: string;
  error?: string | null;
};

export async function logAiUsage(rec: AiUsageRecord): Promise<void> {
  try {
    const prompt = rec.promptTokens ?? 0;
    const completion = rec.completionTokens ?? 0;
    const total = rec.totalTokens ?? (prompt + completion);
    const cost = rec.costInr ?? estimateCostInr(rec.model, prompt, completion);
    await admin().from("ai_usage_logs").insert({
      request_id: rec.requestId ?? null,
      function_name: rec.functionName,
      user_id: rec.userId ?? null,
      provider: rec.provider ?? (rec.model.split("/")[0] || null),
      model: rec.model,
      prompt_tokens: prompt,
      completion_tokens: completion,
      total_tokens: total,
      cost_inr: Number(cost.toFixed(4)),
      latency_ms: rec.latencyMs ?? null,
      status: rec.status ?? "ok",
      error: rec.error ?? null,
    });
  } catch (e) {
    console.error("[observability] logAiUsage failed:", e);
  }
}

// Generate a stable per-request id (UUID v4-ish via crypto.randomUUID).
export function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

// Drop-in wrapper around fetch() for the Lovable AI gateway.
// Records token usage + cost to ai_usage_logs.
export async function callLovableAi(opts: {
  functionName: string;
  userId?: string | null;
  requestId?: string;
  model: string;
  body: Record<string, unknown>;
}): Promise<Response> {
  const started = Date.now();
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    await logAiUsage({
      functionName: opts.functionName,
      userId: opts.userId,
      requestId: opts.requestId,
      model: opts.model,
      status: "error",
      error: "LOVABLE_API_KEY missing",
    });
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500,
    });
  }

  const payload = { model: opts.model, ...opts.body };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  // Clone so the caller can still read the body.
  const cloned = res.clone();
  const latencyMs = Date.now() - started;

  try {
    if (!res.ok) {
      const text = await cloned.text().catch(() => "");
      await logAiUsage({
        functionName: opts.functionName,
        userId: opts.userId,
        requestId: opts.requestId,
        model: opts.model,
        latencyMs,
        status: `http_${res.status}`,
        error: text.slice(0, 500),
      });
    } else {
      const json = await cloned.json().catch(() => null) as
        | { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }
        | null;
      const usage = json?.usage;
      await logAiUsage({
        functionName: opts.functionName,
        userId: opts.userId,
        requestId: opts.requestId,
        model: opts.model,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        latencyMs,
        status: "ok",
      });
    }
  } catch (e) {
    console.error("[observability] callLovableAi log failed:", e);
  }

  return res;
}
