import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Zap, PenLine } from 'lucide-react';
import type { JournalMode } from '@/hooks/useJournalMode';

interface JournalModeToggleProps {
  mode: JournalMode;
  onToggle: (mode: JournalMode) => void;
  disabled?: boolean;
  className?: string;
}

export function JournalModeToggle({ mode, onToggle, disabled, className }: JournalModeToggleProps) {
  const isAuto = mode === 'auto';

  const handleClick = () => {
    if (disabled) return;
    onToggle(isAuto ? 'manual' : 'auto');
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Manual Label */}
      <motion.span
        className={cn(
          "text-sm font-medium transition-colors duration-300 flex items-center gap-1.5",
          !isAuto ? "text-foreground" : "text-muted-foreground"
        )}
        animate={{ opacity: !isAuto ? 1 : 0.6 }}
      >
        <PenLine className="w-3.5 h-3.5" />
        Manual
      </motion.span>

      {/* Toggle Switch */}
      <motion.button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative w-[72px] h-9 rounded-full transition-all duration-400 cursor-pointer",
          "border border-white/10 backdrop-blur-md",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        animate={{
          background: isAuto
            ? "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(262 83% 58%) 100%)"
            : "rgba(100, 100, 100, 0.2)",
          boxShadow: isAuto
            ? "0 0 20px hsla(var(--primary) / 0.4)"
            : "none"
        }}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
      >
        {/* Slider Circle */}
        <motion.div
          className="absolute top-1 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center"
          animate={{
            x: isAuto ? 38 : 4,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        >
          <motion.div
            animate={{ rotate: isAuto ? 360 : 0 }}
            transition={{ duration: 0.4 }}
          >
            {isAuto ? (
              <Zap className="w-3.5 h-3.5 text-primary" />
            ) : (
              <PenLine className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </motion.div>
        </motion.div>
      </motion.button>

      {/* Auto Label */}
      <motion.span
        className={cn(
          "text-sm font-medium transition-colors duration-300 flex items-center gap-1.5",
          isAuto ? "text-foreground" : "text-muted-foreground"
        )}
        animate={{ opacity: isAuto ? 1 : 0.6 }}
      >
        <Zap className="w-3.5 h-3.5" />
        Auto
      </motion.span>
    </div>
  );
}
