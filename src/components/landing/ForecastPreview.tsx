import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export const ForecastPreview = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">Latest Market Analysis</h2>
          <p className="text-xl text-muted-foreground">See what premium members have access to</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <Card className="relative overflow-hidden border-primary/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <CardContent className="p-0">
              <div className="relative h-96 bg-gradient-to-br from-primary/5 via-success/5 to-background">
                {/* Animated Chart Background */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    d="M50 200 Q150 150 250 180 T450 140 Q550 120 650 160 T800 130"
                    stroke="url(#chartGradient)"
                    strokeWidth="3"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    className="blur-sm"
                  />
                  <motion.path
                    d="M50 250 Q150 220 250 240 T450 200 Q550 180 650 220 T800 190"
                    stroke="url(#chartGradient)"
                    strokeWidth="3"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    className="blur-sm"
                  />
                </svg>

                {/* Blur Overlay */}
                <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center">
                  <div className="text-center px-6">
                    {/* Lock Icon with Pulse */}
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-success/20 mb-6"
                    >
                      <Lock className="w-10 h-10 text-primary" />
                    </motion.div>

                    <h3 className="text-3xl font-bold mb-4">
                      {isAuthenticated ? "Full Market Analysis Available" : "Unlock Premium Forecasts"}
                    </h3>
                    
                    <p className="text-lg text-muted-foreground mb-6 max-w-md mx-auto">
                      {isAuthenticated 
                        ? "Access complete technical analysis, price targets, and risk management strategies" 
                        : "Get detailed technical analysis, entry points, and profit targets"
                      }
                    </p>

                    {/* Floating Benefit Badges */}
                    <div className="flex justify-center gap-4 mb-8 flex-wrap">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="px-4 py-2 rounded-full bg-success/20 backdrop-blur-sm border border-success/30 text-success text-sm font-semibold"
                      >
                        📈 85% Win Rate
                      </motion.div>
                      
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
                        className="px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary text-sm font-semibold"
                      >
                        🎯 Clear Entry/Exit
                      </motion.div>
                      
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 2, delay: 1, repeat: Infinity }}
                        className="px-4 py-2 rounded-full bg-premium/20 backdrop-blur-sm border border-premium/30 text-premium text-sm font-semibold"
                      >
                        ⚡ Real-time Updates
                      </motion.div>
                    </div>

                    <Link to={isAuthenticated ? "/dashboard/forecasts" : "/auth"}>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          size="lg"
                          className="bg-gradient-to-r from-primary to-success hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all duration-300"
                        >
                          {isAuthenticated ? (
                            <>
                              <TrendingUp className="w-5 h-5 mr-2" />
                              View All Forecasts
                            </>
                          ) : (
                            <>
                              <Target className="w-5 h-5 mr-2" />
                              Access Now
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
