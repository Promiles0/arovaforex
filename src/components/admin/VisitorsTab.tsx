import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Globe2, Users2, Activity as ActivityIcon, MousePointerClick, Eye, Clock, Search, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { useVisitorSessions, type Range } from "@/hooks/useVisitorSessions";
import { VisitorDetailModal } from "@/components/admin/VisitorDetailModal";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

const formatDuration = (ms: number) => {
  if (!ms) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const VisitorsTab = () => {
  const [range, setRange] = useState<Range>("7d");
  const [filter, setFilter] = useState<"all" | "user" | "anon">("all");
  const [search, setSearch] = useState("");
  const [openSession, setOpenSession] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState(0);

  const { sessions, profiles, loading, reload } = useVisitorSessions(range);

  // Realtime: bump live counter; reload list lightly on insert
  useEffect(() => {
    const ch = supabase
      .channel("admin-visitor-events-v2")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "visitor_events" }, () => {
        setLiveCount(c => c + 1);
      })
      .subscribe();
    const interval = setInterval(reload, 30000);
    return () => { supabase.removeChannel(ch); clearInterval(interval); };
  }, [reload]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sessions.filter(s => {
      if (filter === "user" && !s.user_id) return false;
      if (filter === "anon" && s.user_id) return false;
      if (!q) return true;
      const p = s.user_id ? profiles[s.user_id] : null;
      return (
        s.session_id.toLowerCase().includes(q) ||
        s.country?.toLowerCase().includes(q) ||
        s.last_path?.toLowerCase().includes(q) ||
        p?.full_name?.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q)
      );
    });
  }, [sessions, filter, search, profiles]);

  const stats = useMemo(() => {
    const totalPV = sessions.reduce((a, s) => a + s.pageviews, 0);
    const totalClicks = sessions.reduce((a, s) => a + s.clicks, 0);
    const totalDur = sessions.reduce((a, s) => a + s.total_duration_ms, 0);
    const loggedIn = sessions.filter(s => s.user_id).length;
    return {
      uniqueVisitors: sessions.length,
      totalPV, totalClicks,
      avgDuration: sessions.length ? Math.round(totalDur / sessions.length) : 0,
      loggedIn, anon: sessions.length - loggedIn,
    };
  }, [sessions]);

  const topPages = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(s => { if (s.last_path) map.set(s.last_path, (map.get(s.last_path) ?? 0) + s.pageviews); });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [sessions]);

  const topReferrers = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(s => {
      let host = "(direct)";
      if (s.referrer) {
        try { host = new URL(s.referrer).hostname; } catch { host = s.referrer.slice(0, 40); }
      }
      map.set(host, (map.get(host) ?? 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [sessions]);

  const devices = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(s => map.set(s.device_type ?? "Unknown", (map.get(s.device_type ?? "Unknown") ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [sessions]);

  const browsers = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(s => map.set(s.browser ?? "Unknown", (map.get(s.browser ?? "Unknown") ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [sessions]);

  const countries = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(s => map.set(s.country ?? "Unknown", (map.get(s.country ?? "Unknown") ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [sessions]);

  const cards = [
    { label: "Unique visitors", value: stats.uniqueVisitors, icon: Users2, color: "text-blue-400 bg-blue-500/20" },
    { label: "Pageviews", value: stats.totalPV, icon: Eye, color: "text-emerald-400 bg-emerald-500/20" },
    { label: "Clicks", value: stats.totalClicks, icon: MousePointerClick, color: "text-amber-400 bg-amber-500/20" },
    { label: "Avg session", value: formatDuration(stats.avgDuration), icon: Clock, color: "text-purple-400 bg-purple-500/20" },
    { label: "Logged-in / Anon", value: `${stats.loggedIn} / ${stats.anon}`, icon: ActivityIcon, color: "text-pink-400 bg-pink-500/20" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Visitor Tracking</h2>
          <Badge variant="secondary" className="gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
            {liveCount > 0 && <span className="ml-1 text-[10px]">+{liveCount}</span>}
          </Badge>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Pageviews per route</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topPages} layout="vertical" margin={{ left: 60 }}>
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={140} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Referrers</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topReferrers} layout="vertical" margin={{ left: 60 }}>
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={140} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { title: "Devices", data: devices, icon: Smartphone },
          { title: "Browsers", data: browsers, icon: Globe2 },
          { title: "Countries", data: countries, icon: Globe2 },
        ].map(({ title, data }) => (
          <Card key={title}>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                    {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Visitor list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle>Visitors ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as typeof filter)} size="sm">
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="user">Registered</ToggleGroupItem>
                <ToggleGroupItem value="anon">Anonymous</ToggleGroupItem>
              </ToggleGroup>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, path…"
                  className="pl-8 w-56 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No visitors in this range.</p>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Device · Browser</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead>Last seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 200).map(s => {
                    const p = s.user_id ? profiles[s.user_id] : null;
                    const initials = p?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "AN";
                    return (
                      <TableRow
                        key={s.session_id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => setOpenSession(s.session_id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              {p?.avatar_url && <AvatarImage src={p.avatar_url} />}
                              <AvatarFallback className="text-[10px] bg-primary/15 text-primary">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate max-w-[160px]">
                                {p?.full_name || (p ? "User" : "Anonymous")}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">
                                {p?.email || `${s.session_id.slice(0, 8)}…`}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.country ?? "—"}{s.city ? `, ${s.city}` : ""}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.device_type ?? "—"}{s.browser ? ` · ${s.browser}` : ""}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">{s.pageviews}</TableCell>
                        <TableCell className="text-xs text-right">{s.clicks}</TableCell>
                        <TableCell className="text-xs text-right">{formatDuration(s.total_duration_ms)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{relativeTime(s.last_seen)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <VisitorDetailModal sessionId={openSession} onClose={() => setOpenSession(null)} />
    </motion.div>
  );
};
