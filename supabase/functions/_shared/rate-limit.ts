// Per-user token-bucket rate limiter for AI-heavy edge functions.
//
// Usage:
//   const limit = await enforceRateLimit(userId, "summarize-health-record");
//   if (limit) return limit; // 429 Response
//
// Buckets are continuous-refill. Defaults are conservative; override per call.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

export interface RateLimitConfig {
  /** Maximum tokens the bucket can hold (burst size). */
  capacity: number;
  /** Sustained refill rate, tokens per second. */
  refillPerSec: number;
  /** Cost of this request in tokens. Default 1. */
  cost?: number;
}

/**
 * Per-bucket defaults. AI-heavy = expensive multimodal/long generation.
 * Burst capacity allows short usage spikes; refill enforces sustained rate.
 *
 * Examples below translate to roughly:
 *   ai_heavy:   burst 5, sustained ~20/hour
 *   ai_medium:  burst 10, sustained ~60/hour
 *   ai_light:   burst 20, sustained ~300/hour
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  ai_heavy: { capacity: 5, refillPerSec: 20 / 3600 },
  ai_medium: { capacity: 10, refillPerSec: 60 / 3600 },
  ai_light: { capacity: 20, refillPerSec: 300 / 3600 },
};

/**
 * Atomically consume from the user's bucket. Returns a 429 Response if the
 * bucket is empty, or null when the request is allowed to proceed.
 *
 * On failures (DB error) we fail-open and log — better than locking everyone
 * out if the limiter table is briefly unreachable.
 */
export async function enforceRateLimit(
  userId: string,
  bucket: keyof typeof RATE_LIMITS | string,
  override?: Partial<RateLimitConfig>,
): Promise<Response | null> {
  const cfg = {
    ...(RATE_LIMITS[bucket] ?? RATE_LIMITS.ai_medium),
    ...(override ?? {}),
  };
  const cost = cfg.cost ?? 1;

  try {
    const sb = admin();
    const { data, error } = await sb.rpc("consume_rate_limit", {
      _user_id: userId,
      _bucket: bucket,
      _capacity: cfg.capacity,
      _refill_per_sec: cfg.refillPerSec,
      _cost: cost,
    });
    if (error) {
      console.error("[rate-limit] rpc error, failing open:", error.message);
      return null;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.allowed) {
      const retry = Math.max(1, Math.ceil(Number(row?.retry_after_sec ?? 60)));
      return new Response(
        JSON.stringify({
          error: "rate_limited",
          message:
            "You are sending requests too quickly. Please wait a moment and try again.",
          retry_after_sec: retry,
          bucket,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(retry),
          },
        },
      );
    }
    return null;
  } catch (e) {
    console.error("[rate-limit] unexpected, failing open:", e);
    return null;
  }
}
