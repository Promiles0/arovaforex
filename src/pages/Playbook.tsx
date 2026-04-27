import { motion } from "framer-motion";
import { ScrollText, Sparkles, Loader2, Target, TrendingUp, Brain, ShieldAlert, RefreshCw, NotebookPen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/seo/SEO";
import { usePlaybook } from "@/hooks/usePlaybook";
import { formatDistanceToNow } from "date-fns";

export default function Playbook() {
  const { playbook, loading, generating, generate, quotaUsed, quotaLimit } = usePlaybook();

  const canRegen = quotaUsed < quotaLimit;

  return (
    <>
      <SEO
        title="AI Playbook — Your Weekly Trading Plan | Arova"
        description="Personalized weekly trading plan generated from your journal, signals, and Arova forecasts."
      />
      <div className="space-y-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between flex-wrap gap-3"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ScrollText className="w-7 h-7 text-primary" />
              AI Playbook
            </h1>
            <p className="text-muted-foreground mt-1">
              Your personalized weekly trading plan, built from your journal and live market context.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              {quotaUsed}/{quotaLimit} regens today
            </Badge>
            <Button onClick={generate} disabled={generating || !canRegen} size="sm">
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
              ) : playbook ? (
                <><RefreshCw className="w-4 h-4 mr-2" /> Regenerate</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate this week's playbook</>
              )}
            </Button>
          </div>
        </motion.div>

        {loading && <PlaybookSkeleton />}

        {!loading && !playbook && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-12 text-center border-dashed">
              <ScrollText className="w-14 h-14 text-primary/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No playbook for this week yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Generate a tailored plan using your last 60 journal trades, the latest Arova forecasts, and active premium signals.
              </p>
              <Button onClick={generate} disabled={generating}>
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate playbook
              </Button>
            </Card>
          </motion.div>
        )}

        {!loading && playbook && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-5"
          >
            {/* Hero */}
            <motion.div variants={fadeUp}>
              <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
                <CardContent className="p-6 sm:p-8">
                  <Badge variant="outline" className="mb-3 gap-1.5 border-primary/40 text-primary">
                    <Sparkles className="w-3 h-3" />
                    Week of {new Date(playbook.week_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                    {playbook.content.headline}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-3">
                    Generated {formatDistanceToNow(new Date(playbook.generated_at), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Market context */}
            <motion.div variants={fadeUp}>
              <SectionCard icon={TrendingUp} title="Market context" iconColor="text-cyan-400">
                <p className="text-sm leading-relaxed whitespace-pre-line">{playbook.content.market_context}</p>
              </SectionCard>
            </motion.div>

            {/* Patterns */}
            <motion.div variants={fadeUp}>
              <SectionCard icon={Brain} title="Your patterns this period" iconColor="text-purple-400">
                <p className="text-sm leading-relaxed whitespace-pre-line">{playbook.content.patterns}</p>
              </SectionCard>
            </motion.div>

            {/* Gameplan */}
            <motion.div variants={fadeUp}>
              <SectionCard icon={Target} title="This week's gameplan" iconColor="text-emerald-400">
                <ul className="space-y-3">
                  {playbook.content.gameplan.map((rule, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{rule.title}</div>
                        <div className="text-sm text-muted-foreground">{rule.detail}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </motion.div>

            {/* Risk budget */}
            <motion.div variants={fadeUp}>
              <SectionCard icon={ShieldAlert} title="Risk budget" iconColor="text-amber-400">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Stat label="Max risk / trade" value={`${playbook.content.risk_budget.max_risk_per_trade_pct}%`} />
                  <Stat label="Weekly loss cap" value={`${playbook.content.risk_budget.weekly_loss_cap_pct}%`} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{playbook.content.risk_budget.reasoning}</p>
              </SectionCard>
            </motion.div>

            <motion.div variants={fadeUp} className="text-xs text-muted-foreground italic text-center pt-2">
              <NotebookPen className="w-3 h-3 inline mr-1" />
              Process coaching only — not financial advice. Update your journal to refine future plans.
            </motion.div>
          </motion.div>
        )}
      </div>
    </>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function SectionCard({
  icon: Icon, title, iconColor, children,
}: {
  icon: typeof Target; title: string; iconColor: string; children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function PlaybookSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}
