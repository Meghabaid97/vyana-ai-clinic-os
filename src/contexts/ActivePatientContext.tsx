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
    const ownedReq = supabase
      .from("patients")
      .select("id, name, relationship, avatar_emoji, is_primary, date_of_birth, pincode, city")
      .eq("user_id", session.user.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    // b) Patients an adult family member has granted me access to
    const grantedReq = supabase
      .from("patient_access_grants")
      .select("patient_id, permission, patients!inner(id, name, relationship, avatar_emoji, is_primary, date_of_birth, pincode, city)")
      .eq("grantee_user_id", session.user.id)
      .is("revoked_at", null);

    const [{ data: owned, error: e1 }, { data: granted, error: e2 }] = await Promise.all([ownedReq, grantedReq]);
    if (e1) console.error("[ActivePatient] owned load error", e1);
    if (e2) console.error("[ActivePatient] granted load error", e2);

    const ownedRows: HouseholdPatient[] = (owned || []).map((p) => ({ ...(p as Omit<HouseholdPatient, "access">), access: "owned" }));
    const grantedRows: HouseholdPatient[] = (granted || [])
      .map((g) => {
        const p = (g as { patients: Omit<HouseholdPatient, "access"> }).patients;
        return p ? { ...p, access: "granted" as const } : null;
      })
      .filter(Boolean) as HouseholdPatient[];

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void load();
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(STORAGE_KEY);
        setActiveId(null);
        setPatients([]);
      }
    });
    return () => subscription.unsubscribe();
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
