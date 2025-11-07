import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, DollarSign, LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
}

const features: Feature[] = [
  {
    icon: BookOpen,
    title: "Learn Forex from Scratch",
    description: "Comprehensive beginner-to-pro curriculum",
    features: [
      "Start with zero experience",
      "Step-by-step video lessons",
      "Downloadable resources",
      "Progress tracking"
    ]
  },
  {
    icon: Users,
    title: "Full Mentorship Program",
    description: "Personalized guidance from real traders",
    features: [
      "Weekly live Zoom sessions",
      "1-on-1 mentoring calls",
      "Trade review & feedback",
      "Private community access"
    ]
  },
  {
    icon: TrendingUp,
    title: "Institutional Strategies",
    description: "Master professional trading concepts",
    features: [
      "ICT concepts & Smart Money",
      "Order Blocks & FVG",
      "Liquidity analysis",
      "Institutional order flow"
    ]
  },
  {
    icon: DollarSign,
    title: "One-Time Affordable Fee",
    description: "Lifetime access, no recurring charges",
    features: [
      "Pay once, access forever",
      "All future course updates",
      "No hidden fees",
      "Money-back guarantee"
    ]
  }
];

export const AcademyFeatures = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What You'll Get</h2>
          <p className="text-muted-foreground text-lg">Everything you need to become a profitable trader</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              onHoverStart={() => setExpandedIndex(index)}
              onHoverEnd={() => setExpandedIndex(null)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="h-full relative overflow-hidden transition-all duration-300"
                style={{
                  transform: expandedIndex === index ? 'translateY(-10px)' : 'translateY(0)',
                  boxShadow: expandedIndex === index ? '0 20px 40px rgba(var(--primary), 0.2)' : undefined
                }}
              >
                <CardHeader>
                  <motion.div
                    animate={{ 
                      rotate: expandedIndex === index ? 360 : 0,
                      scale: expandedIndex === index ? 1.1 : 1
                    }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4"
                  >
                    <feature.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  
                  <AnimatePresence>
                    {expandedIndex === index && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2 overflow-hidden"
                      >
                        {feature.features.map((item, i) => (
                          <motion.li
                            key={i}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="text-primary mt-0.5">✓</span>
                            <span>{item}</span>
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
