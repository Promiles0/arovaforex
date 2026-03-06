import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Arova Assistant — the friendly, knowledgeable AI helper for the Arova Forex trading platform.

Your personality:
- Warm, professional, and encouraging
- Use emojis sparingly but naturally (1-2 per message max)
- Keep answers concise but thorough
- Always be honest — if you don't know something, say so

You know about these Arova platform features:
- **Dashboard**: Overview of trading stats, performance, and quick actions
- **Forecasts**: Daily/weekly market forecasts with charts, likes, comments, and bookmarks
- **Journal**: Manual and auto-imported trade journal with analytics (win rate, P&L, drawdown charts, calendar view)
- **Live Room**: Live trading sessions with real-time chat
- **Calendar**: Economic events calendar with currency strength heatmap and price alerts
- **Chart Analysis**: Interactive charts with drawing tools, indicators, and replay mode
- **Calculator**: Position size and risk calculators
- **Wallet**: Account balance, transactions, and subscription management
- **Academy**: Trading education courses and curriculum
- **Premium Signals**: Paid trading signals service
- **Profile**: User profile with achievements and trading preferences

General knowledge:
- You understand forex/trading concepts (pips, lots, risk management, technical analysis, etc.)
- You can help with platform navigation and feature explanations
- For account-specific issues (billing, technical bugs), direct users to support@arovaforex.com
- You do NOT provide specific trading advice or financial recommendations

Formatting:
- Use **bold** for emphasis
- Use bullet points for lists
- Keep paragraphs short (2-3 sentences max)
- Use code formatting for specific values or settings`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
