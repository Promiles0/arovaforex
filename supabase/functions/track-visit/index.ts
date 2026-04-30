import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const isUuid = (s: unknown) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const detectDevice = (ua: string): string => {
  const u = ua.toLowerCase();
  if (/ipad|tablet/.test(u)) return "tablet";
  if (/mobi|android|iphone/.test(u)) return "mobile";
  return "desktop";
};

const detectBrowser = (ua: string): string => {
  const u = ua.toLowerCase();
  if (u.includes("edg/")) return "Edge";
  if (u.includes("opr/") || u.includes("opera")) return "Opera";
  if (u.includes("chrome/") && !u.includes("chromium")) return "Chrome";
  if (u.includes("firefox/")) return "Firefox";
  if (u.includes("safari/") && !u.includes("chrome")) return "Safari";
  return "Other";
};

const getIp = (req: Request): string | null => {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip");
};

const enrichGeo = async (ip: string | null) => {
  if (!ip || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { country: null, city: null };
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(2500),
      headers: { "User-Agent": "ArovaForex-VisitorTracker/1.0" },
    });
    if (!res.ok) return { country: null, city: null };
    const data = await res.json();
    return { country: data.country_name ?? null, city: data.city ?? null };
  } catch {
    return { country: null, city: null };
  }
};

const clamp = (s: unknown, n: number) =>
  typeof s === "string" ? s.slice(0, n) : null;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      sessionId, path, fullUrl, referrer, userAgent, userId,
      eventType, elementTag, elementText, elementHref, durationMs,
    } = body;

    if (!isUuid(sessionId) || typeof path !== "string" || path.length > 500) {
      return new Response(JSON.stringify({ error: "Invalid fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validTypes = ["pageview", "click", "pageleave"];
    const evt = validTypes.includes(eventType) ? eventType : "pageview";

    const ip = getIp(req);
    const ua = typeof userAgent === "string" ? userAgent.slice(0, 500) : "";

    // Only enrich geo on pageviews (avoid hammering ipapi for clicks)
    const { country, city } = evt === "pageview"
      ? await enrichGeo(ip)
      : { country: null, city: null };

    const dur = typeof durationMs === "number" && durationMs >= 0 && durationMs < 6 * 60 * 60 * 1000
      ? Math.round(durationMs)
      : null;

    const { error } = await supabase.from("visitor_events").insert({
      session_id: sessionId,
      user_id: isUuid(userId) ? userId : null,
      path: path.slice(0, 500),
      full_url: clamp(fullUrl, 1000),
      referrer: clamp(referrer, 1000),
      user_agent: ua,
      ip_address: ip,
      country,
      city,
      device_type: detectDevice(ua),
      browser: detectBrowser(ua),
      event_type: evt,
      element_tag: clamp(elementTag, 20),
      element_text: clamp(elementText, 200),
      element_href: clamp(elementHref, 500),
      duration_ms: dur,
    });

    if (error) {
      console.error("[track-visit] insert failed:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[track-visit] error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
