import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, TrendingUp, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface ClosedSignal {
  id: string;
  currency_pair: string;
  signal_type: string;
  outcome: string | null;
  pips_gained: number | null;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  closed_at: string | null;
  created_at: string;
}

export const SignalPreview = () => {
  const [signals, setSignals] = useState<ClosedSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClosedSignals = async () => {
      const { data } = await supabase
        .from('trading_signals')
        .select('id, currency_pair, signal_type, outcome, pips_gained, entry_price, stop_loss, take_profit, closed_at, created_at')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(3);
      setSignals(data || []);
      setLoading(false);
    };
    fetchClosedSignals();
  }, []);

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    pricingSection?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return null;
  if (signals.length === 0) {
    return (
      <div className="mb-12 text-center py-12">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">Recent Signal Performance</h2>
        <p className="text-muted-foreground">Signal results will appear here once our analysts publish and close signals.</p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">Recent Signal Performance</h2>
        <p className="text-muted-foreground">See what our premium members are receiving</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {signals.map((signal, index) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-card/50 backdrop-blur border border-border rounded-2xl p-6 hover:border-primary/50 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  signal.outcome === 'win' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                }`}>
                  {signal.signal_type === 'BUY' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{signal.currency_pair}</div>
                  <div className="text-sm text-muted-foreground">{signal.signal_type}</div>
                </div>
              </div>
              {signal.pips_gained != null && (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  signal.pips_gained >= 0 ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                }`}>
                  {signal.pips_gained >= 0 ? '+' : ''}{signal.pips_gained} pips
                </div>
              )}
            </div>

            {/* Blurred details for non-premium */}
            <div className="space-y-2 mb-4 relative">
              <div className="absolute inset-0 backdrop-blur-sm bg-background/60 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <Lock className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-foreground font-semibold text-sm">Premium Only</p>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Entry:</span>
                <span className="text-foreground font-mono">{signal.entry_price}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stop Loss:</span>
                <span className="text-destructive font-mono">{signal.stop_loss}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Take Profit:</span>
                <span className="text-success font-mono">{signal.take_profit}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Closed {signal.closed_at ? formatDistanceToNow(new Date(signal.closed_at), { addSuffix: true }) : 'recently'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-8"
      >
        <button
          onClick={scrollToPricing}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
        >
          Unlock Full Signal Details
        </button>
      </motion.div>
    </div>
  );
};
