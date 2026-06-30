// Shared AI response cache helper.
// Stores AI outputs keyed by (function_name, sha256(canonical_input)) in the
// public.ai_cache table. Backed by service_role so end-users never touch it.
//
// Use:
//   const key = await aiCacheKey({ fileContent, fileType, category, ... });
//   const cached = await aiCacheGet("summarize-health-record", key);
//   if (cached) return cached;
//   ... call AI ...
//   await aiCachePut("summarize-health-record", key, result);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const adminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

/** Canonicalize an object (stable key order) then sha256-hex it. */
export async function aiCacheKey(input: unknown): Promise<string> {
  const canonical = stableStringify(input);
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") +
    "}"
  );
}

/** Return the cached response payload or null on miss / error. Never throws. */
export async function aiCacheGet<T = unknown>(
  functionName: string,
  cacheKey: string,
): Promise<T | null> {
  try {
    const client = adminClient();
    const { data, error } = await client
      .from("ai_cache")
      .select("response, expires_at")
      .eq("function_name", functionName)
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (error || !data) return null;
    if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

    // Fire-and-forget hit counter.
    client
      .from("ai_cache")
      .update({ hits: undefined as never, last_hit_at: new Date().toISOString() })
      .eq("function_name", functionName)
      .eq("cache_key", cacheKey)
      .then(() => {});
    // Increment via rpc-less update: do a separate select+update if you need
    // strict counts. We keep it cheap here.
    return data.response as T;
  } catch (e) {
    console.warn("[ai-cache] get failed", e);
    return null;
  }
}

/** Store a response. Never throws. */
export async function aiCachePut(
  functionName: string,
  cacheKey: string,
  response: unknown,
  ttlDays = 30,
): Promise<void> {
  try {
    const client = adminClient();
    const expires = new Date(Date.now() + ttlDays * 86400 * 1000).toISOString();
    await client.from("ai_cache").upsert(
      {
        function_name: functionName,
        cache_key: cacheKey,
        response,
        expires_at: expires,
      },
      { onConflict: "function_name,cache_key" },
    );
  } catch (e) {
    console.warn("[ai-cache] put failed", e);
  }
}
