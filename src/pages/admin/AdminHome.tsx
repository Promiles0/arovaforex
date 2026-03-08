import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, TrendingUp, Heart, MessageSquare, Database, Wifi,
  HardDrive, Activity, Trophy, Medal, Crown, Calendar,
  ArrowUpRight, ArrowDownRight, Radio, Clock, Eye, Send,
  FileText, Bot, Bell, UserPlus, ImageIcon
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, AreaChart, Area,
} from "recharts";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, formatDistanceToNow } from "date-fns";

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const DONUT_COLORS = ["hsl(154,89%,16%)", "hsl(47,96%,53%)", "hsl(0,84%,60%)", "hsl(210,70%,50%)"];

const gradientCards = [
  { key: "users", label: "Total Users", icon: Users, gradient: "from-blue-500/20 to-blue-600/5", iconBg: "bg-blue-500/20", iconColor: "text-blue-400", sparkColor: "#60a5fa" },
  { key: "forecasts", label: "Active Forecasts", icon: TrendingUp, gradient: "from-emerald-500/20 to-emerald-600/5", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400", sparkColor: "#34d399" },
  { key: "likes", label: "Likes Today", icon: Heart, gradient: "from-pink-500/20 to-pink-600/5", iconBg: "bg-pink-500/20", iconColor: "text-pink-400", sparkColor: "#f472b6" },
  { key: "messages", label: "Open Messages", icon: MessageSquare, gradient: "from-purple-500/20 to-purple-600/5", iconBg: "bg-purple-500/20", iconColor: "text-purple-400", sparkColor: "#a78bfa" },
];

const quickActions = [
  { label: "Send Notification", icon: Send, to: "/admin/notifications", variant: "default" as const },
  { label: "View Reports", icon: TrendingUp, to: "/admin/analytics", variant: "secondary" as const },
  { label: "Manage Content", icon: FileText, to: "/admin/content", variant: "outline" as const },
  { label: "Live Stream", icon: Radio, to: "/admin/live-stream", variant: "outline" as const },
  { label: "AI Assistant", icon: Bot, to: "/admin/ai-assistant", variant: "outline" as const },
  { label: "Users", icon: Users, to: "/admin/users", variant: "outline" as const },
];

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

interface TopUser { user_id: string; full_name: string | null; avatar_url: string | null; created_at: string; count: number; }
interface ActivityItem { id: string; type: 'user' | 'forecast' | 'message'; text: string; time: string; }

export default function AdminHome() {
  const navigate = useNavigate();
  const clock = useLiveClock();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, forecasts: 0, likes: 0, messages: 0 });
  const [yesterdayStats, setYesterdayStats] = useState({ users: 0, forecasts: 0, likes: 0, messages: 0 });
  const [chartData, setChartData] = useState<{ name: string; users: number; forecasts: number }[]>([]);
  const [sparkData, setSparkData] = useState<Record<string, number[]>>({ users: [], forecasts: [], likes: [], messages: [] });
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [donutData, setDonutData] = useState<{ name: string; value: number }[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [scheduledSession, setScheduledSession] = useState<string | null>(null);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);

  const animUsers = useCountUp(stats.users);
  const animForecasts = useCountUp(stats.forecasts);
  const animLikes = useCountUp(stats.likes);
  const animMessages = useCountUp(stats.messages);
  const animValues = { users: animUsers, forecasts: animForecasts, likes: animLikes, messages: animMessages };

  const hour = clock.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    loadAll();
    const ch = supabase.channel("admin-home-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => { loadStats(); loadActivityFeed(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "forecasts" }, () => { loadStats(); loadActivityFeed(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, () => { loadStats(); loadActivityFeed(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const loadAll = async () => {
    await Promise.all([loadStats(), loadChartData(), loadTopUsers(), loadDonut(), loadMessages(), loadEvents(), loadSchedule(), loadActivityFeed()]);
    setLoading(false);
  };

  const loadStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const [u, f, l, m, yu, yf, yl, ym] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("forecasts").select("id", { count: "exact", head: true }),
      supabase.from("forecast_likes").select("id", { count: "exact", head: true }).gte("created_at", today),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).lt("created_at", today),
      supabase.from("forecasts").select("id", { count: "exact", head: true }).lt("created_at", today),
      supabase.from("forecast_likes").select("id", { count: "exact", head: true }).gte("created_at", yesterday).lt("created_at", today),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "open").lt("created_at", today),
    ]);
    setStats({ users: u.count || 0, forecasts: f.count || 0, likes: l.count || 0, messages: m.count || 0 });
    setYesterdayStats({ users: yu.count || 0, forecasts: yf.count || 0, likes: yl.count || 0, messages: ym.count || 0 });
  };

  const loadChartData = async () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
    const data = await Promise.all(days.map(async (date) => {
      const next = new Date(date); next.setDate(next.getDate() + 1);
      const [ur, fr, lr, mr] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", date).lt("created_at", next.toISOString().split("T")[0]),
        supabase.from("forecasts").select("id", { count: "exact", head: true }).gte("created_at", date).lt("created_at", next.toISOString().split("T")[0]),
        supabase.from("forecast_likes").select("id", { count: "exact", head: true }).gte("created_at", date).lt("created_at", next.toISOString().split("T")[0]),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).gte("created_at", date).lt("created_at", next.toISOString().split("T")[0]),
      ]);
      return {
        name: new Date(date).toLocaleDateString("en", { weekday: "short" }),
        users: ur.count || 0,
        forecasts: fr.count || 0,
        likes: lr.count || 0,
        messages: mr.count || 0,
      };
    }));
    setChartData(data);
    setSparkData({
      users: data.map(d => d.users),
      forecasts: data.map(d => d.forecasts),
      likes: data.map(d => d.likes),
      messages: data.map(d => d.messages),
    });
  };

  const loadActivityFeed = async () => {
    const [usersRes, forecastsRes, messagesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("forecasts").select("id, title, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("contact_messages").select("id, name, subject, created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    const items: ActivityItem[] = [];
    usersRes.data?.forEach(u => items.push({ id: u.user_id, type: 'user', text: `${u.full_name || 'New user'} joined the platform`, time: u.created_at }));
    forecastsRes.data?.forEach(f => items.push({ id: f.id, type: 'forecast', text: `New forecast: ${f.title || 'Untitled'}`, time: f.created_at }));
    messagesRes.data?.forEach(m => items.push({ id: m.id, type: 'message', text: `${m.name} sent: ${m.subject || 'Contact message'}`, time: m.created_at }));
    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setActivityFeed(items.slice(0, 8));
  };

  const loadTopUsers = async () => {
    const { data: forecasts } = await supabase.from("forecasts").select("user_id");
    if (!forecasts) return;
    const counts: Record<string, number> = {};
    forecasts.forEach((f) => { counts[f.user_id] = (counts[f.user_id] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const userIds = sorted.map(([id]) => id);
    if (userIds.length === 0) return;
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, created_at").in("user_id", userIds);
    const result: TopUser[] = sorted.map(([uid, count]) => {
      const p = profiles?.find((pr) => pr.user_id === uid);
      return { user_id: uid, full_name: p?.full_name || "User", avatar_url: p?.avatar_url || null, created_at: p?.created_at || "", count };
    });
    setTopUsers(result);
  };

  const loadDonut = async () => {
    const [f, j, c, v] = await Promise.all([
      supabase.from("forecasts").select("id", { count: "exact", head: true }),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      supabase.from("live_stream_views").select("id", { count: "exact", head: true }),
    ]);
    setDonutData([
      { name: "Forecasts", value: f.count || 0 },
      { name: "Journal Entries", value: j.count || 0 },
      { name: "Messages", value: c.count || 0 },
      { name: "Stream Views", value: v.count || 0 },
    ]);
  };

  const loadMessages = async () => {
    const { data } = await supabase.from("contact_messages").select("id, name, subject, status, priority, created_at")
      .eq("status", "open").order("created_at", { ascending: false }).limit(5);
    setRecentMessages(data || []);
  };

  const loadEvents = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("calendar_events").select("id, title, event_date, category, impact")
      .gte("event_date", today).order("event_date", { ascending: true }).limit(5);
    setUpcomingEvents(data || []);
  };

  const loadSchedule = async () => {
    const { data } = await supabase.from("live_stream_config").select("scheduled_start").single();
    if (data?.scheduled_start && new Date(data.scheduled_start) > new Date()) {
      setScheduledSession(data.scheduled_start);
    }
  };

  const getChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const statsValues: Record<string, number> = { users: stats.users, forecasts: stats.forecasts, likes: stats.likes, messages: stats.messages };
  const yesterdayValues: Record<string, number> = { users: yesterdayStats.users, forecasts: yesterdayStats.forecasts, likes: yesterdayStats.likes, messages: yesterdayStats.messages };

  const medalIcons = [
    <Crown className="w-5 h-5 text-yellow-400" />,
    <Medal className="w-5 h-5 text-gray-300" />,
    <Medal className="w-5 h-5 text-amber-600" />,
  ];

  const activityIcon = (type: string) => {
    switch (type) {
      case 'user': return <UserPlus className="w-3.5 h-3.5 text-blue-400" />;
      case 'forecast': return <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />;
      case 'message': return <MessageSquare className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Activity className="w-3.5 h-3.5" />;
    }
  };

  return (
    <>
      <SEO title="Admin Dashboard | Arova" description="Real-time admin dashboard" />
      <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
        {/* Welcome + Live Clock */}
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{greeting}, Admin 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">Here's what's happening on your platform today.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/50">
            <Clock className="w-4 h-4 text-primary animate-pulse" />
            <span className="font-mono text-sm font-medium tabular-nums">
              {clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {clock.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
        </motion.div>

        {/* Gradient Stat Cards with Sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gradientCards.map((card) => {
            const change = getChange(statsValues[card.key], yesterdayValues[card.key]);
            const isUp = change >= 0;
            const spark = sparkData[card.key] || [];
            const sparkChartData = spark.map((v, i) => ({ v }));
            return (
              <motion.div key={card.key} variants={item} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                <Card className={`bg-gradient-to-br ${card.gradient} border-border/50 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden`}>
                  <CardContent className="p-5 relative">
                    <div className="flex items-start justify-between">
                      <div className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                        <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                      <div className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-emerald-400" : "text-destructive"}`}>
                        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(change)}%
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-bold">{loading ? "—" : (animValues as any)[card.key]?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                    </div>
                    {/* Sparkline */}
                    {sparkChartData.length > 0 && (
                      <div className="absolute bottom-0 right-0 w-24 h-12 opacity-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sparkChartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <defs>
                              <linearGradient id={`spark-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={card.sparkColor} stopOpacity={0.6} />
                                <stop offset="100%" stopColor={card.sparkColor} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke={card.sparkColor} strokeWidth={1.5} fill={`url(#spark-${card.key})`} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* System Health + Live Session */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={item}>
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Database</span>
                  <Badge variant="secondary" className="ml-auto text-emerald-400 bg-emerald-500/10">Healthy</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">Realtime Connections</span>
                  <Badge variant="secondary" className="ml-auto">Active</Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><HardDrive className="w-3.5 h-3.5" /> Storage Buckets</span>
                    <span className="text-muted-foreground">4 active</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><Database className="w-3.5 h-3.5" /> Database Tables</span>
                    <span className="text-muted-foreground">24 tables</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Radio className="w-4 h-4 text-red-400" /> Live Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {scheduledSession ? (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Next Scheduled Session</span>
                    </div>
                    <p className="text-lg font-bold">{format(new Date(scheduledSession), "MMM d, yyyy 'at' h:mm a")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(scheduledSession), { addSuffix: true })}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground">No session scheduled</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 gap-1" onClick={() => navigate("/admin/live-stream")}>
                    <Radio className="w-3.5 h-3.5" /> Manage Stream
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => navigate("/admin/live-stream")}>
                    <Calendar className="w-3.5 h-3.5" /> Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={item} className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-base">7-Day Trends</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Line type="monotone" dataKey="users" stroke="hsl(210,70%,50%)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="forecasts" stroke="hsl(154,89%,16%)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="h-full">
              <CardHeader><CardTitle className="text-base">Platform Overview</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3} animationDuration={800}>
                      {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {donutData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom row: Top Users + Recent Messages + Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div variants={item}>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> Top Users</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {topUsers.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
                {topUsers.map((user, i) => (
                  <motion.div key={user.user_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-3">
                    <div className="w-6 flex justify-center">{i < 3 ? medalIcons[i] : <span className="text-xs text-muted-foreground font-medium">#{i + 1}</span>}</div>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{(user.full_name || "U")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user.count} forecasts</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4 text-purple-400" /> Recent Messages</CardTitle>
                <Link to="/admin/contact"><Button variant="ghost" size="sm" className="text-xs gap-1"><Eye className="w-3 h-3" /> View All</Button></Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentMessages.length === 0 && <p className="text-sm text-muted-foreground">No open messages</p>}
                {recentMessages.map((msg, i) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{msg.subject || msg.name}</p>
                      <p className="text-xs text-muted-foreground">by {msg.name} · {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</p>
                    </div>
                    <Badge variant={msg.priority === "high" ? "destructive" : "secondary"} className="text-[10px] shrink-0">{msg.priority || "normal"}</Badge>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-400" /> Upcoming Events</CardTitle>
                <Link to="/admin/calendar-events"><Button variant="ghost" size="sm" className="text-xs gap-1"><Eye className="w-3 h-3" /> View All</Button></Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events</p>}
                {upcomingEvents.map((evt, i) => (
                  <motion.div key={evt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-blue-400">{format(new Date(evt.event_date), "MMM")}</span>
                      <span className="text-sm font-bold leading-none">{format(new Date(evt.event_date), "d")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{evt.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">{evt.category}</Badge>
                        <Badge variant={evt.impact === "high" ? "destructive" : "secondary"} className="text-[10px]">{evt.impact}</Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Activity Feed + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Feed */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Recent Activity
                  <div className="ml-auto flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground font-normal">Live</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activityFeed.length === 0 && <p className="text-sm text-muted-foreground">No recent activity</p>}
                {activityFeed.map((act, i) => (
                  <motion.div
                    key={`${act.type}-${act.id}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-muted/80 flex items-center justify-center shrink-0">
                      {activityIcon(act.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{act.text}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(act.time), { addSuffix: true })}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions Grid */}
          <motion.div variants={item}>
            <Card>
              <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {quickActions.map((action) => (
                    <Link key={action.to} to={action.to}>
                      <Button variant={action.variant} size="sm" className="w-full h-auto flex-col gap-2 py-4 hover:scale-[1.02] transition-transform">
                        <action.icon className="w-5 h-5" />
                        <span className="text-xs">{action.label}</span>
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
