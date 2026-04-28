import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDigestRating, type RatingValue } from "@/hooks/useDigestRating";

export const DigestRatingPanel = ({ digestId }: { digestId: string }) => {
  const { myRating, myComment, counts, loading, saving, rate, clear } = useDigestRating(digestId);
  const [pending, setPending] = useState<RatingValue | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    setComment(myComment ?? "");
  }, [myComment]);

  const startRating = (v: RatingValue) => {
    if (myRating === v) {
      // toggle off
      clear();
      setPending(null);
      setComment("");
      return;
    }
    setPending(v);
    if (myRating !== v) setComment(myComment ?? "");
  };

  const submit = async () => {
    const value = pending ?? myRating;
    if (!value) return;
    const ok = await rate(value, comment);
    if (ok) setPending(null);
  };

  const showForm = pending !== null;
  const activeRating = pending ?? myRating;

  return (
    <Card className="border-primary/10">
      <CardContent className="py-5 space-y-4">
        <div>
          <h3 className="font-semibold text-sm">Was this digest helpful?</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your feedback helps tune future summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeRating === "up" ? "default" : "outline"}
            size="sm"
            disabled={loading || saving}
            onClick={() => startRating("up")}
            className="gap-2"
          >
            <ThumbsUp className="w-4 h-4" />
            Helpful
            {counts.up > 0 && <span className="text-xs opacity-80">· {counts.up}</span>}
          </Button>
          <Button
            variant={activeRating === "down" ? "default" : "outline"}
            size="sm"
            disabled={loading || saving}
            onClick={() => startRating("down")}
            className="gap-2"
          >
            <ThumbsDown className="w-4 h-4" />
            Needs work
            {counts.down > 0 && <span className="text-xs opacity-80">· {counts.down}</span>}
          </Button>
          {myRating && !showForm && (
            <span className="text-xs text-muted-foreground ml-auto">
              You rated this {myRating === "up" ? "helpful 👍" : "needs work 👎"}
            </span>
          )}
        </div>

        {showForm && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              {pending === "up" ? "What did you like? (optional)" : "What could be better? (optional)"}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share a quick thought…"
              maxLength={500}
              rows={3}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{comment.length}/500</span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setPending(null); setComment(myComment ?? ""); }}
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={submit} disabled={saving}>
                  {saving ? "Saving…" : "Submit feedback"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
