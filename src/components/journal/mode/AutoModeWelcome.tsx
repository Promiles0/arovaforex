import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface AutoModeWelcomeProps {
  open: boolean;
  onClose: () => void;
  onGetStarted: () => void;
  onSkip: () => void;
}

export function AutoModeWelcome({ open, onClose, onGetStarted, onSkip }: AutoModeWelcomeProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 bg-transparent">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, hsl(var(--card)), hsl(var(--muted) / 0.5))",
                backdropFilter: "blur(20px)",
                border: "1px solid hsl(var(--border) / 0.5)",
              }}
            >
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-2xl p-[1px] -z-10">
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(262 83% 58%), hsl(var(--primary)))",
                    backgroundSize: "200% 200%",
                  }}
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="p-8">
                {/* Icon */}
                <motion.div
                  className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(262 83% 58% / 0.2))",
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 20px hsla(var(--primary) / 0.3)",
                      "0 0 40px hsla(var(--primary) / 0.5)",
                      "0 0 20px hsla(var(--primary) / 0.3)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-8 h-8 text-primary" />
                </motion.div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center mb-3">
                  Welcome to Auto Mode!
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-center mb-6">
                  Automatically sync your trades from your broker and save time on data entry!
                </p>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {[
                    "Real-time trade import",
                    "Never miss a trade",
                    "Still add notes & lessons"
                  ].map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={onGetStarted}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] hover:opacity-90 transition-opacity"
                  >
                    Let's Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    onClick={onSkip}
                    variant="ghost"
                    size="lg"
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
