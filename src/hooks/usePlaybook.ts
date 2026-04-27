import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlaybookContent {
  headline: string;
  market_context: string;
  patterns: string;
  gameplan: { title: string; detail: string }[];
  risk_budget: {
    max_risk_per_trade_pct: number;
    weekly_loss_cap_pct: number;
    reasoning: string;
  };
}

export interface Playbook {
  id: string;
  user_id: string;
  week_start: string;
  content: PlaybookContent;
  generated_at: string;
  model: string | null;
}

function getMondayOfWeek(d = new Date()): string {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
  dt.setDate(diff);
  return dt.toISOString().split("T")[0];
}

export function usePlaybook() {
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const quotaLimit = 3;

  const fetchCurrent = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const weekStart = getMondayOfWeek();
      const { data } = await supabase
        .from("playbooks")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .maybeSingle();
      if (data) setPlaybook(data as unknown as Playbook);

      // Fetch today's usage
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabase
        .from("ai_usage_log")
        .select("count")
        .eq("user_id", user.id)
        .eq("feature", "playbook")
        .eq("day", today)
        .maybeSingle();
      setQuotaUsed(usage?.count || 0);
    } catch (e) {
      console.error("fetch playbook error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-playbook-generate", {});
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlaybook(data.playbook as Playbook);
      setQuotaUsed(data.used);
      toast.success("Playbook generated");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to generate playbook");
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => { fetchCurrent(); }, [fetchCurrent]);

  return { playbook, loading, generating, generate, quotaUsed, quotaLimit, refresh: fetchCurrent };
}
