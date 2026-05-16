import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HouseholdPatient = {
  id: string;
  name: string;
  relationship: string;
  avatar_emoji: string;
  is_primary: boolean;
  date_of_birth: string | null;
  pincode: string | null;
  city: string | null;
  /** "owned" = I own this patient row. "granted" = a real user granted me access via invite. */
  access: "owned" | "granted";
};

type Ctx = {
  loading: boolean;
  patients: HouseholdPatient[];
  activePatient: HouseholdPatient | null;
  setActiveById: (id: string) => void;
  refresh: () => Promise<void>;
};

const ActivePatientContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "vyana_active_patient_id";

export function ActivePatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<HouseholdPatient[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setPatients([]);
      setLoading(false);
      return;
    }

    // a) Patients I own (self + dependents)
    const { data: owned, error: e1 } = await supabase
      .from("patients")
      .select("id, name, relationship, avatar_emoji, is_primary, date_of_birth, pincode, city")
      .eq("user_id", session.user.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    if (e1) console.error("[ActivePatient] owned load error", e1);

    // b) Patients an adult family member has granted me access to
    const { data: grants, error: e2 } = await supabase
      .from("patient_access_grants")
      .select("patient_id, permission")
      .eq("grantee_user_id", session.user.id)
      .is("revoked_at", null);
    if (e2) console.error("[ActivePatient] grants load error", e2);

    const grantedIds = (grants || []).map((g) => (g as { patient_id: string }).patient_id);
    let grantedRows: HouseholdPatient[] = [];
    if (grantedIds.length > 0) {
      const { data: granted, error: e3 } = await supabase
        .from("patients")
        .select("id, name, relationship, avatar_emoji, is_primary, date_of_birth, pincode, city")
        .in("id", grantedIds);
      if (e3) console.error("[ActivePatient] granted patients load error", e3);
      grantedRows = (granted || []).map((p) => ({ ...(p as Omit<HouseholdPatient, "access">), access: "granted" as const }));
    }

    const ownedRows: HouseholdPatient[] = (owned || []).map((p) => ({ ...(p as Omit<HouseholdPatient, "access">), access: "owned" as const }));

    // Avoid duplicates (shouldn't happen but defensive)
    const map = new Map<string, HouseholdPatient>();
    [...ownedRows, ...grantedRows].forEach((p) => map.set(p.id, p));
    const rows = Array.from(map.values());

    setPatients(rows);
    setActiveId((current) => {
      if (current && rows.some((r) => r.id === current)) return current;
      const primary = rows.find((r) => r.is_primary && r.access === "owned") ?? rows[0] ?? null;
      const nextId = primary?.id ?? null;
      if (nextId) localStorage.setItem(STORAGE_KEY, nextId);
      return nextId;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();

    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      // Debounced refresh so a burst of events triggers one reload.
      let pending: ReturnType<typeof setTimeout> | null = null;
      const scheduleReload = () => {
        if (pending) clearTimeout(pending);
        pending = setTimeout(() => { void load(); }, 250);
      };

      realtimeChannel = supabase
        .channel(`household:${uid}`)
        // New / revoked grants where I am the grantee → new shared profile shows up
        .on("postgres_changes", {
          event: "*", schema: "public", table: "patient_access_grants",
          filter: `grantee_user_id=eq.${uid}`,
        }, scheduleReload)
        // Any update to a patient row I can see (own or granted) — name, pincode, dob, etc.
        .on("postgres_changes", {
          event: "UPDATE", schema: "public", table: "patients",
        }, scheduleReload)
        // Inviter side: my outgoing invite flipped to accepted/declined/revoked
        .on("postgres_changes", {
          event: "UPDATE", schema: "public", table: "family_invites",
          filter: `inviter_user_id=eq.${uid}`,
        }, scheduleReload)
        .subscribe();
    };
    void setupRealtime();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        void load();
        void setupRealtime();
      }
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(STORAGE_KEY);
        setActiveId(null);
        setPatients([]);
        if (realtimeChannel) { void supabase.removeChannel(realtimeChannel); realtimeChannel = null; }
      }
    });
    return () => {
      subscription.unsubscribe();
      if (realtimeChannel) void supabase.removeChannel(realtimeChannel);
    };
  }, [load]);

  const setActiveById = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent("vyana:active-patient-changed", { detail: { id } }));
  }, []);

  const activePatient = useMemo(
    () => patients.find((p) => p.id === activeId) ?? null,
    [patients, activeId]
  );

  const value = useMemo<Ctx>(
    () => ({ loading, patients, activePatient, setActiveById, refresh: load }),
    [loading, patients, activePatient, setActiveById, load]
  );

  return <ActivePatientContext.Provider value={value}>{children}</ActivePatientContext.Provider>;
}

export function useActivePatient() {
  const ctx = useContext(ActivePatientContext);
  if (!ctx) throw new Error("useActivePatient must be used inside <ActivePatientProvider>");
  return ctx;
}

export function getActivePatientId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}
