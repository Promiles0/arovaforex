import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type DigestHighlight = {
  title: string;
  detail: string;
  impact: "high" | "medium" | "low";
  time?: string;
};

export type CurrencyImpact = {
  currency: string;
  bias: "bullish" | "bearish" | "neutral" | "volatile";
  note: string;
  pairs: string[];
};

export type NewsDigest = {
  id: string;
  digest_date: string;
  summary: string;
  highlights: DigestHighlight[];
  currency_impacts: CurrencyImpact[];
  event_count: number;
  model: string | null;
  created_at: string;
  updated_at: string;
};

export function useNewsDigest() {
  const [digest, setDigest] = useState<NewsDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchDigest = useCallback(async (force = false) => {
    if (force) setGenerating(true);
    else setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-news-digest", {
        body: { force },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDigest(data?.digest ?? null);
    } catch (e) {
      console.error("news digest error", e);
      toast({
        title: "Could not load digest",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    fetchDigest(false);
  }, [fetchDigest]);

  return { digest, loading, generating, regenerate: () => fetchDigest(true) };
}
