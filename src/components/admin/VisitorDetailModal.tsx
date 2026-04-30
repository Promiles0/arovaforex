import { useMemo } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, MousePointerClick, Clock, Globe2, Monitor, MapPin, ExternalLink, LogOut } from "lucide-react";
import { useVisitorSessionDetail } from "@/hooks/useVisitorSessionDetail";

type Props = {
  sessionId: string | null;
  onClose: () => void;
};

const formatDuration = (ms: number) => {
  if (!ms) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
};

const eventIcon = (type: string) => {
  if (type === "click") return MousePointerClick;
  if (type === "pageleave") return LogOut;
  return Eye;
};

const eventColor = (type: string) => {
  if (type === "click") return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  if (type === "pageleave") return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
};

export const VisitorDetailModal = ({ sessionId, onClose }: Props) => {
  const { events, profile, otherSessionsCount, loading } = useVisitorSessionDetail(sessionId);

  const stats = useMemo(() => {
    const pageviews = events.filter(e => e.event_type === "pageview").length;
    const clicks = events.filter(e => e.event_type === "click").length;
    const totalDuration = events
      .filter(e => e.event_type === "pageleave")
      .reduce((acc, e) => acc + (e.duration_ms ?? 0), 0);
    const first = events[0]?.created_at;
    const last = events[events.length - 1]?.created_at;
    const meta = events[0];
    const topPaths = (() => {
      const map = new Map<string, number>();
      events.filter(e => e.event_type === "pageview").forEach(e =>
        map.set(e.path, (map.get(e.path) ?? 0) + 1));
      return Array.from(map, ([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count).slice(0, 5);
    })();
    return { pageviews, clicks, totalDuration, first, last, meta, topPaths };
  }, [events]);

  const open = !!sessionId;
  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "AN";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogTitle className="sr-only">Visitor session detail</DialogTitle>
        <DialogDescription className="sr-only">Full activity timeline for the selected visitor session.</DialogDescription>

        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="flex items-start gap-4">
            <Avatar className="w-14 h-14">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
              <AvatarFallback className="bg-primary/20 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold truncate">
                  {profile?.full_name || (profile ? "User" : "Anonymous visitor")}
                </h3>
                {profile ? (
                  <Badge variant="secondary" className="text-[10px]">Registered</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Anonymous</Badge>
                )}
              </div>
              {profile?.email && <p className="text-xs text-muted-foreground truncate">{profile.email}</p>}
              <p className="text-[11px] text-muted-foreground font-mono mt-1 truncate">
                Session: {sessionId?.slice(0, 8)}…
                {profile && otherSessionsCount > 1 && (
                  <span className="ml-2 text-primary">{otherSessionsCount} total visits</span>
                )}
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
            {[
              { icon: Eye, label: "Pageviews", value: stats.pageviews },
              { icon: MousePointerClick, label: "Clicks", value: stats.clicks },
              { icon: Clock, label: "Time on site", value: formatDuration(stats.totalDuration) },
              { icon: Monitor, label: "Device", value: `${stats.meta?.device_type ?? "—"}${stats.meta?.browser ? " · " + stats.meta.browser : ""}` },
              { icon: MapPin, label: "Location", value: stats.meta?.country ? `${stats.meta.country}${stats.meta.city ? ", " + stats.meta.city : ""}` : "—" },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border bg-card/60 p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-wide">
                  <s.icon className="w-3 h-3" /> {s.label}
                </div>
                <div className="text-sm font-semibold mt-1 truncate">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="max-h-[55vh]">
          <div className="p-6 space-y-6">
            {/* Top pages */}
            {stats.topPaths.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-primary" /> Top pages in this session
                </h4>
                <div className="space-y-1.5">
                  {stats.topPaths.map(p => {
                    const max = stats.topPaths[0].count;
                    const pct = (p.count / max) * 100;
                    return (
                      <div key={p.path} className="flex items-center gap-3">
                        <code className="text-xs flex-1 truncate">{p.path}</code>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">{p.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Activity timeline */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Activity timeline ({events.length})</h4>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events recorded.</p>
              ) : (
                <div className="relative pl-6 space-y-3 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {events.map((e, idx) => {
                    const Icon = eventIcon(e.event_type);
                    const colorCls = eventColor(e.event_type);
                    return (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.01, 0.3) }}
                        className="relative"
                      >
                        <div className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border flex items-center justify-center ${colorCls}`}>
                          <Icon className="w-2.5 h-2.5" />
                        </div>
                        <div className="flex items-start justify-between gap-3 text-xs">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">
                              {e.event_type === "pageview" && <>Visited <code className="text-primary">{e.path}</code></>}
                              {e.event_type === "click" && (
                                <>
                                  Clicked <Badge variant="outline" className="text-[10px] mx-1">{e.element_tag}</Badge>
                                  {e.element_text && <span className="text-foreground">"{e.element_text}"</span>}
                                  {e.element_href && (
                                    <span className="text-muted-foreground ml-1 inline-flex items-center gap-1">
                                      → {e.element_href.slice(0, 60)} <ExternalLink className="w-3 h-3" />
                                    </span>
                                  )}
                                  <span className="text-muted-foreground ml-1">on <code>{e.path}</code></span>
                                </>
                              )}
                              {e.event_type === "pageleave" && (
                                <>Left <code>{e.path}</code> after <span className="text-amber-400 font-semibold">{formatDuration(e.duration_ms ?? 0)}</span></>
                              )}
                            </div>
                            {e.event_type === "pageview" && e.referrer && (
                              <p className="text-muted-foreground mt-0.5 truncate">from {e.referrer}</p>
                            )}
                          </div>
                          <span className="text-muted-foreground whitespace-nowrap">
                            {new Date(e.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
