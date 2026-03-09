import { Button } from "@/components/ui/button";
import { Zap, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const FinalCTA = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [usersCount, setUsersCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_platform_stats');
        if (!error && data) {
          const stats = data as unknown as { users_count: number };
          setUsersCount(stats.users_count || 0);
        }
      } catch (e) {
        console.error('Error fetching stats:', e);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-success/5 to-background" />

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Glassmorphism Card */}
          <div className="relative group">
            {/* Pulsing glow ring */}
            <motion.div
              className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/30 via-success/30 to-primary/30 blur-lg"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-10 md:p-14 text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Trading?
              </h2>

              <p className="text-xl text-muted-foreground mb-8">
                Join {usersCount}+ traders making informed decisions with ArovaForex
              </p>

              {/* Guarantees */}
              <div className="flex flex-wrap justify-center gap-6 mb-10">
                {[
                  "Setup in 2 minutes",
                  "No credit card required",
                  "Cancel anytime",
                ].map((text, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="text-muted-foreground">{text}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA Button with glow */}
              <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block"
                >
                  <Button
                    size="lg"
                    className="relative overflow-hidden group/btn bg-gradient-to-r from-primary to-success hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-all duration-300 text-lg px-10 py-7"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Zap className="w-6 h-6" />
                      {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-success to-primary"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
