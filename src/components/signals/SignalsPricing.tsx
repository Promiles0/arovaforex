import { motion } from "framer-motion";
import { useState } from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

type BillingCycle = 'monthly' | 'yearly';

interface PlanDetails {
  price: number;
  period: string;
  savings: string | null;
  total?: number;
}

export const SignalsPricing = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const plans: Record<BillingCycle, PlanDetails> = {
    monthly: {
      price: 29.99,
      period: '/month',
      savings: null,
    },
    yearly: {
      price: 24.99,
      period: '/month',
      savings: 'Save $60/year',
      total: 299.88,
    },
  };

  const selectedPlan = plans[billingCycle];

  const features = [
    'Unlimited premium signals',
    'Real-time Telegram alerts',
    'Detailed market analysis',
    'Entry, SL, and TP levels',
    'Multiple timeframe strategies',
    'Priority customer support',
    'Private community access',
    'Weekly trading webinars',
    '14-day money-back guarantee',
  ];

  return (
    <div id="pricing-section" className="max-w-4xl mx-auto mb-12 scroll-mt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
          Choose Your Plan
        </h2>
        <p className="text-muted-foreground mb-6">
          Cancel anytime. No hidden fees. 14-day money-back guarantee.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-1 bg-muted p-1.5 rounded-xl">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
              billingCycle === 'yearly'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-premium text-premium-foreground text-xs rounded-full font-bold">
              -17%
            </span>
          </button>
        </div>
      </motion.div>

      {/* Pricing Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-primary via-primary/90 to-success rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        style={{ boxShadow: 'var(--shadow-brand)' }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2), transparent 70%)'
            }}
          />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl lg:text-3xl font-bold text-primary-foreground mb-2">Premium Signals</h3>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl lg:text-6xl font-bold text-primary-foreground">${selectedPlan.price}</span>
              <span className="text-primary-foreground/80 text-xl">{selectedPlan.period}</span>
            </div>
            {selectedPlan.savings && (
              <motion.div
                key={billingCycle}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 inline-block px-4 py-1 bg-primary-foreground/20 backdrop-blur-sm rounded-full text-primary-foreground font-semibold"
              >
                {selectedPlan.savings}
              </motion.div>
            )}
            {billingCycle === 'yearly' && selectedPlan.total && (
              <div className="text-primary-foreground/80 text-sm mt-2">
                Billed ${selectedPlan.total} annually
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 text-primary-foreground"
              >
                <Check className="w-5 h-5 flex-shrink-0" strokeWidth={3} />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <Link to="/dashboard/wallet">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-background hover:bg-muted text-foreground font-bold text-lg rounded-xl transition-all shadow-xl"
            >
              Start Your 14-Day Trial
            </motion.button>
          </Link>
          <p className="text-center text-primary-foreground/70 text-sm mt-4">
            No credit card required • Cancel anytime
          </p>
        </div>
      </motion.div>
    </div>
  );
};
