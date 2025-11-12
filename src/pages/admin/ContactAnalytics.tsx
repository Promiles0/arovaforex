import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  Clock, 
  MessageSquare, 
  TrendingUp,
  Users,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface AnalyticsData {
  totalMessages: number;
  openMessages: number;
  resolvedMessages: number;
  avgResponseTime: number;
  categoryDistribution: { [key: string]: number };
  responseTimesByAdmin: { adminId: string; avgTime: number; count: number }[];
  dailyMessages: { date: string; count: number }[];
}

export default function ContactAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalMessages: 0,
    openMessages: 0,
    resolvedMessages: 0,
    avgResponseTime: 0,
    categoryDistribution: {},
    responseTimesByAdmin: [],
    dailyMessages: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: messages, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!messages) return;

      // Calculate analytics
      const totalMessages = messages.length;
      const openMessages = messages.filter(m => m.status === 'open').length;
      const resolvedMessages = messages.filter(m => m.status === 'resolved').length;

      // Calculate average response time
      const resolvedWithTime = messages.filter(m => 
        m.status === 'resolved' && m.responded_at && m.created_at
      );
      
      const avgResponseTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((acc, m) => {
            const created = new Date(m.created_at).getTime();
            const responded = new Date(m.responded_at!).getTime();
            return acc + (responded - created);
          }, 0) / resolvedWithTime.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Category distribution
      const categoryDistribution = messages.reduce((acc, m) => {
        const cat = m.category || 'other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      // Daily messages (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentMessages = messages.filter(m => 
        new Date(m.created_at) >= thirtyDaysAgo
      );

      const dailyMessages = recentMessages.reduce((acc, m) => {
        const date = new Date(m.created_at).toLocaleDateString();
        const existing = acc.find(d => d.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as { date: string; count: number }[]);

      setAnalytics({
        totalMessages,
        openMessages,
        resolvedMessages,
        avgResponseTime,
        categoryDistribution,
        responseTimesByAdmin: [],
        dailyMessages
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contact Analytics</h1>
        <p className="text-muted-foreground">Performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Messages</p>
                <p className="text-3xl font-bold">{analytics.totalMessages}</p>
              </div>
              <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-blue-500" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Open</p>
                <p className="text-3xl font-bold text-orange-500">{analytics.openMessages}</p>
              </div>
              <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-7 h-7 text-orange-500" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Resolved</p>
                <p className="text-3xl font-bold text-green-500">{analytics.resolvedMessages}</p>
              </div>
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Response Time</p>
                <p className="text-3xl font-bold text-purple-500">
                  {formatResponseTime(analytics.avgResponseTime)}
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-500/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-purple-500" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Category Distribution */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Messages by Category
          </h2>
          <div className="space-y-4">
            {Object.entries(analytics.categoryDistribution).map(([category, count], index) => {
              const percentage = (count / analytics.totalMessages) * 100;
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      className="bg-primary h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.2 + 0.1 * index, duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Daily Messages Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Daily Messages (Last 30 Days)
          </h2>
          <div className="h-64 flex items-end gap-2">
            {analytics.dailyMessages.slice(-14).map((day, index) => {
              const maxCount = Math.max(...analytics.dailyMessages.map(d => d.count));
              const height = (day.count / maxCount) * 100;
              return (
                <motion.div
                  key={day.date}
                  className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors relative group"
                  style={{ height: `${height}%` }}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.date}: {day.count} messages
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
