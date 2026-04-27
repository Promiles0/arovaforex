import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Arova Brief — a concise forex/CFD news desk writer.
Given a calendar event, write a 2-3 sentence brief explaining:
1. What the event is in one short sentence.
2. Which currency pairs/instruments it typically impacts and why.
3. One "watch for" tip — typical volatility pattern or what traders look at.

Tone: professional, neutral, no hype. No emojis. No buy/sell advice. Plain text, no markdown headings. Max 90 words.`;

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

    const { eventId, force } = await req.json();
    if (!eventId) {
      return new Response(JSON.stringify({ error: "eventId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache first
    if (!force) {
      const { data: cached } = await supabaseAdmin
        .from("event_ai_briefs")
        .select("brief, generated_at, model")
        .eq("event_id", eventId)
        .maybeSingle();
      if (cached?.brief) {
        return new Response(JSON.stringify({ brief: cached.brief, cached: true, generated_at: cached.generated_at }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch event
    const { data: event, error: evErr } = await supabaseAdmin
      .from("calendar_events")
      .select("title, description, category, impact, currency_pairs, event_date, event_time, timezone")
      .eq("id", eventId)
      .maybeSingle();
    if (evErr || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Event:\n- Title: ${event.title}\n- Category: ${event.category}\n- Impact: ${event.impact}\n- Date: ${event.event_date}${event.event_time ? " " + event.event_time : ""} ${event.timezone || "GMT"}\n- Pairs: ${event.currency_pairs?.join(", ") || "n/a"}\n- Description: ${event.description || "n/a"}\n\nWrite the 2-3 sentence brief now.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
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
    const brief = json.choices?.[0]?.message?.content?.trim();
    if (!brief) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabaseAdmin
      .from("event_ai_briefs")
      .upsert({ event_id: eventId, brief, model: "google/gemini-3-flash-preview", generated_at: new Date().toISOString() });

    return new Response(JSON.stringify({ brief, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-event-brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
