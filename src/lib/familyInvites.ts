import { supabase } from "@/integrations/supabase/client";

export type FamilyInviteRow = {
  id: string;
  invitee_name: string;
  invitee_email: string | null;
  invitee_phone: string | null;
  relationship: string;
  avatar_emoji: string;
  token: string;
  permission: "view" | "manage";
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  message: string | null;
  created_at: string;
  expires_at: string;
};

export type InvitePreview = {
  invitee_name: string;
  relationship: string;
  avatar_emoji: string;
  permission: "view" | "manage";
  status: FamilyInviteRow["status"];
  expires_at: string;
  message: string | null;
  inviter_name: string;
  invitee_email: string | null;
};

export type ActiveGrant = {
  id: string;
  patient_id: string;
  grantee_user_id: string;
  permission: "view" | "manage";
  created_at: string;
};

export function inviteLink(token: string): string {
  // Use a relative origin so it works in dev, prod, and native (we then deep-link via universal links).
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/app/accept-invite/${token}`;
}

export async function createFamilyInvite(input: {
  invitee_name: string;
  invitee_email?: string | null;
  invitee_phone?: string | null;
  relationship: string;
  avatar_emoji?: string;
  message?: string | null;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("not_authenticated");

  const { data, error } = await supabase
    .from("family_invites")
    .insert({
      inviter_user_id: session.user.id,
      invitee_name: input.invitee_name.trim(),
      invitee_email: input.invitee_email?.trim().toLowerCase() || null,
      invitee_phone: input.invitee_phone?.trim() || null,
      relationship: input.relationship,
      avatar_emoji: input.avatar_emoji || "👤",
      message: input.message?.trim() || null,
      permission: "manage",
    })
    .select("id, token, expires_at")
    .single();
  if (error) throw error;
  return data as { id: string; token: string; expires_at: string };
}

export async function listMySentInvites(): Promise<FamilyInviteRow[]> {
  const { data, error } = await supabase
    .from("family_invites")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as FamilyInviteRow[];
}

export async function listInvitesForMe(): Promise<FamilyInviteRow[]> {
  // RLS lets the invitee see invites addressed to their email
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const email = session.user.email?.toLowerCase();
  if (!email) return [];
  const { data, error } = await supabase
    .from("family_invites")
    .select("*")
    .eq("status", "pending")
    .eq("invitee_email", email)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as FamilyInviteRow[];
}

export async function revokeInvite(invite_id: string) {
  const { error } = await supabase
    .from("family_invites")
    .update({ status: "revoked" })
    .eq("id", invite_id);
  if (error) throw error;
}

export async function fetchInviteByToken(token: string): Promise<InvitePreview | null> {
  const { data, error } = await supabase.rpc("get_family_invite_by_token", { _token: token });
  if (error) throw error;
  const rows = (data as InvitePreview[] | null) || [];
  return rows[0] || null;
}

export async function acceptInvite(token: string): Promise<string> {
  const { data, error } = await supabase.rpc("accept_family_invite", { _token: token });
  if (error) throw error;
  return data as string;
}

export async function declineInvite(token: string): Promise<void> {
  const { error } = await supabase.rpc("decline_family_invite", { _token: token });
  if (error) throw error;
}

export async function listGrantsOnMyProfiles(): Promise<Array<ActiveGrant & { patient_name: string }>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  // First, my owned patient ids
  const { data: mine } = await supabase
    .from("patients")
    .select("id, name")
    .eq("user_id", session.user.id);
  const ids = (mine || []).map((p) => p.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("patient_access_grants")
    .select("id, patient_id, grantee_user_id, permission, created_at")
    .in("patient_id", ids)
    .is("revoked_at", null);
  if (error) throw error;
  const nameMap = new Map((mine || []).map((p) => [p.id, p.name]));
  return (data || []).map((g) => ({
    ...(g as ActiveGrant),
    patient_name: nameMap.get((g as ActiveGrant).patient_id) || "Profile",
  }));
}

export async function revokeGrant(grant_id: string) {
  const { error } = await supabase
    .from("patient_access_grants")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", grant_id);
  if (error) throw error;
}
