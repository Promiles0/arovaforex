import { BarChart3, Signal, Brain, Target, Shield, Zap, BookOpen, Calculator } from "lucide-react";
import { motion } from "framer-motion";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  size: "large" | "small";
}

const features: Feature[] = [
  {
    icon: <BarChart3 className="w-7 h-7" />,
    title: "Real-Time Forecasts",
    description: "Professional technical analysis with clear entry points, stop losses, and take profit targets — updated daily with real market data.",
    size: "large",
  },
  {
    icon: <Signal className="w-6 h-6" />,
    title: "Premium Signals",
    description: "Precise entry/exit points with risk/reward ratios and real-time notifications.",
    size: "small",
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI Assistant",
    description: "Ask questions and get personalized market insights powered by AI.",
    size: "small",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Backtesting Engine",
    description: "Validate strategies against historical data before risking real capital.",
    size: "small",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Risk Management",
    description: "Position sizing calculators and portfolio tracking tools to protect your capital.",
    size: "small",
  },
  {
    icon: <BookOpen className="w-7 h-7" />,
    title: "Trading Academy",
    description: "Structured courses and resources designed to take you from beginner to professional trader, with practical lessons.",
    size: "large",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Live Trading Room",
    description: "Watch live analysis sessions and chat with the community in real time.",
    size: "small",
  },
  {
    icon: <Calculator className="w-6 h-6" />,
    title: "Trading Journal",
    description: "Track every trade with performance analytics, emotion tracking, and calendar view.",
    size: "small",
  },
];

export const InteractiveFeatures = () => {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Everything You Need to Trade</h2>
          <p className="text-xl text-muted-foreground">Professional tools designed for consistent results</p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.07 }}
              className={feature.size === "large" ? "lg:col-span-2" : ""}
            >
              <div className="group relative h-full rounded-2xl overflow-hidden">
                {/* Animated gradient border */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/30 via-transparent to-success/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative h-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-transparent transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-success/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>

                  <h3 className={`font-semibold mb-2 ${feature.size === "large" ? "text-xl" : "text-lg"}`}>
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
