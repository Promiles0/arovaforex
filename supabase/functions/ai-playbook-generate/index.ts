import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_QUOTA = 3;

const SYSTEM_PROMPT = `You are Arova Playbook — a senior trading mentor writing a personalized weekly trading plan.

Tone: confident, specific, motivating but realistic. Use the trader's actual stats. No generic advice.
Never recommend specific buy/sell trades — focus on PROCESS, RULES, and RISK.
Reference the trader's real numbers ("Your 4 Monday Asia trades were 0/4 — skip that session this week").
Each gameplan rule must be ONE actionable sentence.`;

function getMondayOfWeek(d = new Date()): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

async function gatherContext(supabase: any, userId: string) {
  const [journalRes, signalsRes, forecastsRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("instrument, direction, outcome, pnl, risk_reward_ratio, entry_date, entry_time, session, emotional_state, setup_type, lessons_learned")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(60),
    supabase
      .from("trading_signals")
      .select("currency_pair, signal_type, confidence, status, created_at, analysis")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("forecasts")
      .select("currency_pair, trade_bias, commentary, created_at")
      .eq("forecast_type", "arova")
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const entries = (journalRes.data as any[]) || [];
  const wins = entries.filter((e) => e.outcome === "win").length;
  const losses = entries.filter((e) => e.outcome === "loss").length;
  const totalPnl = entries.reduce((s, e) => s + (Number(e.pnl) || 0), 0);
  const winRate = entries.length > 0 ? Math.round((wins / entries.length) * 100) : 0;

  const byInstrument: Record<string, { count: number; wins: number; pnl: number }> = {};
  const bySession: Record<string, { count: number; wins: number }> = {};
  for (const e of entries) {
    const inst = e.instrument || "Unknown";
    byInstrument[inst] = byInstrument[inst] || { count: 0, wins: 0, pnl: 0 };
    byInstrument[inst].count++;
    if (e.outcome === "win") byInstrument[inst].wins++;
    byInstrument[inst].pnl += Number(e.pnl) || 0;

    const sess = e.session || "Unknown";
    bySession[sess] = bySession[sess] || { count: 0, wins: 0 };
    bySession[sess].count++;
    if (e.outcome === "win") bySession[sess].wins++;
  }

  return {
    journalSummary: {
      total: entries.length,
      wins, losses, winRate,
      totalPnl: Math.round(totalPnl * 100) / 100,
      byInstrument: Object.entries(byInstrument)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 6)
        .map(([k, v]) => ({ instrument: k, trades: v.count, winRate: Math.round((v.wins / v.count) * 100), pnl: Math.round(v.pnl * 100) / 100 })),
      bySession: Object.entries(bySession)
        .map(([k, v]) => ({ session: k, trades: v.count, winRate: Math.round((v.wins / v.count) * 100) })),
      recentEmotions: entries.map((e) => e.emotional_state).filter(Boolean).slice(0, 8),
    },
    activeSignals: (signalsRes.data as any[]) || [],
    arovaForecasts: (forecastsRes.data as any[]) || [],
  };
}

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
    const userId = userData.user.id;

    // Quota check
    const today = new Date().toISOString().split("T")[0];
    const { data: usageRow } = await supabaseAdmin
      .from("ai_usage_log")
      .select("count")
      .eq("user_id", userId)
      .eq("feature", "playbook")
      .eq("day", today)
      .maybeSingle();
    const usedToday = usageRow?.count || 0;
    if (usedToday >= DAILY_QUOTA) {
      return new Response(JSON.stringify({ error: `Daily limit reached (${DAILY_QUOTA} regenerations/day). Try again tomorrow.` }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const ctx = await gatherContext(supabaseAdmin, userId);
    const weekStart = getMondayOfWeek();

    const userPrompt = `Generate this week's trading playbook.

Trader's recent journal (last ${ctx.journalSummary.total} trades):
${JSON.stringify(ctx.journalSummary, null, 2)}

Active Arova premium signals:
${JSON.stringify(ctx.activeSignals, null, 2)}

Recent Arova forecasts (admin picks):
${JSON.stringify(ctx.arovaForecasts, null, 2)}

Week starting: ${weekStart}

Build a playbook with: a punchy headline, market_context paragraph (synthesize signals + forecasts), patterns paragraph (trader's strengths/weaknesses from journal), 3-5 gameplan rules (each with title + detail), and a risk_budget object.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
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
              name: "weekly_playbook",
              description: "Personalized weekly trading playbook.",
              parameters: {
                type: "object",
                properties: {
                  headline: { type: "string", description: "Punchy 6-10 word headline." },
                  market_context: { type: "string", description: "1-2 short paragraphs synthesizing signals + forecasts." },
                  patterns: { type: "string", description: "1-2 short paragraphs on the trader's recent patterns." },
                  gameplan: {
                    type: "array",
                    minItems: 3, maxItems: 5,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short rule title." },
                        detail: { type: "string", description: "One actionable sentence." },
                      },
                      required: ["title", "detail"],
                      additionalProperties: false,
                    },
                  },
                  risk_budget: {
                    type: "object",
                    properties: {
                      max_risk_per_trade_pct: { type: "number" },
                      weekly_loss_cap_pct: { type: "number" },
                      reasoning: { type: "string" },
                    },
                    required: ["max_risk_per_trade_pct", "weekly_loss_cap_pct", "reasoning"],
                    additionalProperties: false,
                  },
                },
                required: ["headline", "market_context", "patterns", "gameplan", "risk_budget"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "weekly_playbook" } },
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
      return new Response(JSON.stringify({ error: "No structured playbook returned" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const content = JSON.parse(toolCall.function.arguments);

    // Upsert playbook
    const { data: saved, error: upErr } = await supabaseAdmin
      .from("playbooks")
      .upsert({
        user_id: userId,
        week_start: weekStart,
        content,
        model: "google/gemini-3-flash-preview",
        generated_at: new Date().toISOString(),
      }, { onConflict: "user_id,week_start" })
      .select()
      .single();

    if (upErr) {
      console.error("Playbook upsert error", upErr);
      return new Response(JSON.stringify({ error: "Failed to save playbook" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Increment quota
    if (usageRow) {
      await supabaseAdmin
        .from("ai_usage_log")
        .update({ count: usedToday + 1 })
        .eq("user_id", userId).eq("feature", "playbook").eq("day", today);
    } else {
      await supabaseAdmin
        .from("ai_usage_log")
        .insert({ user_id: userId, feature: "playbook", day: today, count: 1 });
    }

    return new Response(JSON.stringify({ playbook: saved, used: usedToday + 1, quota: DAILY_QUOTA }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-playbook-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
