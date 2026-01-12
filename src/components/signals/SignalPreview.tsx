import { motion } from "framer-motion";
import { Lock, TrendingUp, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SampleSignal {
  id: string;
  currency_pair: string;
  signal_type: "BUY" | "SELL";
  outcome: "win" | "loss";
  pips_gained: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  closed_at: string;
}

export const SignalPreview = () => {
  // Sample closed signals for preview
  const sampleSignals: SampleSignal[] = [
    {
      id: "1",
      currency_pair: "EUR/USD",
      signal_type: "BUY",
      outcome: "win",
      pips_gained: 45,
      entry_price: 1.0850,
      stop_loss: 1.0820,
      take_profit: 1.0895,
      closed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      currency_pair: "GBP/JPY",
      signal_type: "SELL",
      outcome: "win",
      pips_gained: 72,
      entry_price: 185.50,
      stop_loss: 186.20,
      take_profit: 184.78,
      closed_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      currency_pair: "USD/CAD",
      signal_type: "BUY",
      outcome: "loss",
      pips_gained: -28,
      entry_price: 1.3420,
      stop_loss: 1.3392,
      take_profit: 1.3500,
      closed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    pricingSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
          Recent Signal Performance
        </h2>
        <p className="text-muted-foreground">
          See what our premium members are receiving
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sampleSignals.map((signal, index) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-card/50 backdrop-blur border border-border rounded-2xl p-6 hover:border-primary/50 transition-all group"
          >
            {/* Signal Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  signal.outcome === 'win' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                }`}>
                  {signal.signal_type === 'BUY' ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <TrendingDown className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">{signal.currency_pair}</div>
                  <div className="text-sm text-muted-foreground">{signal.signal_type}</div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                signal.outcome === 'win' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
              }`}>
                {signal.outcome === 'win' ? '+' : ''}{signal.pips_gained} pips
              </div>
            </div>

            {/* Signal Details (Blurred for Free Users) */}
            <div className="space-y-2 mb-4 relative">
              {/* Blur Overlay */}
              <div className="absolute inset-0 backdrop-blur-sm bg-background/60 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <Lock className="w-6 h-6 text-premium mx-auto mb-2" />
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

            {/* Outcome */}
            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Closed {formatDistanceToNow(new Date(signal.closed_at))} ago
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Upgrade CTA */}
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
