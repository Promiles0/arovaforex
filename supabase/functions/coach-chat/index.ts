import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COACH_SYSTEM_PROMPT = `You are Arova Coach — a personal trading mentor inside the Arova Forex platform.

Your role:
- Act as a thoughtful, experienced trading coach and accountability partner.
- Help the user reflect on their trading psychology, journal patterns, risk management, and strategy.
- Ask probing questions when useful — don't just give answers. Encourage self-discovery.
- When the user shares stats from their journal context, refer to them by number ("Your win rate on EURUSD is 42%...").
- Be honest, kind, and encouraging. Celebrate wins, gently challenge poor habits.
- NEVER give specific buy/sell recommendations or financial advice. You coach process, not predictions.

Formatting:
- Use **bold** for emphasis and bullet points for lists.
- Keep paragraphs short (2–3 sentences). Use markdown headings sparingly.
- Sign off occasionally with motivating short phrases — never robotic.`;

async function getJournalContext(supabase: ReturnType<typeof createClient>, userId: string): Promise<string> {
  try {
    const { data: entries } = await supabase
      .from("journal_entries")
      .select("instrument, direction, outcome, pnl, risk_reward_ratio, entry_date, emotional_state, setup_type")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(30);

    if (!entries || entries.length === 0) {
      return "\n\n[Trader context: No journal entries yet — encourage them to start journaling.]";
    }

    const wins = entries.filter((e) => e.outcome === "win").length;
    const losses = entries.filter((e) => e.outcome === "loss").length;
    const total = entries.length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const totalPnl = entries.reduce((s, e) => s + (Number(e.pnl) || 0), 0);

    const byInstrument: Record<string, { count: number; wins: number; pnl: number }> = {};
    for (const e of entries) {
      const key = e.instrument || "Unknown";
      byInstrument[key] ??= { count: 0, wins: 0, pnl: 0 };
      byInstrument[key].count++;
      if (e.outcome === "win") byInstrument[key].wins++;
      byInstrument[key].pnl += Number(e.pnl) || 0;
    }
    const topInstruments = Object.entries(byInstrument)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([k, v]) => `${k}: ${v.count} trades, ${Math.round((v.wins / v.count) * 100)}% WR, ${v.pnl.toFixed(2)} P&L`)
      .join(" • ");

    const emotions = entries
      .map((e) => e.emotional_state)
      .filter(Boolean)
      .slice(0, 10)
      .join(", ");

    return `\n\n[Trader context (last ${total} trades):
- Win rate: ${winRate}% (${wins}W / ${losses}L)
- Total P&L: ${totalPnl.toFixed(2)}
- Top instruments: ${topInstruments || "n/a"}
- Recent emotional states: ${emotions || "n/a"}
Use these numbers when relevant. Don't dump them; weave them in.]`;
  } catch (e) {
    console.error("journal context error", e);
    return "";
  }
}

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

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const journalContext = await getJournalContext(supabase, userData.user.id);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: COACH_SYSTEM_PROMPT + journalContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("coach-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
