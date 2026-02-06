import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Upload, Mail, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConnectionMethod = 'metatrader' | 'file_upload' | 'email';

interface ConnectionMethodSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectMethod: (method: ConnectionMethod) => void;
  onBack: () => void;
}

const methods = [
  {
    id: 'metatrader' as const,
    title: 'MetaTrader Auto-Sync',
    description: 'Real-time sync every 5 minutes with MT4/MT5. Works with 1000+ brokers.',
    setupTime: '3 minutes',
    badge: 'RECOMMENDED',
    icon: Zap,
    gradient: 'from-primary to-[hsl(262_83%_58%)]',
  },
  {
    id: 'file_upload' as const,
    title: 'Upload Trade Files',
    description: 'Import from CSV, PDF, Excel. Batch import historical trades from any broker.',
    setupTime: '1 minute',
    badge: null,
    icon: Upload,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'email' as const,
    title: 'Email Auto-Import',
    description: 'Passive background sync. No manual uploads needed, works 24/7 automatically.',
    setupTime: '5 minutes',
    badge: 'ADVANCED',
    icon: Mail,
    gradient: 'from-amber-500 to-orange-500',
  },
];

export function ConnectionMethodSelector({
  open,
  onClose,
  onSelectMethod,
  onBack,
}: ConnectionMethodSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-muted/30">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <DialogTitle className="text-xl">Choose Your Connection Method</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Select how you'd like to sync your trades
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {methods.map((method, index) => (
            <motion.button
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectMethod(method.id)}
              className={cn(
                "relative w-full p-5 rounded-xl text-left",
                "border border-border/50 hover:border-primary/50",
                "bg-card/50 hover:bg-card",
                "transition-all duration-300",
                "group"
              )}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Badge */}
              {method.badge && (
                <motion.span
                  className={cn(
                    "absolute -top-2 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold",
                    method.badge === 'RECOMMENDED'
                      ? "bg-gradient-to-r from-primary to-[hsl(262_83%_58%)] text-white"
                      : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                  )}
                  animate={method.badge === 'RECOMMENDED' ? {
                    boxShadow: [
                      "0 0 10px hsla(var(--primary) / 0.3)",
                      "0 0 20px hsla(var(--primary) / 0.5)",
                      "0 0 10px hsla(var(--primary) / 0.3)",
                    ],
                  } : undefined}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {method.badge === 'RECOMMENDED' && (
                    <Sparkles className="w-3 h-3 inline mr-1" />
                  )}
                  {method.badge}
                </motion.span>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    `bg-gradient-to-br ${method.gradient} bg-opacity-20`
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${method.gradient.includes('primary') ? 'hsla(var(--primary) / 0.2)' : method.gradient.includes('blue') ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'}, transparent)`,
                  }}
                >
                  <method.icon className="w-6 h-6 text-foreground" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground">{method.title}</h3>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                  <span className="text-xs text-muted-foreground/70">
                    Setup time: {method.setupTime}
                  </span>
                </div>
              </div>

              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  background: `radial-gradient(circle at center, hsla(var(--primary) / 0.05), transparent 70%)`,
                }}
              />
            </motion.button>
          ))}

          {/* Skip button */}
          <div className="flex justify-between items-center pt-4 border-t mt-6">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
              I'll do this later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
