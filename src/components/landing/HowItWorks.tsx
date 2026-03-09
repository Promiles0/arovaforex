import { UserPlus, Compass, TrendingUp } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up",
    description: "Create your free account in under 2 minutes. No credit card required.",
    step: 1,
  },
  {
    icon: Compass,
    title: "Explore Tools",
    description: "Access forecasts, AI assistant, trading journal, and risk calculators.",
    step: 2,
  },
  {
    icon: TrendingUp,
    title: "Start Trading",
    description: "Make informed decisions with real-time analysis and expert insights.",
    step: 3,
  },
];

export const HowItWorks = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="max-w-5xl mx-auto relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground">Get started in three simple steps</p>
        </motion.div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px -translate-y-1/2">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/0 via-primary to-primary/0"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
              style={{ originX: 0 }}
            />
            {/* Dashed overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, hsl(var(--background)) 8px, hsl(var(--background)) 16px)`,
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.25 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Glassmorphism Card */}
                <div className="relative group">
                  {/* Glow ring */}
                  <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-primary/20 to-success/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />

                  <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 hover:border-primary/30 transition-all duration-300">
                    {/* Step Number */}
                    <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg">
                      {step.step}
                    </div>

                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-success/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>

                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
