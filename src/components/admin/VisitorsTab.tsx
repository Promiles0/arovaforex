import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Globe2, Users2, Activity as ActivityIcon, MousePointerClick, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

type Visit = {
  id: string;
  created_at: string;
  session_id: string;
  user_id: string | null;
  path: string;
  referrer: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
};

type Range = "today" | "7d" | "30d";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const startFor = (r: Range): Date => {
  const d = new Date();
  if (r === "today") d.setHours(0, 0, 0, 0);
  else if (r === "7d") d.setDate(d.getDate() - 7);
  else d.setDate(d.getDate() - 30);
  return d;
};

export const VisitorsTab = () => {
  const [range, setRange] = useState<Range>("7d");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveCount, setLiveCount] = useState(0);

  const load = async () => {
    setLoading(true);
    const since = startFor(range).toISOString();
    const { data, error } = await supabase
      .from("visitor_events")
      .select("id, created_at, session_id, user_id, path, referrer, country, city, device_type")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) toast.error("Failed to load visitor events");
    setVisits((data ?? []) as Visit[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [range]);

  // Realtime: prepend new inserts
  useEffect(() => {
    const ch = supabase
      .channel("admin-visitor-events")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "visitor_events" }, (payload) => {
        const v = payload.new as Visit;
        setVisits(prev => [v, ...prev].slice(0, 1000));
        setLiveCount(c => c + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const stats = useMemo(() => {
    const sessions = new Set(visits.map(v => v.session_id));
    const loggedIn = visits.filter(v => v.user_id).length;
    const today = visits.filter(v => new Date(v.created_at).toDateString() === new Date().toDateString()).length;
    return { total: visits.length, sessions: sessions.size, loggedIn, anon: visits.length - loggedIn, today };
  }, [visits]);

  const topPages = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach(v => map.set(v.path, (map.get(v.path) ?? 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [visits]);

  const topReferrers = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach(v => {
      let host = "(direct)";
      if (v.referrer) {
        try { host = new URL(v.referrer).hostname; } catch { host = v.referrer.slice(0, 40); }
      }
      map.set(host, (map.get(host) ?? 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [visits]);

  const countries = useMemo(() => {
    const map = new Map<string, number>();
    visits.forEach(v => {
      const k = v.country ?? "Unknown";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [visits]);

  const cards = [
    { label: "Total visits", value: stats.total, icon: MousePointerClick, color: "text-blue-400 bg-blue-500/20" },
    { label: "Unique sessions", value: stats.sessions, icon: Users2, color: "text-emerald-400 bg-emerald-500/20" },
    { label: "Logged-in vs Anon", value: `${stats.loggedIn} / ${stats.anon}`, icon: ActivityIcon, color: "text-purple-400 bg-purple-500/20" },
    { label: "Today's visits", value: stats.today, icon: Globe2, color: "text-pink-400 bg-pink-500/20" },
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Top Pages</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topPages} layout="vertical" margin={{ left: 60 }}>
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
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
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Countries</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={countries} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {countries.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest Visits ({visits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
          ) : visits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No visits in this range.</p>
          ) : (
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Referrer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.slice(0, 100).map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="text-xs whitespace-nowrap">{new Date(v.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs font-mono">{v.path}</TableCell>
                      <TableCell className="text-xs">{v.country ?? "—"}{v.city ? `, ${v.city}` : ""}</TableCell>
                      <TableCell className="text-xs">{v.device_type ?? "—"}</TableCell>
                      <TableCell className="text-xs">{v.user_id ? <Badge variant="outline" className="text-[10px]">user</Badge> : <span className="text-muted-foreground">anon</span>}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{v.referrer ?? "(direct)"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
