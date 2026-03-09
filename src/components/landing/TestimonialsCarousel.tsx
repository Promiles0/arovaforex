import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, BarChart3, BookOpen, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";

const valueProps = [
  {
    icon: TrendingUp,
    title: "Real-Time Forecasts",
    description: "Get detailed market analysis with clear entry points, stop losses, and take profit targets — updated in real time.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Shield,
    title: "Risk Management Tools",
    description: "Built-in calculators, position sizing tools, and risk/reward analysis to protect your capital on every trade.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Trading Journal",
    description: "Track every trade with advanced analytics, performance charts, and emotion tracking to improve your strategy.",
    color: "text-premium",
    bgColor: "bg-premium/10",
  },
  {
    icon: BookOpen,
    title: "Academy & Education",
    description: "Learn from structured courses and resources designed to take you from beginner to professional trader.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: Zap,
    title: "AI Trading Assistant",
    description: "Ask questions, get market insights, and receive personalized guidance from our AI-powered assistant.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Target,
    title: "Backtesting Engine",
    description: "Test your strategies against historical data to validate your approach before risking real capital.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

export const TestimonialsCarousel = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">What You Get</h2>
          <p className="text-xl text-muted-foreground">Everything you need to trade with confidence</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {valueProps.map((prop, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-border/50 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${prop.bgColor} flex items-center justify-center mb-4`}>
                    <prop.icon className={`w-6 h-6 ${prop.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{prop.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{prop.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
