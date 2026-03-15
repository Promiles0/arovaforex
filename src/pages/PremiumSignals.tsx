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

  // Premium user view - full signal access (will connect to real signals table)
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

      {/* Empty state — real signals coming soon */}
      <div className="text-center py-20 bg-card/50 backdrop-blur border border-border rounded-3xl">
        <div className="text-6xl mb-4">📡</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No signals yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Premium trading signals will appear here in real time once published by our analysts.
        </p>
      </div>
    </div>
  );
}
