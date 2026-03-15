import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Signal, TrendingUp, TrendingDown, Lock, Clock, Target, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SignalsHero,
  SignalPreview,
  SignalsFeatures,
  PerformanceMetrics,
  SignalsTestimonials,
  SignalsPricing,
  SignalsFAQ,
  SignalsFinalCTA,
} from "@/components/signals";

interface TradingSignal {
  id: string;
  currency_pair: string;
  signal_type: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  take_profit_2: number | null;
  take_profit_3: number | null;
  confidence: string;
  status: string;
  outcome: string | null;
  pips_gained: number | null;
  analysis: string | null;
  timeframe: string | null;
  created_at: string;
  closed_at: string | null;
}

export default function PremiumSignals() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
    fetchSignals();

    const channel = supabase
      .channel('user-signals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trading_signals' }, () => fetchSignals())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const checkSubscription = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();
    setIsPremium(data?.subscription_tier === 'premium' || data?.subscription_tier === 'professional');
  };

  const fetchSignals = async () => {
    const { data, error } = await supabase
      .from('trading_signals')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setSignals(data || []);
    setLoading(false);
  };

  const activeSignals = signals.filter(s => s.status === 'active');
  const closedSignals = signals.filter(s => s.status === 'closed');

  const getConfidenceColor = (c: string) => {
    if (c === 'high') return 'bg-success/10 text-success border-success/20';
    if (c === 'medium') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-destructive/10 text-destructive border-destructive/20';
  };

  // Non-premium: show landing page with real closed signals as previews
  if (!isPremium) {
    return (
      <div className="space-y-6 pb-12">
        <SignalsHero />
        <SignalPreview />
        <SignalsFeatures />
        <PerformanceMetrics />
        <SignalsTestimonials />
        <SignalsPricing />
        <SignalsFAQ />
        <SignalsFinalCTA />
      </div>
    );
  }

  // Premium user view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Signal className="w-6 h-6 text-primary" />
            Premium Trading Signals
          </h1>
          <p className="text-muted-foreground mt-1">Live signals with real-time updates</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20">Premium Member</Badge>
      </div>

      {/* Active Signals */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Active Signals ({activeSignals.length})
        </h2>
        {activeSignals.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="text-center py-12">
              <Signal className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">No active signals</h3>
              <p className="text-muted-foreground text-sm">New signals will appear here in real time</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSignals.map((signal, i) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${signal.signal_type === 'BUY' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                          {signal.signal_type === 'BUY' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{signal.currency_pair}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={signal.signal_type === 'BUY' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                          {signal.signal_type}
                        </Badge>
                        <Badge className={getConfidenceColor(signal.confidence)}>
                          {signal.confidence}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-muted-foreground uppercase">Entry</div>
                        <div className="font-mono font-bold text-sm">{signal.entry_price}</div>
                      </div>
                      <div className="bg-destructive/10 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-destructive uppercase flex items-center justify-center gap-1"><ShieldAlert className="w-3 h-3" />SL</div>
                        <div className="font-mono font-bold text-sm text-destructive">{signal.stop_loss}</div>
                      </div>
                      <div className="bg-success/10 rounded-lg p-2.5 text-center">
                        <div className="text-[10px] text-success uppercase flex items-center justify-center gap-1"><Target className="w-3 h-3" />TP</div>
                        <div className="font-mono font-bold text-sm text-success">{signal.take_profit}</div>
                      </div>
                    </div>

                    {(signal.take_profit_2 || signal.take_profit_3) && (
                      <div className="flex gap-2 mb-3">
                        {signal.take_profit_2 && <div className="flex-1 bg-success/5 rounded p-2 text-center"><div className="text-[10px] text-muted-foreground">TP2</div><div className="font-mono text-sm text-success">{signal.take_profit_2}</div></div>}
                        {signal.take_profit_3 && <div className="flex-1 bg-success/5 rounded p-2 text-center"><div className="text-[10px] text-muted-foreground">TP3</div><div className="font-mono text-sm text-success">{signal.take_profit_3}</div></div>}
                      </div>
                    )}

                    {signal.analysis && (
                      <p className="text-sm text-muted-foreground border-t border-border/50 pt-3 mt-2">{signal.analysis}</p>
                    )}

                    {signal.timeframe && (
                      <div className="text-xs text-muted-foreground mt-2">Timeframe: {signal.timeframe}</div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Closed Signals */}
      {closedSignals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Results</h2>
          <div className="space-y-2">
            {closedSignals.slice(0, 10).map(signal => (
              <div key={signal.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${signal.outcome === 'win' ? 'bg-success/20 text-success' : signal.outcome === 'loss' ? 'bg-destructive/20 text-destructive' : 'bg-muted/30 text-muted-foreground'}`}>
                    {signal.signal_type === 'BUY' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-medium">{signal.currency_pair}</span>
                    <span className="text-xs text-muted-foreground ml-2">{signal.signal_type} · {signal.timeframe}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {signal.pips_gained != null && (
                    <span className={`font-bold ${signal.pips_gained >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {signal.pips_gained >= 0 ? '+' : ''}{signal.pips_gained} pips
                    </span>
                  )}
                  <Badge variant="outline" className={`text-xs capitalize ${signal.outcome === 'win' ? 'border-success/30 text-success' : signal.outcome === 'loss' ? 'border-destructive/30 text-destructive' : ''}`}>
                    {signal.outcome || signal.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
