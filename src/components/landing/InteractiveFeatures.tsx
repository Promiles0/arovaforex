import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Signal, Brain, Target, Shield, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  color: string;
}

const features: Feature[] = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Real-time Forecasts",
    description: "Professional technical analysis updated daily",
    features: [
      "Daily market analysis",
      "Technical indicators",
      "Price predictions",
      "Risk assessment"
    ],
    color: "from-success/10 to-success/5"
  },
  {
    icon: <Signal className="w-6 h-6" />,
    title: "Premium Signals",
    description: "Exclusive trading signals with precise levels",
    features: [
      "Entry/Exit points",
      "Stop loss levels",
      "Take profit targets",
      "Risk/Reward ratio"
    ],
    color: "from-premium/10 to-premium/5"
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI-Powered Analysis",
    description: "Advanced algorithms for market insights",
    features: [
      "Pattern recognition",
      "Sentiment analysis",
      "Predictive modeling",
      "Smart alerts"
    ],
    color: "from-primary/10 to-primary/5"
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Risk Management",
    description: "Comprehensive tools to protect your capital",
    features: [
      "Position sizing",
      "Portfolio tracking",
      "Performance analytics",
      "Trading journal"
    ],
    color: "from-warning/10 to-warning/5"
  }
];

export const InteractiveFeatures = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Why Choose ArovaForex?</h2>
          <p className="text-xl text-muted-foreground">Professional trading tools designed for success</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
            >
              <Card 
                className={`relative h-full border-border/50 transition-all duration-300 overflow-hidden ${
                  hoveredIndex === index ? 'shadow-[0_0_30px_rgba(16,185,129,0.3)] -translate-y-2' : ''
                }`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-300 ${
                  hoveredIndex === index ? 'opacity-100' : ''
                }`} />
                
                <CardHeader className="relative z-10">
                  {/* Animated Icon */}
                  <motion.div
                    animate={hoveredIndex === index ? { rotate: 360, scale: 1.1 } : { rotate: 0, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-gradient-to-br ${feature.color}`}
                  >
                    {feature.icon}
                  </motion.div>
                  
                  <CardTitle className="text-lg text-center">{feature.title}</CardTitle>
                  <CardDescription className="text-center">{feature.description}</CardDescription>
                  
                  {/* Expandable Features List */}
                  <AnimatePresence>
                    {hoveredIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-4 border-t border-border/50"
                      >
                        <ul className="space-y-2">
                          {feature.features.map((item, i) => (
                            <motion.li
                              key={i}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
