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

const normalizeMobile = (raw: string) => {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  return digits.slice(0, 15);
};

const randomPassword = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("") + "Aa1!";

const phoneToEmail = (mobile: string) => `p${mobile}@phone.vyana.care`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    if (!MSG91_AUTH_KEY) return json(500, { error: "MSG91_AUTH_KEY missing" });

    const body = await req.json().catch(() => ({}));
    const mobile = normalizeMobile(body?.phone ?? "");
    const otp = String(body?.otp ?? "").trim();
    if (!mobile || mobile.length < 11) return json(400, { error: "invalid_phone" });
    if (!/^\d{4,8}$/.test(otp)) return json(400, { error: "invalid_otp" });

    // Verify OTP with MSG91
    const url = new URL("https://control.msg91.com/api/v5/otp/verify");
    url.searchParams.set("mobile", mobile);
    url.searchParams.set("otp", otp);

    const verifyRes = await fetch(url.toString(), {
      method: "GET",
      headers: { authkey: MSG91_AUTH_KEY, "Content-Type": "application/json" },
    });
    const verifyData = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok || verifyData?.type !== "success") {
      return json(401, { error: "msg91_verify_failed", detail: verifyData });
    }

    const email = phoneToEmail(mobile);
    const password = randomPassword();

    // Find existing
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) return json(500, { error: "list_users_failed", detail: listErr.message });

    const existing = list.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase() || u.phone === mobile,
    );

    if (existing) {
      const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
        password,
        phone: mobile,
        phone_confirm: true,
        email_confirm: true,
      });
      if (updErr) return json(500, { error: "update_user_failed", detail: updErr.message });
    } else {
      const { error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        phone: mobile,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { signup_via: "msg91", phone: `+${mobile}` },
      });
      if (createErr) return json(500, { error: "create_user_failed", detail: createErr.message });
    }

    return json(200, { email, password, phone: `+${mobile}` });
  } catch (e) {
    return json(500, { error: "internal_error", detail: String((e as Error)?.message ?? e) });
  }
});
