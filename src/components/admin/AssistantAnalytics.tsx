import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageSquare, Users, Target, TrendingUp, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface AnalyticsData {
  total_conversations: number;
  total_messages: number;
  matched_messages: number;
  unmatched_messages: number;
  unique_users: number;
  top_intents: { intent: string; count: number }[];
  daily_usage: { date: string; messages: number; sessions: number }[];
  unmatched_queries: { id: string; query: string; created_at: string; user_id: string }[];
}

interface AssistantAnalyticsProps {
  onAddToKnowledgeBase?: (query: string) => void;
}

export const AssistantAnalytics = ({ onAddToKnowledgeBase }: AssistantAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timePeriod]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_assistant_analytics', {
        p_days: parseInt(timePeriod),
      });

      if (error) throw error;
      setAnalytics(data as unknown as AnalyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const matchRate = analytics
    ? analytics.matched_messages + analytics.unmatched_messages > 0
      ? ((analytics.matched_messages / (analytics.matched_messages + analytics.unmatched_messages)) * 100).toFixed(1)
      : '0'
    : '0';

  const chartColors = {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    muted: 'hsl(var(--muted))',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Conversation Analytics</h2>
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analytics?.total_conversations || 0}</p>
                <p className="text-sm text-muted-foreground">Conversations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analytics?.total_messages || 0}</p>
                <p className="text-sm text-muted-foreground">User Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{matchRate}%</p>
                <p className="text-sm text-muted-foreground">Match Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analytics?.unique_users || 0}</p>
                <p className="text-sm text-muted-foreground">Unique Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.daily_usage && analytics.daily_usage.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={analytics.daily_usage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    name="Messages"
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="hsl(142.1 76.2% 36.3%)"
                    fill="hsl(142.1 76.2% 36.3% / 0.2)"
                    name="Sessions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No usage data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Intents Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.top_intents && analytics.top_intents.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.top_intents} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    dataKey="intent"
                    type="category"
                    width={100}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickFormatter={(value) => value.replace(/_/g, ' ')}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                    {analytics.top_intents.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? 'hsl(var(--primary))' : `hsl(var(--primary) / ${1 - index * 0.08})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No intent data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unmatched Queries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Unmatched Queries
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {analytics?.unmatched_queries?.length || 0} queries need attention
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {analytics?.unmatched_queries && analytics.unmatched_queries.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Query</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.unmatched_queries.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.query}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(item.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAddToKnowledgeBase?.(item.query)}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Add to KB
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mb-2 opacity-50" />
              <p>No unmatched queries!</p>
              <p className="text-sm">Your knowledge base is covering all questions.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
