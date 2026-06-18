import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PlanId } from "@/lib/plans";

export interface Entitlements {
  authenticated: boolean;
  plan: PlanId;
  status: "active" | "past_due" | "canceled" | "expired";
  is_pro: boolean;
  current_period_end: string | null;
  briefings_used: number;
  briefings_limit: number | null;
  briefings_remaining: number | null;
  docs_used: number;
  docs_limit: number | null;
  docs_remaining: number | null;
  family_used: number;
  family_limit: number;
  family_remaining: number;
}

const DEFAULT: Entitlements = {
  authenticated: false,
  plan: "free",
  status: "active",
  is_pro: false,
  current_period_end: null,
  briefings_used: 0,
  briefings_limit: 1,
  briefings_remaining: 1,
  docs_used: 0,
  docs_limit: 5,
  docs_remaining: 5,
  family_used: 0,
  family_limit: 2,
  family_remaining: 2,
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Singleton store
 * ────────────────────────────────────────────────────────────────────────────
 * Previously every component that called useEntitlements() fired its OWN
 * RPC, auth listener, and realtime channel. On the home screen that meant
 * 8+ identical /rest/v1/rpc/get_entitlements calls per render. Now we hold
 * a single shared snapshot, dedupe in-flight fetches, and fan out updates
 * to every subscribed hook instance.
 * ────────────────────────────────────────────────────────────────────────── */

let snapshot: Entitlements = DEFAULT;
let loading = true;
let listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;
let initialized = false;
const STALE_MS = 30_000;
let lastFetchedAt = 0;

function notify() {
  listeners.forEach((l) => l());
}

function setSnapshot(next: Entitlements) {
  snapshot = next;
  notify();
}

function setLoading(v: boolean) {
  if (loading !== v) {
    loading = v;
    notify();
  }
}

async function fetchOnce(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.rpc("get_entitlements");
      if (error) throw error;
      if (res) setSnapshot({ ...DEFAULT, ...(res as any) });
      lastFetchedAt = Date.now();
    } catch (e) {
      console.warn("[useEntitlements] failed", e);
    } finally {
      setLoading(false);
      inFlight = null;
    }
  })();
  return inFlight;
}

function refreshShared(force = false) {
  if (!force && Date.now() - lastFetchedAt < STALE_MS && !loading) return Promise.resolve();
  return fetchOnce();
}

function initOnce() {
  if (initialized) return;
  initialized = true;

  void fetchOnce();

  supabase.auth.onAuthStateChange(() => { void fetchOnce(); });

  if (typeof window !== "undefined") {
    window.addEventListener("vyana:entitlements:refresh", () => { void fetchOnce(); });
    window.addEventListener("focus", () => { void refreshShared(); });
  }

  // Single realtime subscription, attached when we know the user.
  supabase.auth.getUser().then(({ data }) => {
    const uid = data.user?.id;
    if (!uid) return;
    supabase
      .channel(`entitlements:${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${uid}` },
        () => { void fetchOnce(); },
      )
      .subscribe();
  });
}

export function useEntitlements() {
  initOnce();
  const [, force] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const listener = () => {
      if (mountedRef.current) force((n) => n + 1);
    };
    listeners.add(listener);
    return () => {
      mountedRef.current = false;
      listeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(() => refreshShared(true), []);
  return { ...snapshot, loading, refresh };
}
