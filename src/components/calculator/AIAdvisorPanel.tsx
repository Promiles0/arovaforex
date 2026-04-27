import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ShieldCheck, ShieldAlert, Shield, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AdvisorVerdict {
  risk_verdict: "safe" | "aggressive" | "dangerous";
  headline: string;
  sl_suggestion: string;
  tp_suggestion: string;
  position_recommendation: string;
  next_step: string;
}

interface AdvisorStats {
  trades: number;
  winRate: number;
  avgPnl: number;
}

interface AIAdvisorPanelProps {
  context: Record<string, unknown>;
  instrument?: string | null;
}

const verdictStyles: Record<AdvisorVerdict["risk_verdict"], { icon: typeof Shield; cls: string; label: string }> = {
  safe: { icon: ShieldCheck, cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", label: "Safe" },
  aggressive: { icon: Shield, cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", label: "Aggressive" },
  dangerous: { icon: ShieldAlert, cls: "bg-destructive/15 text-destructive border-destructive/30", label: "Dangerous" },
};

export function AIAdvisorPanel({ context, instrument }: AIAdvisorPanelProps) {
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<AdvisorVerdict | null>(null);
  const [stats, setStats] = useState<AdvisorStats | null>(null);

  const askAdvisor = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-calc-advisor", {
        body: { context, instrument },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setVerdict(data.verdict);
      setStats(data.stats);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to get AI advice");
    } finally {
      setLoading(false);
    }
  }, [context, instrument]);

  const Icon = verdict ? verdictStyles[verdict.risk_verdict].icon : Sparkles;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Risk Advisor
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Critique your inputs against your real journal history.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={askAdvisor} disabled={loading} className="w-full" size="sm">
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing…</>
          ) : verdict ? (
            <><Sparkles className="w-4 h-4 mr-2" /> Re-analyze</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Ask AI Advisor</>
          )}
        </Button>

        <AnimatePresence mode="wait">
          {verdict && (
            <motion.div
              key={verdict.headline}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <Badge variant="outline" className={cn("gap-1.5 px-2.5 py-1", verdictStyles[verdict.risk_verdict].cls)}>
                <Icon className="w-3.5 h-3.5" />
                {verdictStyles[verdict.risk_verdict].label}
              </Badge>

              <p className="text-sm font-medium leading-snug">{verdict.headline}</p>

              {stats && (
                <div className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                  Based on your last <strong>{stats.trades}</strong> {instrument} trades — <strong>{stats.winRate}% WR</strong>, avg P&L <strong>{stats.avgPnl}</strong>.
                </div>
              )}

              <div className="space-y-2.5">
                <Section label="Stop loss" value={verdict.sl_suggestion} />
                <Section label="Take profit" value={verdict.tp_suggestion} />
                <Section label="Position size" value={verdict.position_recommendation} />
              </div>

              <div className="pt-2 border-t border-border flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm">
                  <span className="font-medium">Next: </span>
                  <span className="text-muted-foreground">{verdict.next_step}</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!verdict && !loading && (
          <p className="text-xs text-muted-foreground italic">
            Tip: enter your trade plan, then tap the button above for personalized risk feedback.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm leading-snug">{value}</div>
    </div>
  );
}
