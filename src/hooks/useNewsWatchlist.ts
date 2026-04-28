import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export type NewsWatchlist = {
  currencies: string[];
  pairs: string[];
};

const EMPTY: NewsWatchlist = { currencies: [], pairs: [] };

export function useNewsWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<NewsWatchlist>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("news_watchlist")
        .select("currencies, pairs")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        if (!error && data) {
          setWatchlist({ currencies: data.currencies ?? [], pairs: data.pairs ?? [] });
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const save = useCallback(async (next: NewsWatchlist) => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      currencies: next.currencies,
      pairs: next.pairs,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("news_watchlist")
      .upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save watchlist", description: error.message, variant: "destructive" });
      return false;
    }
    setWatchlist(next);
    toast({ title: "Watchlist saved" });
    return true;
  }, [user]);

  return { watchlist, loading, saving, save };
}
