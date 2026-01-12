import { motion } from "framer-motion";
import { format, subMonths } from "date-fns";

interface MonthlyPerformance {
  month: Date;
  win_rate: number;
  total_signals: number;
  total_pips: number;
}

export const PerformanceMetrics = () => {
  // Sample performance data for last 6 months
  const metrics: MonthlyPerformance[] = Array.from({ length: 6 }, (_, i) => ({
    month: subMonths(new Date(), i),
    win_rate: Math.floor(Math.random() * 15) + 65, // 65-80%
    total_signals: Math.floor(Math.random() * 15) + 20,
    total_pips: Math.floor(Math.random() * 300) + 300,
  })).reverse();

  const getWinRateColor = (rate: number) => {
    if (rate >= 70) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-br from-card/80 to-muted/30 backdrop-blur border border-border rounded-3xl p-6 lg:p-8 mb-12"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
          Proven Track Record
        </h2>
        <p className="text-muted-foreground">
          Transparent performance metrics from the last 6 months
        </p>
      </div>

      {/* Monthly Performance Chart */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {metrics.map((month, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="bg-card/50 rounded-xl p-4 border border-border text-center"
          >
            <div className="text-xs text-muted-foreground mb-2">
              {format(month.month, 'MMM yyyy')}
            </div>
            <div className={`text-2xl font-bold mb-1 ${getWinRateColor(month.win_rate)}`}>
              {month.win_rate}%
            </div>
            <div className="text-xs text-muted-foreground">
              {month.total_signals} signals
            </div>
            <div className="text-xs text-success font-semibold">
              +{month.total_pips} pips
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="text-3xl lg:text-4xl font-bold text-success mb-2">72%</div>
          <div className="text-sm text-muted-foreground">Overall Win Rate</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="text-3xl lg:text-4xl font-bold text-success mb-2">+2,450</div>
          <div className="text-sm text-muted-foreground">Total Pips (6m)</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <div className="text-3xl lg:text-4xl font-bold text-success mb-2">156</div>
          <div className="text-sm text-muted-foreground">Signals Delivered</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="text-3xl lg:text-4xl font-bold text-success mb-2">1:2.8</div>
          <div className="text-sm text-muted-foreground">Avg R:R Ratio</div>
        </motion.div>
      </div>
    </motion.div>
  );
};
