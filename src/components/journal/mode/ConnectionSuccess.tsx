import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import type { BrokerConnection } from '@/hooks/useBrokerConnections';

interface ConnectionSuccessProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  connection: BrokerConnection | null;
}

export function ConnectionSuccess({ open, onClose, onContinue, connection }: ConnectionSuccessProps) {
  if (!connection) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        {/* Confetti effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                background: `hsl(${Math.random() * 360}, 70%, 60%)`,
              }}
              initial={{
                y: -20,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                y: 400,
                opacity: 0,
                scale: 0,
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 1.5 + Math.random(),
                delay: Math.random() * 0.5,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-emerald-500/20 mx-auto mb-4 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.4 }}
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Successfully Connected!
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h2>

          <div className="p-4 rounded-xl bg-card border mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform</span>
                <span className="font-medium">{connection.platform?.toUpperCase() || 'MetaTrader'}</span>
              </div>
              {connection.account_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-medium">#{connection.account_number}</span>
                </div>
              )}
              {connection.broker_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Broker</span>
                  <span className="font-medium">{connection.broker_name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-emerald-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm mb-6">
            Your trades will now sync automatically every 5 minutes. You can still add notes and lessons to each trade!
          </p>

          <Button onClick={onContinue} size="lg" className="w-full">
            Go to Auto Journal
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
