import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Arova Risk Advisor — a forex/CFD risk-management coach embedded in a trading calculator.

Your job: critique the trader's current calculator inputs and return a structured verdict.
- Be direct and numerical. Reference the trader's real journal stats when given.
- Standards: risk per trade > 2% = aggressive, > 5% = dangerous. R:R < 1.5 with WR < 55% = poor expectancy.
- For SL/TP suggestions, use realistic pip ranges per instrument class (majors: 20-80 pips SL typical; gold: 100-300 pips).
- Never give buy/sell advice. Coach process only.`;

interface JournalStat {
  trades: number;
  wins: number;
  winRate: number;
  avgPnl: number;
}

async function getInstrumentStats(supabase: any, userId: string, instrument: string | null): Promise<JournalStat | null> {
  if (!instrument) return null;
  try {
    const { data } = await supabase
      .from("journal_entries")
      .select("outcome, pnl")
      .eq("user_id", userId)
      .eq("instrument", instrument)
      .order("entry_date", { ascending: false })
      .limit(30);
    const entries = (data as any[]) || [];
    if (entries.length === 0) return null;
    const wins = entries.filter((e) => e.outcome === "win").length;
    const totalPnl = entries.reduce((s, e) => s + (Number(e.pnl) || 0), 0);
    return {
      trades: entries.length,
      wins,
      winRate: Math.round((wins / entries.length) * 100),
      avgPnl: Math.round((totalPnl / entries.length) * 100) / 100,
    };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const body = await req.json();
    const { context, instrument } = body;
    if (!context) {
      return new Response(JSON.stringify({ error: "context required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const stats = await getInstrumentStats(supabase, userData.user.id, instrument);
    const statsLine = stats
      ? `\n[Trader history on ${instrument}: ${stats.trades} trades, ${stats.winRate}% WR, avg P&L ${stats.avgPnl}]`
      : `\n[No journal history for ${instrument || "this instrument"} yet.]`;

    const userPrompt = `Calculator inputs:\n${JSON.stringify(context, null, 2)}${statsLine}\n\nReturn a structured advisor verdict.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "advisor_verdict",
              description: "Return a structured risk-management verdict.",
              parameters: {
                type: "object",
                properties: {
                  risk_verdict: { type: "string", enum: ["safe", "aggressive", "dangerous"] },
                  headline: { type: "string", description: "One-sentence summary." },
                  sl_suggestion: { type: "string", description: "SL pip range or specific guidance." },
                  tp_suggestion: { type: "string", description: "TP pip range or R:R guidance." },
                  position_recommendation: { type: "string", description: "Lot size / risk % suggestion grounded in journal stats." },
                  next_step: { type: "string", description: "One concrete action the trader should take." },
                },
                required: ["risk_verdict", "headline", "sl_suggestion", "tp_suggestion", "position_recommendation", "next_step"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "advisor_verdict" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const toolCall = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "No structured verdict returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const verdict = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ verdict, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-calc-advisor error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
