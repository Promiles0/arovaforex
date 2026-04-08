import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_SYSTEM_PROMPT = `You are Arova Assistant — the friendly, knowledgeable AI helper for the Arova Forex trading platform.

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
- Use code formatting for specific values or settings

Quick Actions:
When the user asks to navigate somewhere or wants to go to a page, include a navigation link in this exact format:
[ACTION:navigate:/dashboard/journal:Go to Journal]
[ACTION:navigate:/dashboard/forecasts:View Forecasts]
[ACTION:navigate:/dashboard/calculator:Open Calculator]
[ACTION:navigate:/dashboard/signals:Check Signals]
[ACTION:navigate:/dashboard/calendar:View Calendar]
[ACTION:navigate:/dashboard/backtesting:Chart Analysis]
[ACTION:navigate:/dashboard/live-room:Join Live Room]
[ACTION:navigate:/dashboard/wallet:My Wallet]
[ACTION:navigate:/dashboard/profile:My Profile]

Only include these action links when the user explicitly asks to go somewhere or when it's clearly helpful. Don't force them into every message.`;

const PAGE_CONTEXT: Record<string, string> = {
  "/dashboard": "The user is on their main trading dashboard viewing market overview, today's stats, performance charts, and smart insights.",
  "/dashboard/journal": "The user is in the trade journal. They can log manual trades, connect brokers for auto-import, view analytics (win rate, P&L, drawdown), and browse a calendar view of trades.",
  "/dashboard/forecasts": "The user is browsing market forecasts with chart images, sentiment analysis (bullish/bearish/neutral), likes, comments, and bookmarks.",
  "/dashboard/signals": "The user is on the Premium Signals page where they can view real-time trading signals with entry/exit prices, stop loss, and take profit levels.",
  "/dashboard/calculator": "The user is using the position size and risk calculator to plan trades.",
  "/dashboard/calendar": "The user is viewing the economic events calendar with currency strength heatmap and price alerts.",
  "/dashboard/backtesting": "The user is on the chart analysis page with drawing tools, indicators, and replay mode for backtesting strategies.",
  "/dashboard/live-room": "The user is in the live trading room with real-time video stream and chat.",
  "/dashboard/wallet": "The user is managing their wallet: balance, transactions, payment methods, and subscription.",
  "/dashboard/profile": "The user is viewing/editing their profile, achievements, and trading preferences.",
  "/dashboard/settings": "The user is on the settings page managing notification preferences, display settings, and account options.",
};

function getPageContext(currentPage?: string): string {
  if (!currentPage) return "";
  
  // Try exact match first, then prefix match
  const exact = PAGE_CONTEXT[currentPage];
  if (exact) return `\n\nCurrent context: ${exact}`;
  
  for (const [path, context] of Object.entries(PAGE_CONTEXT)) {
    if (currentPage.startsWith(path)) {
      return `\n\nCurrent context: ${context}`;
    }
  }
  
  return "";
}

async function getSystemPrompt(): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return DEFAULT_SYSTEM_PROMPT;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("assistant_config")
      .select("system_prompt")
      .limit(1)
      .single();

    if (error || !data?.system_prompt) return DEFAULT_SYSTEM_PROMPT;
    return data.system_prompt;
  } catch {
    return DEFAULT_SYSTEM_PROMPT;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, currentPage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = await getSystemPrompt();
    const pageContext = getPageContext(currentPage);

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
            { role: "system", content: systemPrompt + pageContext },
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
