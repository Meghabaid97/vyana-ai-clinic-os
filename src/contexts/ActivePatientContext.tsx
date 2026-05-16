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
    const { data, error } = await supabase
      .from("patients")
      .select("id, name, relationship, avatar_emoji, is_primary, date_of_birth, pincode, city")
      .eq("user_id", session.user.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[ActivePatient] load error", error);
      setLoading(false);
      return;
    }
    const rows = (data || []) as HouseholdPatient[];
    setPatients(rows);
    setActiveId((current) => {
      if (current && rows.some((r) => r.id === current)) return current;
      const primary = rows.find((r) => r.is_primary) ?? rows[0] ?? null;
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
    // Notify any legacy screens listening via storage event
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

/** Read the active patient id outside React (legacy screens). */
export function getActivePatientId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}
