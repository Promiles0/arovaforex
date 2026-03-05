import { useState, useEffect } from "react";
import { Video, Bell, BellOff, Calendar, Clock, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OfflineMessageProps {
  scheduledStart?: string | null;
  title?: string | null;
}

export const OfflineMessage = ({ scheduledStart, title }: OfflineMessageProps) => {
  const { user } = useAuth();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasSchedule, setHasSchedule] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  // Check if user already has a reminder notification for this session
  useEffect(() => {
    if (!user || !scheduledStart) return;
    const checkExisting = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "webinar_reminder")
        .eq("link", `/dashboard/live-room`)
        .limit(1);
      if (data && data.length > 0) setNotifEnabled(true);
    };
    checkExisting();
  }, [user, scheduledStart]);

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

  const handleToggleNotification = async () => {
    if (!user) {
      toast.error("Please sign in to enable notifications");
      return;
    }
    if (!scheduledStart) return;

    setNotifLoading(true);
    try {
      if (notifEnabled) {
        // Remove the reminder
        await supabase
          .from("notifications")
          .delete()
          .eq("user_id", user.id)
          .eq("type", "webinar_reminder")
          .eq("link", `/dashboard/live-room`);
        setNotifEnabled(false);
        toast.success("Notification reminder removed");
      } else {
        // Create a reminder notification
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "webinar_reminder",
          content: `Reminder: "${title || "Live Trading Session"}" starts ${format(new Date(scheduledStart), "EEEE, MMMM d 'at' h:mm a")}`,
          link: `/dashboard/live-room`,
          is_read: false,
        });
        setNotifEnabled(true);
        toast.success("You'll be notified when the session starts!");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setNotifLoading(false);
    }
  };

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

  const scheduledDate = scheduledStart ? new Date(scheduledStart) : null;

  return (
    <>
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
                Starts {format(scheduledDate!, "EEEE, MMMM d 'at' h:mm a")}
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
            <Button
              className="gap-2"
              variant={notifEnabled ? "outline" : "default"}
              onClick={handleToggleNotification}
              disabled={notifLoading || !hasSchedule}
            >
              {notifEnabled ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              {notifEnabled ? "Disable Notification" : "Enable Notifications"}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowSchedule(true)}
              disabled={!hasSchedule}
            >
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
                      ? `${title || "Live Session"} — ${format(scheduledDate!, "MMM d, h:mm a")}`
                      : "Next session will appear here. Don't miss it!"}
                  </div>
                </div>
                {hasSchedule && notifEnabled && (
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Schedule Detail Dialog */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Session Details
            </DialogTitle>
          </DialogHeader>
          {scheduledDate && (
            <div className="space-y-4 py-2">
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Title</p>
                  <p className="text-foreground font-semibold text-lg">{title || "Live Trading Session"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</p>
                  <p className="text-foreground font-medium">{format(scheduledDate, "EEEE, MMMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Time</p>
                  <p className="text-foreground font-medium">{format(scheduledDate, "h:mm a")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Countdown</p>
                  <p className="text-primary font-bold">
                    {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background">
                {notifEnabled ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">Notification enabled — you'll be reminded!</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">Enable notifications to get reminded</span>
                  </>
                )}
              </div>

              <Button
                className="w-full gap-2"
                variant={notifEnabled ? "outline" : "default"}
                onClick={handleToggleNotification}
                disabled={notifLoading}
              >
                {notifEnabled ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {notifEnabled ? "Disable Notification" : "Enable Notifications"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
