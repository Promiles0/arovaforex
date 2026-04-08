import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

const PAGE_INTROS: Record<string, string> = {
  "/dashboard/journal": "Explain in 1-2 short sentences what the Trade Journal page does and how to get started. Be warm and concise.",
  "/dashboard/forecasts": "Explain in 1-2 short sentences what the Forecasts page shows and how to use it. Be warm and concise.",
  "/dashboard/calculator": "Explain in 1-2 short sentences what the Calculator page does and why it's useful. Be warm and concise.",
  "/dashboard/calendar": "Explain in 1-2 short sentences what the Calendar page shows and how to use it. Be warm and concise.",
  "/dashboard/signals": "Explain in 1-2 short sentences what Premium Signals are and how they work. Be warm and concise.",
  "/dashboard/backtesting": "Explain in 1-2 short sentences what Chart Analysis / Backtesting does. Be warm and concise.",
  "/dashboard/live-room": "Explain in 1-2 short sentences what the Live Room is and how to participate. Be warm and concise.",
};

const VISITED_KEY = "arova-visited-pages";

export const PageSummaryBubble = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [summary, setSummary] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  const getVisited = useCallback((): string[] => {
    try {
      return JSON.parse(localStorage.getItem(VISITED_KEY) || "[]");
    } catch {
      return [];
    }
  }, []);

  const markVisited = useCallback((path: string) => {
    const visited = getVisited();
    if (!visited.includes(path)) {
      visited.push(path);
      localStorage.setItem(VISITED_KEY, JSON.stringify(visited));
    }
  }, [getVisited]);

  useEffect(() => {
    setSummary(null);
    setDismissed(false);

    const path = location.pathname;
    const prompt = PAGE_INTROS[path];
    if (!prompt || !user) return;

    const visited = getVisited();
    if (visited.includes(path)) return;

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            currentPage: path,
          }),
        });

        if (!resp.ok || !resp.body) return;

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let result = "";
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buf.indexOf("\n")) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const content = JSON.parse(json).choices?.[0]?.delta?.content;
              if (content) result += content;
            } catch {}
          }
        }

        if (result.trim()) {
          setSummary(result.trim());
          markVisited(path);
        }
      } catch (err) {
        console.error("Page summary error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [location.pathname, user, getVisited, markVisited]);

  if (dismissed || (!loading && !summary)) return null;

  return (
    <Card className="mb-4 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent animate-in fade-in-0 slide-in-from-top-2 duration-500">
      <div className="flex items-start gap-3 p-3">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary mb-0.5">Welcome to this page! ✨</p>
          {loading ? (
            <div className="flex gap-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <p className="text-sm text-foreground">{summary}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setDismissed(true)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
};
