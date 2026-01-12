import { motion } from "framer-motion";

interface Feature {
  icon: string;
  title: string;
  description: string;
  colorClass: string;
}

export const SignalsFeatures = () => {
  const features: Feature[] = [
    {
      icon: '🎯',
      title: 'Precise Entry Points',
      description: 'Exact price levels for optimal trade entries based on technical and fundamental analysis',
      colorClass: 'from-success/20 to-success/10',
    },
    {
      icon: '⚠️',
      title: 'Risk Management',
      description: 'Professional stop loss and take profit levels calculated for optimal risk-reward ratios',
      colorClass: 'from-warning/20 to-warning/10',
    },
    {
      icon: '⏰',
      title: 'Real-time Alerts',
      description: 'Instant notifications via Telegram and email when new signals are published',
      colorClass: 'from-blue-500/20 to-blue-500/10',
    },
    {
      icon: '📊',
      title: 'Detailed Analysis',
      description: 'In-depth market analysis explaining the reasoning behind each trading signal',
      colorClass: 'from-purple-500/20 to-purple-500/10',
    },
    {
      icon: '📈',
      title: 'Multiple Timeframes',
      description: 'Signals for scalping, day trading, and swing trading strategies',
      colorClass: 'from-pink-500/20 to-pink-500/10',
    },
    {
      icon: '🔔',
      title: 'Signal Updates',
      description: 'Real-time updates on open positions, including modifications and closures',
      colorClass: 'from-teal-500/20 to-teal-500/10',
    },
    {
      icon: '💬',
      title: 'Community Access',
      description: 'Exclusive Telegram group with fellow premium traders and analysts',
      colorClass: 'from-indigo-500/20 to-indigo-500/10',
    },
    {
      icon: '📚',
      title: 'Educational Content',
      description: 'Weekly webinars and trading lessons from our professional analysts',
      colorClass: 'from-orange-500/20 to-orange-500/10',
    },
  ];

  return (
    <div className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
          Everything You Need to Trade Successfully
        </h2>
        <p className="text-muted-foreground">
          Our premium signals package includes all the tools and support you need
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="group bg-card/50 backdrop-blur border border-border hover:border-primary/50 rounded-2xl p-6 transition-all"
          >
            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 bg-gradient-to-br ${feature.colorClass}`}>
              {feature.icon}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
