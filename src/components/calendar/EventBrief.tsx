import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface EventBriefProps {
  eventId: string;
  autoLoad?: boolean;
}

// In-memory cache so collapsing/re-expanding doesn't refetch
const briefCache = new Map<string, string>();

export function EventBrief({ eventId, autoLoad = false }: EventBriefProps) {
  const [open, setOpen] = useState(autoLoad);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<string | null>(briefCache.get(eventId) ?? null);
  const [error, setError] = useState<string | null>(null);

  const loadBrief = async () => {
    if (brief || loading) return;
    setLoading(true);
    setError(null);
    try {
      // First try DB cache directly (fast, public read)
      const { data: cached } = await supabase
        .from("event_ai_briefs")
        .select("brief")
        .eq("event_id", eventId)
        .maybeSingle();
      if (cached?.brief) {
        briefCache.set(eventId, cached.brief);
        setBrief(cached.brief);
        return;
      }
      // Otherwise call the function
      const { data, error: fnErr } = await supabase.functions.invoke("ai-event-brief", {
        body: { eventId },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      briefCache.set(eventId, data.brief);
      setBrief(data.brief);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to load brief");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !brief) loadBrief();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="pt-2 border-t border-border/50">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="h-7 px-2 text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
      >
        <Sparkles className="w-3 h-3" />
        {open ? "Hide AI brief" : "Why it matters"}
      </Button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "mt-2 text-sm rounded-md px-3 py-2.5",
              "bg-primary/5 border border-primary/10",
              "text-foreground/90 leading-relaxed"
            )}>
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating brief…
                </div>
              )}
              {error && <span className="text-destructive text-xs">{error}</span>}
              {brief && !loading && brief}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
