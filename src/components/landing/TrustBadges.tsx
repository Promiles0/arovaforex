import { Shield, Lock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const badges = [
  { icon: Shield, text: "Bank-Level Security", color: "text-primary" },
  { icon: Lock, text: "SSL Encrypted", color: "text-success" },
  { icon: CheckCircle, text: "GDPR Compliant", color: "text-premium" },
];

export const TrustBadges = () => {
  return (
    <section className="py-12 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-center gap-8">
          {badges.map((badge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden group"
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
              
              <badge.icon className={`w-5 h-5 ${badge.color} relative z-10`} />
              <span className="text-sm font-medium relative z-10">{badge.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
