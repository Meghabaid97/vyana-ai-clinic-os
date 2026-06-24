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
const MSG91_TEMPLATE_ID = Deno.env.get("MSG91_TEMPLATE_ID") ?? "";
const MSG91_SENDER = Deno.env.get("MSG91_SENDER") ?? "";

const normalizeMobile = (raw: string) => {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  return digits.slice(0, 15);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  try {
    if (!MSG91_AUTH_KEY) return json(500, { error: "MSG91_AUTH_KEY missing" });
    if (!MSG91_TEMPLATE_ID) return json(500, { error: "MSG91_TEMPLATE_ID missing" });

    const body = await req.json().catch(() => ({}));
    const mobile = normalizeMobile(body?.phone ?? "");
    if (!mobile || mobile.length < 11) return json(400, { error: "invalid_phone" });

    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("template_id", MSG91_TEMPLATE_ID);
    url.searchParams.set("mobile", mobile);
    url.searchParams.set("authkey", MSG91_AUTH_KEY);
    url.searchParams.set("otp_length", "6");
    url.searchParams.set("otp_expiry", "10");
    if (MSG91_SENDER) url.searchParams.set("sender", MSG91_SENDER);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: MSG91_AUTH_KEY },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.type === "error") {
      return json(502, { error: "msg91_send_failed", detail: data });
    }
    return json(200, { ok: true, mobile });
  } catch (e) {
    return json(500, { error: "internal_error", detail: String((e as Error)?.message ?? e) });
  }
});
