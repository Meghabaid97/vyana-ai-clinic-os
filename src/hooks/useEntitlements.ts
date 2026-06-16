import { useCallback, useEffect, useState } from "react";
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

export function useEntitlements() {
  const [data, setData] = useState<Entitlements>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.rpc("get_entitlements");
      if (error) throw error;
      if (res) setData({ ...DEFAULT, ...(res as any) });
    } catch (e) {
      console.warn("[useEntitlements] failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => { void refresh(); });

    // Cross-component sync: any code can trigger a refetch by dispatching this event.
    const onRefresh = () => { void refresh(); };
    const onFocus = () => { void refresh(); };
    if (typeof window !== "undefined") {
      window.addEventListener("vyana:entitlements:refresh", onRefresh);
      window.addEventListener("focus", onFocus);
    }

    // Realtime: when the user's subscription row changes (activation, expiry, cancel),
    // every mounted hook instance refreshes — so the Pro badge updates everywhere instantly.
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      channel = supabase
        .channel(`entitlements:${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${uid}` },
          () => { void refresh(); },
        )
        .subscribe();
    });

    return () => {
      sub.subscription.unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("vyana:entitlements:refresh", onRefresh);
        window.removeEventListener("focus", onFocus);
      }
      if (channel) supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { ...data, loading, refresh };
}
