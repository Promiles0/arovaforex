import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Arova News Desk — a senior forex/CFD market analyst.
Given today's economic calendar events and recent platform forecasts, produce a concise, actionable market digest.
Tone: professional, neutral, no hype. No emojis. No buy/sell calls. Focus on what moves price and why.

You MUST call the publish_digest tool exactly once with structured fields.`;

const TOOL = {
  type: "function",
  function: {
    name: "publish_digest",
    description: "Publish today's market news digest.",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "2-4 sentence overview of today's market-moving themes."
        },
        highlights: {
          type: "array",
          description: "3-6 key market-moving events or themes for today.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              detail: { type: "string", description: "1-2 sentence explanation of why it matters." },
              impact: { type: "string", enum: ["high", "medium", "low"] },
              time: { type: "string", description: "Time/timing context if known, else empty." },
            },
            required: ["title", "detail", "impact"],
            additionalProperties: false,
          },
        },
        currency_impacts: {
          type: "array",
          description: "Per-currency impact breakdown for major currencies likely affected today.",
          items: {
            type: "object",
            properties: {
              currency: { type: "string", description: "ISO code, e.g. USD, EUR, GBP, JPY, XAU." },
              bias: { type: "string", enum: ["bullish", "bearish", "neutral", "volatile"] },
              note: { type: "string", description: "1-2 sentence rationale linking to today's events." },
              pairs: { type: "array", items: { type: "string" }, description: "Relevant pairs to watch." },
            },
            required: ["currency", "bias", "note", "pairs"],
            additionalProperties: false,
          },
        },
      },
      required: ["summary", "highlights", "currency_impacts"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { force } = await req.json().catch(() => ({ force: false }));
    const today = new Date().toISOString().slice(0, 10);

    // Cache hit
    if (!force) {
      const { data: cached } = await supabaseAdmin
        .from("news_digests")
        .select("*")
        .eq("digest_date", today)
        .maybeSingle();
      if (cached) {
        return new Response(JSON.stringify({ digest: cached, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Only admins can force regenerate
    if (force) {
      const { data: roleRow } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) {
        return new Response(JSON.stringify({ error: "Only admins can regenerate the digest." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Gather context: today's + next 2 days events
    const inTwoDays = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const { data: events } = await supabaseAdmin
      .from("calendar_events")
      .select("title, description, category, impact, currency_pairs, event_date, event_time, timezone")
      .gte("event_date", today)
      .lte("event_date", inTwoDays)
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true })
      .limit(40);

    const { data: forecasts } = await supabaseAdmin
      .from("forecasts")
      .select("title, currency_pair, bias, analysis, created_at")
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(8);

    const eventLines = (events ?? []).map((e) =>
      `- [${e.impact}] ${e.event_date}${e.event_time ? " " + e.event_time : ""} ${e.timezone || ""} — ${e.title} (${(e.currency_pairs || []).join(",") || "n/a"})${e.description ? " :: " + e.description.slice(0, 140) : ""}`
    ).join("\n");

    const forecastLines = (forecasts ?? []).map((f) =>
      `- ${f.currency_pair} ${f.bias?.toUpperCase() || ""} — ${f.title}`
    ).join("\n");

    const userPrompt = `Today: ${today}

Upcoming economic events (next 2 days):
${eventLines || "(none)"}

Recent platform forecasts:
${forecastLines || "(none)"}

Generate the digest now via the publish_digest tool. Focus on what's most actionable for FX/metals traders today.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "publish_digest" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const json = await aiResp.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured digest" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let parsed: { summary: string; highlights: unknown[]; currency_impacts: unknown[] };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Detect whether this is a brand-new digest for today (insert) vs a regenerate (update)
    const { data: existing } = await supabaseAdmin
      .from("news_digests")
      .select("id")
      .eq("digest_date", today)
      .maybeSingle();
    const isNewDigest = !existing;

    const { data: upserted, error: upsertErr } = await supabaseAdmin
      .from("news_digests")
      .upsert({
        digest_date: today,
        summary: parsed.summary,
        highlights: parsed.highlights ?? [],
        currency_impacts: parsed.currency_impacts ?? [],
        event_count: events?.length ?? 0,
        model: "google/gemini-3-flash-preview",
        updated_at: new Date().toISOString(),
      }, { onConflict: "digest_date" })
      .select()
      .maybeSingle();

    if (upsertErr) {
      console.error("upsert error", upsertErr);
      return new Response(JSON.stringify({ error: "Failed to save digest" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Broadcast a notification only on first generation of the day
    if (isNewDigest) {
      try {
        await supabaseAdmin.rpc("broadcast_notification", {
          p_type: "system",
          p_content: `🗞️ Today's AI News Digest is ready — ${events?.length ?? 0} events analyzed`,
          p_link: "/dashboard/news",
        });
      } catch (notifyErr) {
        console.error("notification broadcast failed", notifyErr);
      }
    }

    return new Response(JSON.stringify({ digest: upserted, cached: false, notified: isNewDigest }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-news-digest error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
