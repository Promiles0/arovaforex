import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export type RatingValue = "up" | "down";

export type DigestRatingState = {
  myRating: RatingValue | null;
  myComment: string;
  counts: { up: number; down: number };
};

export function useDigestRating(digestId: string | null | undefined) {
  const { user } = useAuth();
  const [state, setState] = useState<DigestRatingState>({
    myRating: null, myComment: "", counts: { up: 0, down: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!digestId) { setLoading(false); return; }
    const { data: all } = await supabase
      .from("news_digest_ratings")
      .select("rating, user_id, comment")
      .eq("digest_id", digestId);
    const counts = { up: 0, down: 0 };
    let mine: { rating: RatingValue; comment: string | null } | null = null;
    (all ?? []).forEach((r: any) => {
      if (r.rating === "up") counts.up++;
      else if (r.rating === "down") counts.down++;
      if (user && r.user_id === user.id) mine = { rating: r.rating, comment: r.comment };
    });
    setState({
      counts,
      myRating: mine?.rating ?? null,
      myComment: mine?.comment ?? "",
    });
    setLoading(false);
  }, [digestId, user]);

  useEffect(() => { refresh(); }, [refresh]);

  const rate = useCallback(async (rating: RatingValue, comment: string) => {
    if (!user || !digestId) return false;
    setSaving(true);
    const { error } = await supabase
      .from("news_digest_ratings")
      .upsert({
        digest_id: digestId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "digest_id,user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save feedback", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Thanks for your feedback!" });
    await refresh();
    return true;
  }, [user, digestId, refresh]);

  const clear = useCallback(async () => {
    if (!user || !digestId) return;
    await supabase.from("news_digest_ratings").delete()
      .eq("digest_id", digestId).eq("user_id", user.id);
    await refresh();
  }, [user, digestId, refresh]);

  return { ...state, loading, saving, rate, clear };
}
