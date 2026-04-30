import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const OPT_OUT_KEY = "tracking_opt_out";

export const TrackingOptOut = () => {
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => {
    try {
      setOptedOut(localStorage.getItem(OPT_OUT_KEY) === "true");
    } catch {
      // ignore
    }
  }, []);

  const handleToggle = (checked: boolean) => {
    try {
      if (checked) {
        localStorage.setItem(OPT_OUT_KEY, "true");
        toast.success("Tracking disabled on this device");
      } else {
        localStorage.removeItem(OPT_OUT_KEY);
        toast.success("Tracking re-enabled");
      }
      setOptedOut(checked);
    } catch {
      toast.error("Could not update tracking preference");
    }
  };

  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-muted/30">
      <div className="flex-1">
        <p className="font-medium text-foreground">Do not track me</p>
        <p className="text-sm text-muted-foreground mt-1">
          When enabled, we won't log anonymous visit metadata (page paths, referrers, device type, approximate location) from this device.
        </p>
      </div>
      <Switch checked={optedOut} onCheckedChange={handleToggle} />
    </div>
  );
};
