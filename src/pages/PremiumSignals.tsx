import { Badge } from "@/components/ui/badge";
import { Signal } from "lucide-react";
import {
  SignalsHero,
  SignalPreview,
  SignalsFeatures,
  PerformanceMetrics,
  SignalsTestimonials,
  SignalsPricing,
  SignalsFAQ,
  SignalsFinalCTA,
} from "@/components/signals";

// TODO: Replace with real subscription check from user profile
const isPremiumUser = false;

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getSignalTypeColor = (type: string) => {
  return type === "BUY" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20";
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-primary/10 text-primary border-primary/20";
    case "closed":
      return "bg-muted/10 text-muted-foreground border-border";
    default:
      return "bg-muted/10 text-muted-foreground border-border";
  }
};

const getConfidenceColor = (confidence: string) => {
  switch (confidence.toLowerCase()) {
    case "high":
      return "bg-success/10 text-success border-success/20";
    case "medium":
      return "bg-warning/10 text-warning border-warning/20";
    case "low":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted/10 text-muted-foreground border-border";
  }
};

export default function PremiumSignals() {
  // Non-premium user view - conversion-focused landing page
  if (!isPremiumUser) {
    return (
      <div className="space-y-6 pb-12">
        {/* Hero Section */}
        <SignalsHero />

        {/* Sample Signal Previews (Blurred) */}
        <SignalPreview />

        {/* Features Grid */}
        <SignalsFeatures />

        {/* Performance Metrics */}
        <PerformanceMetrics />

        {/* Testimonials */}
        <SignalsTestimonials />

        {/* Pricing Section */}
        <SignalsPricing />

        {/* FAQ Section */}
        <SignalsFAQ />

        {/* Final CTA */}
        <SignalsFinalCTA />
      </div>
    );
  }

  // Premium user view - full signal access
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Signal className="w-6 h-6 text-premium" />
            Premium Trading Signals
          </h1>
          <p className="text-muted-foreground mt-1">
            Exclusive trading signals with detailed analysis and risk management
          </p>
        </div>
        <Badge className="bg-premium/10 text-premium border-premium/20">
          Premium Member
        </Badge>
      </div>

      {/* Signals List */}
      <div className="space-y-4">
        {mockSignals.map((signal) => (
          <Card key={signal.id} className="border-border/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-3">
                  {signal.type === "BUY" ? (
                    <TrendingUp className="w-5 h-5 text-success" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-destructive" />
                  )}
                  {signal.pair}
                  <Badge className={getSignalTypeColor(signal.type)}>
                    {signal.type}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(signal.status)}>
                    {signal.status}
                  </Badge>
                  <Badge className={getConfidenceColor(signal.confidence)}>
                    {signal.confidence}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Published {formatTime(signal.publishedAt)}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Signal Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">Entry Point</p>
                  <p className="text-lg font-bold">{signal.entry}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive mb-1">Stop Loss</p>
                  <p className="text-lg font-bold">{signal.stopLoss}</p>
                </div>
                <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                  <p className="text-sm font-medium text-success mb-1">Take Profit</p>
                  <p className="text-lg font-bold">{signal.takeProfit}</p>
                </div>
              </div>

              {/* Analysis */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="font-medium mb-2">Market Analysis</h4>
                <p className="text-muted-foreground">{signal.analysis}</p>
              </div>

              {/* Risk Reward */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    Risk: {Math.abs(signal.entry - signal.stopLoss).toFixed(4)} pips
                  </span>
                  <span className="text-muted-foreground">
                    Reward: {Math.abs(signal.takeProfit - signal.entry).toFixed(4)} pips
                  </span>
                </div>
                <Badge variant="outline">
                  R:R 1:{(Math.abs(signal.takeProfit - signal.entry) / Math.abs(signal.entry - signal.stopLoss)).toFixed(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
