import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MSG91_AUTH_KEY = Deno.env.get("MSG91_AUTH_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const normalizePhone = (raw: string) => {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (trimmed.startsWith("+")) return `+${digits.slice(0, 15)}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  return `+${digits.slice(0, 15)}`;
};

const randomPassword = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("") + "Aa1!";

const phoneToEmail = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return `p${digits}@phone.vyana.care`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    if (!MSG91_AUTH_KEY) return json(500, { error: "MSG91_AUTH_KEY missing" });

    const body = await req.json().catch(() => ({}));
    const accessToken: string = body?.accessToken ?? body?.["access-token"] ?? "";
    const rawPhone: string = body?.phone ?? "";
    if (!accessToken) return json(400, { error: "accessToken required" });

    // Verify access token with MSG91
    const verifyRes = await fetch(
      "https://control.msg91.com/api/v5/widget/verifyAccessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authkey: MSG91_AUTH_KEY, "access-token": accessToken }),
      },
    );
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok || verifyData?.type !== "success") {
      return json(401, { error: "msg91_verify_failed", detail: verifyData });
    }

    // MSG91 returns the verified mobile in verifyData.message (e.g. "919876543210")
    const verifiedRaw: string = verifyData?.message ?? verifyData?.data?.mobile ?? rawPhone;
    const phone = normalizePhone(verifiedRaw);
    if (!phone) return json(400, { error: "invalid_phone" });

    const email = phoneToEmail(phone);
    const password = randomPassword();

    // Look up existing user by email
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) return json(500, { error: "list_users_failed", detail: listErr.message });

    const existing = list.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase() || u.phone === phone.replace("+", ""),
    );

    if (existing) {
      const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        phone: phone.replace("+", ""),
        phone_confirm: true,
        email_confirm: true,
      });
      if (updErr) return json(500, { error: "update_user_failed", detail: updErr.message });
    } else {
      const { error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        phone: phone.replace("+", ""),
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { signup_via: "msg91", phone },
      });
      if (createErr) return json(500, { error: "create_user_failed", detail: createErr.message });
    }

    return json(200, { email, password, phone });
  } catch (e) {
    return json(500, { error: "internal_error", detail: String(e?.message ?? e) });
  }
});
