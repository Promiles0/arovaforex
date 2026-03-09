import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Bell, LineChart, Layout, PieChart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const ForecastPreview = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Your Trading Dashboard</h2>
          <p className="text-xl text-muted-foreground">Everything you need, organized in one powerful workspace</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-success/10 to-primary/10 rounded-3xl blur-3xl" />

          {/* Platform mockup */}
          <div className="relative bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-2xl">
            {/* Top bar */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border/30 bg-muted/20">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-muted/40 text-xs text-muted-foreground">
                  app.arovaforex.com/dashboard
                </div>
              </div>
            </div>

            <div className="flex min-h-[380px]">
              {/* Sidebar mockup */}
              <div className="hidden md:flex flex-col gap-3 w-56 p-4 border-r border-border/30 bg-muted/10">
                {[
                  { icon: Layout, label: "Dashboard", active: true },
                  { icon: BarChart3, label: "Forecasts" },
                  { icon: LineChart, label: "Journal" },
                  { icon: PieChart, label: "Analytics" },
                  { icon: Bell, label: "Alerts" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      item.active
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </motion.div>
                ))}
              </div>

              {/* Main content area */}
              <div className="flex-1 p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Animated stat card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="col-span-1 bg-muted/30 rounded-xl p-4 border border-border/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center mb-3">
                    <BarChart3 className="w-4 h-4 text-success" />
                  </div>
                  <div className="h-3 w-16 rounded bg-muted/50 mb-2" />
                  <div className="h-2 w-12 rounded bg-muted/30" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  className="col-span-1 bg-muted/30 rounded-xl p-4 border border-border/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <LineChart className="w-4 h-4 text-primary" />
                  </div>
                  <div className="h-3 w-20 rounded bg-muted/50 mb-2" />
                  <div className="h-2 w-10 rounded bg-muted/30" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                  className="col-span-1 bg-muted/30 rounded-xl p-4 border border-border/30"
                >
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center mb-3">
                    <Bell className="w-4 h-4 text-warning" />
                  </div>
                  <div className="h-3 w-14 rounded bg-muted/50 mb-2" />
                  <div className="h-2 w-8 rounded bg-muted/30" />
                </motion.div>

                {/* Chart placeholder */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.9 }}
                  className="col-span-2 md:col-span-2 bg-muted/20 rounded-xl p-4 border border-border/30 flex items-end gap-1"
                >
                  {/* Decorative bar chart — no fake numbers */}
                  {[40, 65, 45, 80, 55, 70, 60, 85, 50, 75, 65, 90].map((h, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary/10"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 1 + i * 0.05, duration: 0.5 }}
                    />
                  ))}
                </motion.div>

                {/* Notification slide-in */}
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.3 }}
                  className="col-span-1 bg-muted/30 rounded-xl p-4 border border-primary/20 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs text-muted-foreground">New Forecast</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded bg-muted/40" />
                    <div className="h-2 w-3/4 rounded bg-muted/30" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* CTA below */}
          <div className="text-center mt-10">
            <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-success hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)] transition-all duration-300"
                >
                  {isAuthenticated ? "Go to Dashboard" : "Try It Free"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
