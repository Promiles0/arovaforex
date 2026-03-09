import { motion } from "framer-motion";

const row1 = [
  "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD",
  "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY", "USD/CHF",
  "EUR/AUD", "GBP/AUD", "AUD/JPY", "CAD/JPY", "CHF/JPY",
];

const row2 = [
  "XAU/USD", "XAG/USD", "BTC/USD", "ETH/USD", "US30",
  "NAS100", "SPX500", "UK100", "GER40", "JPN225",
  "USOIL", "UKOIL", "EUR/CHF", "GBP/CHF", "AUD/NZD",
];

const PairBadge = ({ pair }: { pair: string }) => (
  <span className="inline-flex items-center px-5 py-2.5 rounded-full bg-card/80 border border-border/50 text-sm font-medium text-foreground whitespace-nowrap backdrop-blur-sm hover:border-primary/30 transition-colors duration-200">
    <span className="w-1.5 h-1.5 rounded-full bg-success mr-2.5 animate-pulse" />
    {pair}
  </span>
);

const TickerRow = ({ pairs, reverse = false }: { pairs: string[]; reverse?: boolean }) => {
  const doubled = [...pairs, ...pairs];

  return (
    <div className="relative overflow-hidden">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

      <motion.div
        className="flex gap-4"
        animate={{ x: reverse ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{
          x: {
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        {doubled.map((pair, i) => (
          <PairBadge key={`${pair}-${i}`} pair={pair} />
        ))}
      </motion.div>
    </div>
  );
};

export const SupportedMarkets = () => {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Supported Markets</h2>
          <p className="text-xl text-muted-foreground">Forex, commodities, indices, and crypto — all in one platform</p>
        </motion.div>

        <div className="space-y-4 max-w-7xl mx-auto">
          <TickerRow pairs={row1} />
          <TickerRow pairs={row2} reverse />
        </div>
      </div>
    </section>
  );
};
