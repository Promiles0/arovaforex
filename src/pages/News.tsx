import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Newspaper, RefreshCw, TrendingUp, TrendingDown, Activity, Minus,
  Calendar as CalendarIcon, Sparkles, BookOpen, Clock, Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SEO } from "@/components/seo/SEO";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useNewsDigest, type CurrencyImpact, type DigestHighlight } from "@/hooks/useNewsDigest";
import { useNewsWatchlist } from "@/hooks/useNewsWatchlist";
import { WatchlistEditor } from "@/components/news/WatchlistEditor";
import { DigestRatingPanel } from "@/components/news/DigestRatingPanel";

const impactStyle = (impact: DigestHighlight["impact"]) => {
  switch (impact) {
    case "high": return "bg-destructive/15 text-destructive border-destructive/30";
    case "medium": return "bg-primary/15 text-primary border-primary/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

const biasIcon = (bias: CurrencyImpact["bias"]) => {
  switch (bias) {
    case "bullish": return <TrendingUp className="w-4 h-4 text-green-500" />;
    case "bearish": return <TrendingDown className="w-4 h-4 text-destructive" />;
    case "volatile": return <Activity className="w-4 h-4 text-amber-500" />;
    default: return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
};

const biasStyle = (bias: CurrencyImpact["bias"]) => {
  switch (bias) {
    case "bullish": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30";
    case "bearish": return "bg-destructive/10 text-destructive border-destructive/30";
    case "volatile": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

const wordsIn = (s: string | undefined | null) =>
  s ? s.trim().split(/\s+/).filter(Boolean).length : 0;

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
};

const News = () => {
  const { digest, loading, generating, regenerate } = useNewsDigest();
  const { isAdmin } = useAdminCheck();
  const { watchlist } = useNewsWatchlist();

  const formattedDate = useMemo(() => {
    if (!digest?.digest_date) return "";
    return new Date(digest.digest_date).toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  }, [digest?.digest_date]);

  const readingMinutes = useMemo(() => {
    if (!digest) return 0;
    let words = wordsIn(digest.summary);
    digest.highlights.forEach(h => { words += wordsIn(h.title) + wordsIn(h.detail); });
    digest.currency_impacts.forEach(c => { words += wordsIn(c.note); });
    return Math.max(1, Math.ceil(words / 225));
  }, [digest]);

  const watchedCurrencies = useMemo(
    () => new Set(watchlist.currencies.map(c => c.toUpperCase())),
    [watchlist.currencies],
  );
  const watchedPairs = useMemo(
    () => new Set(watchlist.pairs.map(p => p.toUpperCase().replace(/[^A-Z]/g, ""))),
    [watchlist.pairs],
  );
  const isPairWatched = (p: string) =>
    watchedPairs.has(p.toUpperCase().replace(/[^A-Z]/g, ""));

  const sortedImpacts = useMemo(() => {
    if (!digest) return [];
    return [...digest.currency_impacts].sort((a, b) => {
      const aw = watchedCurrencies.has(a.currency.toUpperCase()) ? 0 : 1;
      const bw = watchedCurrencies.has(b.currency.toUpperCase()) ? 0 : 1;
      return aw - bw;
    });
  }, [digest, watchedCurrencies]);

  const updatedAtIso = digest?.updated_at ?? digest?.created_at;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      <SEO
        title="AI News Digest — Daily Market-Moving Events | Arova Forex"
        description="AI-summarized daily forex news digest highlighting market-moving events and per-currency impact for traders."
      />

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" /> AI News Desk
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-1 flex items-center gap-2">
            <Newspaper className="w-7 h-7 text-primary" />
            Today's Market Digest
          </h1>
          {formattedDate && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm mt-2">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5" /> {formattedDate}
              </span>
              {digest && (
                <>
                  <span aria-hidden>·</span>
                  <span>{digest.event_count} events analyzed</span>
                  <span aria-hidden>·</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> ~{readingMinutes} min read
                  </span>
                  {updatedAtIso && (
                    <>
                      <span aria-hidden>·</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 cursor-help">
                              <Clock className="w-3.5 h-3.5" /> Updated {timeAgo(updatedAtIso)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {new Date(updatedAtIso).toLocaleString()}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 self-start">
          <WatchlistEditor />
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={regenerate}
              disabled={generating || loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Regenerating…" : "Regenerate"}
            </Button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : !digest ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Newspaper className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No digest available yet. Please check back shortly.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="text-lg">Market Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {digest.summary}
              </p>
            </CardContent>
          </Card>

          {/* Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Key Market-Moving Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {digest.highlights.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notable events flagged.</p>
              ) : digest.highlights.map((h, i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-semibold text-foreground">{h.title}</h3>
                    <Badge variant="outline" className={impactStyle(h.impact)}>
                      {h.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{h.detail}</p>
                  {h.time && (
                    <p className="text-xs text-muted-foreground mt-2">⏰ {h.time}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Currency Impacts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Currency Impact Map</span>
                {(watchedCurrencies.size > 0 || watchedPairs.size > 0) && (
                  <Badge variant="outline" className="text-xs gap-1 border-primary/40 text-primary">
                    <Star className="w-3 h-3 fill-current" />
                    Watchlist active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedImpacts.map((c, i) => {
                  const isWatched = watchedCurrencies.has(c.currency.toUpperCase());
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-lg border bg-card/50 transition-all ${
                        isWatched
                          ? "border-primary/60 ring-1 ring-primary/20 bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{c.currency}</span>
                          {biasIcon(c.bias)}
                          {isWatched && (
                            <Badge variant="outline" className="text-[10px] gap-1 border-primary/40 text-primary">
                              <Star className="w-2.5 h-2.5 fill-current" /> Watching
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={biasStyle(c.bias)}>
                          {c.bias}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{c.note}</p>
                      {c.pairs?.length > 0 && (
                        <>
                          <Separator className="my-3" />
                          <div className="flex flex-wrap gap-1.5">
                            {c.pairs.map((p) => {
                              const watched = isPairWatched(p);
                              return (
                                <Badge
                                  key={p}
                                  variant={watched ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {watched && <Star className="w-2.5 h-2.5 mr-1 fill-current" />}
                                  {p}
                                </Badge>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Rating */}
          <DigestRatingPanel digestId={digest.id} />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/dashboard/calendar">View Full Calendar</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/dashboard/playbook">Open AI Playbook</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/dashboard/coach">Ask the AI Coach</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Generated by Arova AI · Educational only — not financial advice.
          </p>
        </>
      )}
    </div>
  );
};

export default News;
