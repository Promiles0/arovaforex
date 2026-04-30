import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Heart, MessageSquare, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { VisitorsTab } from "@/components/admin/VisitorsTab";

interface AnalyticsData {
  userGrowth: Array<{ name: string; value: number; date: string }>;
  forecastTrends: Array<{ name: string; value: number; date: string }>;
  engagement: Array<{ name: string; likes: number; comments: number; date: string }>;
  forecastTypes: Array<{ name: string; value: number; color: string }>;
}

const gradientStatCards = [
  { key: "users", label: "New Users", icon: Users, gradient: "from-blue-500/20 to-blue-600/5", iconBg: "bg-blue-500/20", iconColor: "text-blue-400" },
  { key: "forecasts", label: "New Forecasts", icon: TrendingUp, gradient: "from-emerald-500/20 to-emerald-600/5", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
  { key: "likes", label: "Total Likes", icon: Heart, gradient: "from-pink-500/20 to-pink-600/5", iconBg: "bg-pink-500/20", iconColor: "text-pink-400" },
  { key: "comments", label: "Total Comments", icon: MessageSquare, gradient: "from-purple-500/20 to-purple-600/5", iconBg: "bg-purple-500/20", iconColor: "text-purple-400" },
];

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData>({ userGrowth: [], forecastTrends: [], engagement: [], forecastTypes: [] });
  const [prevPeriodTotals, setPrevPeriodTotals] = useState({ users: 0, forecasts: 0, likes: 0, comments: 0 });
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalyticsData(); }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    await Promise.all([loadUserGrowth(), loadForecastTrends(), loadEngagement(), loadForecastTypes()]);
    setLoading(false);
  };

  const getDaysCount = () => timeRange === 'day' ? 7 : timeRange === 'week' ? 8 : 30;

  const getDaysArray = () => {
    const days = getDaysCount();
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() - (days - 1 - i));
      return date;
    });
  };

  const loadUserGrowth = async () => {
    const days = getDaysArray();
    const growthData = await Promise.all(days.map(async (date) => {
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date); nextDate.setDate(nextDate.getDate() + 1);
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', dateStr).lt('created_at', nextDate.toISOString().split('T')[0]);
      return { name: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }), value: count || 0, date: dateStr };
    }));
    setData(prev => ({ ...prev, userGrowth: growthData }));

    // Previous period
    const daysCount = getDaysCount();
    const prevStart = new Date(); prevStart.setDate(prevStart.getDate() - daysCount * 2);
    const prevEnd = new Date(); prevEnd.setDate(prevEnd.getDate() - daysCount);
    const { count: prevUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', prevStart.toISOString().split('T')[0]).lt('created_at', prevEnd.toISOString().split('T')[0]);
    setPrevPeriodTotals(prev => ({ ...prev, users: prevUsers || 0 }));
  };

  const loadForecastTrends = async () => {
    const days = getDaysArray();
    const trendData = await Promise.all(days.map(async (date) => {
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date); nextDate.setDate(nextDate.getDate() + 1);
      const { count } = await supabase.from('forecasts').select('id', { count: 'exact', head: true }).gte('created_at', dateStr).lt('created_at', nextDate.toISOString().split('T')[0]);
      return { name: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }), value: count || 0, date: dateStr };
    }));
    setData(prev => ({ ...prev, forecastTrends: trendData }));

    const daysCount = getDaysCount();
    const prevStart = new Date(); prevStart.setDate(prevStart.getDate() - daysCount * 2);
    const prevEnd = new Date(); prevEnd.setDate(prevEnd.getDate() - daysCount);
    const { count: prevForecasts } = await supabase.from('forecasts').select('id', { count: 'exact', head: true }).gte('created_at', prevStart.toISOString().split('T')[0]).lt('created_at', prevEnd.toISOString().split('T')[0]);
    setPrevPeriodTotals(prev => ({ ...prev, forecasts: prevForecasts || 0 }));
  };

  const loadEngagement = async () => {
    const days = getDaysArray();
    const engagementData = await Promise.all(days.map(async (date) => {
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date); nextDate.setDate(nextDate.getDate() + 1);
      const [likesResult, commentsResult] = await Promise.all([
        supabase.from('forecast_likes').select('id', { count: 'exact', head: true }).gte('created_at', dateStr).lt('created_at', nextDate.toISOString().split('T')[0]),
        supabase.from('forecast_comments').select('id', { count: 'exact', head: true }).gte('created_at', dateStr).lt('created_at', nextDate.toISOString().split('T')[0]),
      ]);
      return { name: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }), likes: likesResult.count || 0, comments: commentsResult.count || 0, date: dateStr };
    }));
    setData(prev => ({ ...prev, engagement: engagementData }));

    const daysCount = getDaysCount();
    const prevStart = new Date(); prevStart.setDate(prevStart.getDate() - daysCount * 2);
    const prevEnd = new Date(); prevEnd.setDate(prevEnd.getDate() - daysCount);
    const [pl, pc] = await Promise.all([
      supabase.from('forecast_likes').select('id', { count: 'exact', head: true }).gte('created_at', prevStart.toISOString().split('T')[0]).lt('created_at', prevEnd.toISOString().split('T')[0]),
      supabase.from('forecast_comments').select('id', { count: 'exact', head: true }).gte('created_at', prevStart.toISOString().split('T')[0]).lt('created_at', prevEnd.toISOString().split('T')[0]),
    ]);
    setPrevPeriodTotals(prev => ({ ...prev, likes: pl.count || 0, comments: pc.count || 0 }));
  };

  const loadForecastTypes = async () => {
    const [arovaResult, publicResult] = await Promise.all([
      supabase.from('forecasts').select('id', { count: 'exact', head: true }).eq('forecast_type', 'arova'),
      supabase.from('forecasts').select('id', { count: 'exact', head: true }).eq('forecast_type', 'public'),
    ]);
    setData(prev => ({
      ...prev,
      forecastTypes: [
        { name: 'Arova Forecasts', value: arovaResult.count || 0, color: 'hsl(var(--primary))' },
        { name: 'User Forecasts', value: publicResult.count || 0, color: 'hsl(var(--secondary))' },
      ]
    }));
  };

  const totals = {
    users: data.userGrowth.reduce((s, d) => s + d.value, 0),
    forecasts: data.forecastTrends.reduce((s, d) => s + d.value, 0),
    likes: data.engagement.reduce((s, d) => s + d.likes, 0),
    comments: data.engagement.reduce((s, d) => s + d.comments, 0),
  };

  const getChange = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  };

  const changes = {
    users: getChange(totals.users, prevPeriodTotals.users),
    forecasts: getChange(totals.forecasts, prevPeriodTotals.forecasts),
    likes: getChange(totals.likes, prevPeriodTotals.likes),
    comments: getChange(totals.comments, prevPeriodTotals.comments),
  };

  return (
    <>
      <SEO title="Admin Analytics | Arova" description="Analytics dashboard" />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
            <Badge variant="secondary" className="gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time
            </Badge>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2"><BarChart3 className="w-4 h-4" /> Overview</TabsTrigger>
            <TabsTrigger value="visitors" className="gap-2"><Globe className="w-4 h-4" /> Visitors</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
              <TabsList>
                <TabsTrigger value="day">Last 7 Days</TabsTrigger>
                <TabsTrigger value="week">Last 8 Weeks</TabsTrigger>
                <TabsTrigger value="month">Last 30 Days</TabsTrigger>
              </TabsList>
            </Tabs>

        {/* Gradient Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {gradientStatCards.map((card) => {
            const value = totals[card.key as keyof typeof totals];
            const change = changes[card.key as keyof typeof changes];
            const isUp = change >= 0;
            return (
              <motion.div key={card.key} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
                <Card className={`bg-gradient-to-br ${card.gradient} border-border/50 hover:shadow-lg transition-shadow`}>
                  <CardContent className="p-5">
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
                      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">vs previous period</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader><CardTitle>User Growth</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.userGrowth}>
                  <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#userGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Forecast Trends</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.forecastTrends}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Engagement Metrics</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.engagement}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="likes" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="comments" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Forecast Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.forecastTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {data.forecastTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="visitors" className="mt-6">
            <VisitorsTab />
          </TabsContent>
        </Tabs>
      </motion.section>
    </>
  );
}
