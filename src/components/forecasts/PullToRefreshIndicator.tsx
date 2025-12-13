import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  threshold?: number;
}

export default function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
  threshold = 80
}: PullToRefreshIndicatorProps) {
  const showIndicator = pullDistance > 10 || isRefreshing;
  
  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: Math.min(pullDistance - 20, threshold - 20),
          }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed left-1/2 -translate-x-1/2 z-50 top-20 md:top-24"
        >
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shadow-lg",
            isRefreshing && "bg-primary/10 border-primary/30"
          )}>
            <motion.div
              animate={{
                rotate: isRefreshing ? 360 : progress * 360,
              }}
              transition={{
                duration: isRefreshing ? 1 : 0,
                repeat: isRefreshing ? Infinity : 0,
                ease: "linear"
              }}
            >
              <RefreshCw 
                className={cn(
                  "w-5 h-5 transition-colors",
                  progress >= 1 || isRefreshing ? "text-primary" : "text-muted-foreground"
                )} 
              />
            </motion.div>
          </div>
          
          {/* Pull instruction text */}
          {!isRefreshing && pullDistance > 20 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-center mt-2 text-muted-foreground whitespace-nowrap"
            >
              {progress >= 1 ? "Release to refresh" : "Pull down to refresh"}
            </motion.p>
          )}
          
          {isRefreshing && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-center mt-2 text-primary whitespace-nowrap"
            >
              Refreshing...
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
