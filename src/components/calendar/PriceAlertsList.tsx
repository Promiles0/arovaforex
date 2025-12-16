import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  BellRing, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceAlert } from "@/hooks/usePriceAlerts";
import { formatDistanceToNow } from "date-fns";

interface PriceAlertsListProps {
  alerts: PriceAlert[];
  loading: boolean;
  onDelete: (alertId: string) => Promise<boolean>;
  currentPrices?: Record<string, number>;
}

export default function PriceAlertsList({
  alerts,
  loading,
  onDelete,
  currentPrices = {},
}: PriceAlertsListProps) {
  const activeAlerts = alerts.filter(a => !a.is_triggered);
  const triggeredAlerts = alerts.filter(a => a.is_triggered);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium mb-2">No Price Alerts</h3>
          <p className="text-sm text-muted-foreground">
            Click on any currency pair in the matrix to set a price alert
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Active Alerts
              <Badge variant="secondary" className="ml-auto">
                {activeAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <AnimatePresence mode="popLayout">
              {activeAlerts.map((alert) => {
                const currentPrice = currentPrices[alert.currency_pair];
                const progress = currentPrice 
                  ? ((currentPrice - alert.target_price) / alert.target_price) * 100
                  : null;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    layout
                    className={cn(
                      "p-4 rounded-lg border transition-all",
                      alert.direction === 'above'
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : "bg-red-500/5 border-red-500/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{alert.currency_pair}</span>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-xs",
                              alert.direction === 'above'
                                ? "border-emerald-500/50 text-emerald-400"
                                : "border-red-500/50 text-red-400"
                            )}
                          >
                            {alert.direction === 'above' ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {alert.direction}
                          </Badge>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold font-mono">
                            {alert.target_price.toFixed(
                              alert.currency_pair.includes('JPY') ? 2 : 4
                            )}
                          </span>
                          {currentPrice && (
                            <span className="text-sm text-muted-foreground">
                              Current: {currentPrice.toFixed(
                                alert.currency_pair.includes('JPY') ? 2 : 4
                              )}
                            </span>
                          )}
                        </div>

                        {/* Progress indicator */}
                        {progress !== null && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, Math.abs(progress))}%` }}
                                className={cn(
                                  "h-full rounded-full",
                                  alert.direction === 'above'
                                    ? "bg-emerald-500"
                                    : "bg-red-500"
                                )}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Created {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(alert.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <Card className="opacity-70">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-400" />
              Triggered Alerts
              <Badge variant="outline" className="ml-auto">
                {triggeredAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {triggeredAlerts.slice(0, 5).map((alert) => (
              <motion.div
                key={alert.id}
                className="p-3 rounded-lg bg-muted/20 border border-border/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{alert.currency_pair}</span>
                      <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30">
                        Triggered
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.direction === 'above' ? 'Went above' : 'Went below'}{' '}
                      {alert.target_price.toFixed(4)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(alert.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
