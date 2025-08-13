import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Heart, MessageSquare } from "lucide-react";

interface AnalyticsData {
  userGrowth: Array<{ name: string; value: number; date: string }>;
  forecastTrends: Array<{ name: string; value: number; date: string }>;
  engagement: Array<{ name: string; likes: number; comments: number; date: string }>;
  forecastTypes: Array<{ name: string; value: number; color: string }>;
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    userGrowth: [],
    forecastTrends: [],
    engagement: [],
    forecastTypes: []
  });
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserGrowth(),
        loadForecastTrends(),
        loadEngagement(),
        loadForecastTypes()
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  const getDaysArray = () => {
    const days = timeRange === 'day' ? 7 : timeRange === 'week' ? 8 : 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date;
    });
  };

  const loadUserGrowth = async () => {
    const days = getDaysArray();
    const growthData = [];

    for (const date of days) {
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', dateStr)
        .lt('created_at', nextDateStr);

      growthData.push({
        name: date.toLocaleDateString('en', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: count || 0,
        date: dateStr
      });
    }

    setData(prev => ({ ...prev, userGrowth: growthData }));
  };

  const loadForecastTrends = async () => {
    const days = getDaysArray();
    const trendData = [];

    for (const date of days) {
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      const { count } = await supabase
        .from('forecasts')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', dateStr)
        .lt('created_at', nextDateStr);

      trendData.push({
        name: date.toLocaleDateString('en', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: count || 0,
        date: dateStr
      });
    }

    setData(prev => ({ ...prev, forecastTrends: trendData }));
  };

  const loadEngagement = async () => {
    const days = getDaysArray();
    const engagementData = [];

    for (const date of days) {
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      const [likesResult, commentsResult] = await Promise.all([
        supabase
          .from('forecast_likes')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', dateStr)
          .lt('created_at', nextDateStr),
        supabase
          .from('forecast_comments')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', dateStr)
          .lt('created_at', nextDateStr)
      ]);

      engagementData.push({
        name: date.toLocaleDateString('en', { 
          month: 'short', 
          day: 'numeric' 
        }),
        likes: likesResult.count || 0,
        comments: commentsResult.count || 0,
        date: dateStr
      });
    }

    setData(prev => ({ ...prev, engagement: engagementData }));
  };

  const loadForecastTypes = async () => {
    const [arovaResult, publicResult] = await Promise.all([
      supabase
        .from('forecasts')
        .select('id', { count: 'exact', head: true })
        .eq('forecast_type', 'arova'),
      supabase
        .from('forecasts')
        .select('id', { count: 'exact', head: true })
        .eq('forecast_type', 'public')
    ]);

    const typeData = [
      { 
        name: 'Arova Forecasts', 
        value: arovaResult.count || 0, 
        color: 'hsl(var(--primary))' 
      },
      { 
        name: 'User Forecasts', 
        value: publicResult.count || 0, 
        color: 'hsl(var(--secondary))' 
      }
    ];

    setData(prev => ({ ...prev, forecastTypes: typeData }));
  };

  const StatCard = ({ title, value, icon, trend }: { 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    trend?: number;
  }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {trend !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend > 0 ? '+' : ''}{trend}% vs last period
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <SEO title="Admin Analytics | Arova" description="Comprehensive analytics dashboard with user growth, engagement metrics, and forecast trends." />
      <motion.section 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-2xl font-semibold mb-6">Analytics Dashboard</h1>
        
        {/* Time Range Selector */}
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="day">Last 7 Days</TabsTrigger>
            <TabsTrigger value="week">Last 8 Weeks</TabsTrigger>
            <TabsTrigger value="month">Last 30 Days</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Users"
            value={data.userGrowth.reduce((sum, day) => sum + day.value, 0)}
            icon={<Users className="w-4 h-4 text-primary" />}
          />
          <StatCard
            title="Total Forecasts"
            value={data.forecastTrends.reduce((sum, day) => sum + day.value, 0)}
            icon={<TrendingUp className="w-4 h-4 text-primary" />}
          />
          <StatCard
            title="Total Likes"
            value={data.engagement.reduce((sum, day) => sum + day.likes, 0)}
            icon={<Heart className="w-4 h-4 text-primary" />}
          />
          <StatCard
            title="Total Comments"
            value={data.engagement.reduce((sum, day) => sum + day.comments, 0)}
            icon={<MessageSquare className="w-4 h-4 text-primary" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.userGrowth}>
                  <defs>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#userGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forecast Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.forecastTrends}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.engagement}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="likes" 
                    stackId="1"
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="comments" 
                    stackId="1"
                    stroke="hsl(var(--accent))" 
                    fill="hsl(var(--accent))" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forecast Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.forecastTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
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
      </motion.section>
    </>
  );
}
