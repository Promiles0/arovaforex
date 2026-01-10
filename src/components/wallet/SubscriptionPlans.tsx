import { motion } from "framer-motion";
import { Check, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Plan {
  name: string;
  price: number;
  period: string;
  popular: boolean;
  current: boolean;
  features: string[];
}

export const SubscriptionPlans = () => {
  const plans: Plan[] = [
    {
      name: 'Free',
      price: 0,
      period: '/forever',
      popular: false,
      current: true,
      features: [
        'Market Forecasts',
        'Basic Support',
        'Community Access',
      ],
    },
    {
      name: 'Premium',
      price: 29.99,
      period: '/month',
      popular: true,
      current: false,
      features: [
        'Everything in Free',
        'Premium Trading Signals',
        'Priority Support',
        'Academy Access',
        'Advanced Analytics',
      ],
    },
    {
      name: 'Professional',
      price: 79.99,
      period: '/month',
      popular: false,
      current: false,
      features: [
        'Everything in Premium',
        '1-on-1 Trading Sessions',
        'Custom Signal Alerts',
        'Telegram Bot Access',
        'Early Access Features',
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-3">Upgrade Your Plan</h2>
        <p className="text-muted-foreground">Choose the perfect plan for your trading journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.name}
            className={`relative bg-card/50 backdrop-blur border rounded-3xl p-8 transition-all duration-300 hover:scale-105 ${
              plan.popular
                ? 'border-premium shadow-2xl shadow-premium/20'
                : 'border-border hover:border-primary/30'
            } ${plan.current ? 'opacity-70' : ''}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-premium to-warning text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3" />
                Most Popular
              </div>
            )}

            {/* Current Plan Badge */}
            {plan.current && (
              <div className="absolute top-6 right-6 px-3 py-1 bg-success/20 text-success text-xs font-medium rounded-full">
                Current Plan
              </div>
            )}

            {/* Plan Icon */}
            <div className="flex items-center gap-2 mb-4">
              {plan.name === 'Professional' && <Crown className="w-6 h-6 text-premium" />}
              <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-5xl font-bold text-foreground font-mono">${plan.price}</span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-success flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Button
              disabled={plan.current}
              className={`w-full py-6 font-semibold rounded-xl transition-all ${
                plan.current 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : plan.popular 
                    ? 'bg-premium hover:bg-premium/90 text-white hover:shadow-lg'
                    : plan.name === 'Professional'
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {plan.current ? 'Current Plan' : 'Upgrade Now'}
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
