import { useState, useEffect } from "react";
import { Video, Bell, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface OfflineMessageProps {
  scheduledStart?: string | null;
  title?: string | null;
}

export const OfflineMessage = ({ scheduledStart, title }: OfflineMessageProps) => {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasSchedule, setHasSchedule] = useState(false);

  useEffect(() => {
    if (!scheduledStart) { setHasSchedule(false); return; }
    const target = new Date(scheduledStart).getTime();

    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setHasSchedule(false); return; }
      setHasSchedule(true);
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [scheduledStart]);

  const CountdownDigit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center"
      >
        <span className="text-2xl md:text-3xl font-bold text-primary">{String(value).padStart(2, "0")}</span>
      </motion.div>
      <span className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto text-center"
    >
      <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6"
        >
          {hasSchedule ? (
            <Clock className="w-12 h-12 text-primary" />
          ) : (
            <Video className="w-12 h-12 text-muted-foreground" />
          )}
        </motion.div>

        {hasSchedule ? (
          <>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {title || "Next Live Session"}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-2">
              Starts {format(new Date(scheduledStart!), "EEEE, MMMM d 'at' h:mm a")}
            </p>
            <div className="flex justify-center gap-3 md:gap-4 my-8">
              <CountdownDigit value={countdown.days} label="Days" />
              <CountdownDigit value={countdown.hours} label="Hours" />
              <CountdownDigit value={countdown.minutes} label="Mins" />
              <CountdownDigit value={countdown.seconds} label="Secs" />
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              No Live Session Currently
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-md mx-auto">
              There's no active live trading session at the moment. Check back later or enable notifications to get alerted when we go live!
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="gap-2">
            <Bell className="w-4 h-4" />
            Enable Notifications
          </Button>
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            View Schedule
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 p-6 bg-muted/50 rounded-2xl"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Upcoming Sessions
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
              <div className="text-left">
                <div className="text-sm text-muted-foreground">
                  {hasSchedule
                    ? `${title || "Live Session"} — ${format(new Date(scheduledStart!), "MMM d, h:mm a")}`
                    : "Next session will appear here. Don't miss it!"}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
