import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet as WalletIcon, CreditCard, Calendar, Check, Crown, Star } from "lucide-react";

const currentPlan = {
  name: "Free",
  price: 0,
  features: ["Market Forecasts", "Basic Support", "Community Access"],
  billingCycle: null
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    billingCycle: null,
    features: [
      "Market Forecasts",
      "Basic Support", 
      "Community Access"
    ],
    current: true
  },
  {
    id: "premium",
    name: "Premium",
    price: 29.99,
    billingCycle: "month",
    popular: true,
    features: [
      "Everything in Free",
      "Premium Trading Signals", 
      "Priority Support",
      "Academy Access",
      "Advanced Analytics"
    ],
    current: false
  },
  {
    id: "professional",
    name: "Professional", 
    price: 79.99,
    billingCycle: "month",
    features: [
      "Everything in Premium",
      "1-on-1 Trading Sessions",
      "Custom Signal Alerts",
      "Telegram Bot Access",
      "Early Access Features"
    ],
    current: false
  }
];

export default function Wallet() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <WalletIcon className="w-6 h-6 text-primary" />
          My Wallet
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Subscription */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{currentPlan.name} Plan</p>
              <p className="text-muted-foreground">
                {currentPlan.price === 0 ? "Free forever" : `$${currentPlan.price}/${currentPlan.billingCycle}`}
              </p>
            </div>
            <Badge variant={currentPlan.name === "Free" ? "secondary" : "default"}>
              Active
            </Badge>
          </div>
          
          <div className="border-t border-border pt-4">
            <p className="font-medium mb-2">Included features:</p>
            <ul className="space-y-1">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Upgrade Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`border-border/50 relative ${
                plan.popular ? "border-premium/50 shadow-lg" : ""
              } ${plan.current ? "opacity-60" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-premium text-premium-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.name === "Professional" && <Crown className="w-5 h-5 text-premium" />}
                  {plan.name}
                </CardTitle>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  {plan.billingCycle && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{plan.billingCycle}
                    </span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    plan.current 
                      ? "bg-muted text-muted-foreground cursor-not-allowed" 
                      : plan.popular 
                        ? "bg-premium hover:bg-premium/90 text-premium-foreground"
                        : ""
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : "Upgrade Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods and billing information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No payment methods on file</p>
            <Button variant="outline">Add Payment Method</Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Billing History
          </CardTitle>
          <CardDescription>View your past payments and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No billing history available</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}