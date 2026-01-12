import { Video, Bell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const OfflineMessage = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto text-center"
    >
      <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
        {/* Offline Icon */}
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Video className="w-12 h-12 text-muted-foreground" />
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          No Live Session Currently
        </h2>

        {/* Description */}
        <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-md mx-auto">
          There's no active live trading session at the moment. Check back later or enable notifications to get alerted when we go live!
        </p>

        {/* Action Buttons */}
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

        {/* Schedule Section */}
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
                <div className="text-foreground font-medium">Gold Analysis Session</div>
                <div className="text-sm text-muted-foreground">Wednesday, Jan 15</div>
              </div>
              <div className="text-primary font-semibold">6:00 PM GMT</div>
            </div>
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl">
              <div className="text-left">
                <div className="text-foreground font-medium">Forex Market Breakdown</div>
                <div className="text-sm text-muted-foreground">Friday, Jan 17</div>
              </div>
              <div className="text-primary font-semibold">4:00 PM GMT</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
