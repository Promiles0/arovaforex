import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { streamId, limit = 80 } = await req.json().catch(() => ({}));

    const query = supabase
      .from("live_chat_messages")
      .select("message, created_at, user_id, profiles:profiles!inner(full_name, telegram_handle)")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(Number(limit) || 80, 10), 200));

    if (streamId) query.eq("stream_id", streamId);

    const { data: rows, error } = await query;
    if (error) throw error;

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ summary: "No recent chat activity to recap yet. Stick around — discussion usually picks up around session opens." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transcript = rows
      .reverse()
      .map((r: any) => {
        const name = r.profiles?.telegram_handle ? `@${r.profiles.telegram_handle}` : (r.profiles?.full_name || "Trader");
        return `${name}: ${r.message}`;
      })
      .join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You summarise live trading-room chat for a late joiner. Output strict markdown:
**Vibe:** one short line.
**Key topics:**
- 3 to 5 bullet points (instruments mentioned, calls discussed, questions raised, debates).
**Notable:** one sentence about anything standout (a trade idea, a heated take, an admin announcement). If nothing notable, omit.
Be neutral, concise, no fluff. Never invent. Don't quote handles unless central to a topic.`,
          },
          { role: "user", content: `Recap this chat:\n\n${transcript}` },
        ],
        stream: false,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Too many recap requests. Try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const data = await aiResp.json();
    const summary = data?.choices?.[0]?.message?.content ?? "Couldn't generate a recap.";

    return new Response(JSON.stringify({ summary, messageCount: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("live-chat-recap error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
