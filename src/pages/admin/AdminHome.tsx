import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Heart, MessageSquare } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { Link } from "react-router-dom";

interface Stats {
  totalUsers: number;
  activeForecasts: number;
  likesToday: number;
  unreadMessages: number;
}

interface ChartData {
  name: string;
  users: number;
  forecasts: number;
  likes: number;
}

interface ActivityItem {
  id: string;
  type: 'user' | 'forecast' | 'like' | 'message';
  content: string;
  time: string;
}

export default function AdminHome() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeForecasts: 0,
    likesToday: 0,
    unreadMessages: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const greeting = new Intl.DateTimeFormat(undefined, { 
    hour: 'numeric', 
    hour12: true 
  }).format(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Set up realtime subscriptions
    const channel = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forecasts' }, () => {
        loadStats();
        loadChartData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forecast_likes' }, () => {
        loadStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => {
        loadStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboardData = async () => {
    await Promise.all([
      loadStats(),
      loadChartData(),
      loadActivity()
    ]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [usersResult, forecastsResult, likesResult, messagesResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('forecasts').select('id', { count: 'exact', head: true }),
        supabase.from('forecast_likes').select('id', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'open')
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        activeForecasts: forecastsResult.count || 0,
        likesToday: likesResult.count || 0,
        unreadMessages: messagesResult.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadChartData = async () => {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const chartPromises = last7Days.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];

        const [usersResult, forecastsResult, likesResult] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true })
            .gte('created_at', date).lt('created_at', nextDateStr),
          supabase.from('forecasts').select('id', { count: 'exact', head: true })
            .gte('created_at', date).lt('created_at', nextDateStr),
          supabase.from('forecast_likes').select('id', { count: 'exact', head: true })
            .gte('created_at', date).lt('created_at', nextDateStr)
        ]);

        return {
          name: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
          users: usersResult.count || 0,
          forecasts: forecastsResult.count || 0,
          likes: likesResult.count || 0
        };
      });

      const data = await Promise.all(chartPromises);
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const loadActivity = async () => {
    try {
      const activities: ActivityItem[] = [];

      // Recent users
      const { data: users } = await supabase
        .from('profiles')
        .select('full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Recent forecasts
      const { data: forecasts } = await supabase
        .from('forecasts')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      if (users) {
        users.forEach((user) => {
          activities.push({
            id: `user-${user.created_at}`,
            type: 'user',
            content: `${user.full_name || 'New user'} joined`,
            time: new Date(user.created_at).toLocaleString()
          });
        });
      }

      if (forecasts) {
        forecasts.forEach((forecast) => {
          activities.push({
            id: `forecast-${forecast.created_at}`,
            type: 'forecast',
            content: `New forecast: ${forecast.title || 'Untitled'}`,
            time: new Date(forecast.created_at).toLocaleString()
          });
        });
      }

      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="w-4 h-4" />;
      case 'forecast': return <TrendingUp className="w-4 h-4" />;
      case 'like': return <Heart className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const statsCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="w-5 h-5 text-primary" />,
      link: "/admin/users"
    },
    {
      title: "Active Forecasts", 
      value: stats.activeForecasts,
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
      link: "/admin/content"
    },
    {
      title: "Likes Today",
      value: stats.likesToday,
      icon: <Heart className="w-5 h-5 text-primary" />,
      link: "/admin/analytics"
    },
    {
      title: "Unread Messages",
      value: stats.unreadMessages,
      icon: <MessageSquare className="w-5 h-5 text-primary" />,
      link: "/admin/contact"
    }
  ];

  return (
    <>
      <SEO title="Admin Dashboard | Arova" description="Real-time admin dashboard with live stats and analytics" />
      <motion.section 
        initial={{ opacity: 0, y: 8 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-2xl md:text-3xl font-semibold mb-6">
          Good {greeting}, Admin 👋
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((card, idx) => (
            <Link key={idx} to={card.link}>
              <Card className="hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                    {card.icon}
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <div className="w-8 h-8 animate-pulse bg-muted rounded" />
                    ) : (
                      card.value.toLocaleString()
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Live data</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>7-Day Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'hsl(var(--popover))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="forecasts" stroke="hsl(var(--secondary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="likes" stroke="hsl(var(--accent))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-6 h-6 bg-muted rounded" />
                    <div className="flex-1 space-y-1">
                      <div className="w-3/4 h-4 bg-muted rounded" />
                      <div className="w-1/2 h-3 bg-muted rounded" />
                    </div>
                  </div>
                ))
              ) : activity.length > 0 ? (
                activity.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="text-muted-foreground mt-0.5">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.content}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3 flex-wrap">
            <Link to="/admin/notifications">
              <Button size="sm">Send Notification</Button>
            </Link>
            <Link to="/admin/analytics">
              <Button size="sm" variant="secondary">View Reports</Button>
            </Link>
            <Link to="/admin/content">
              <Button size="sm" variant="outline">Manage Content</Button>
            </Link>
          </CardContent>
        </Card>
      </motion.section>
    </>
  );
}
