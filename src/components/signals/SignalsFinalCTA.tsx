import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

export const SignalsFinalCTA = () => {
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-section');
    pricingSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-r from-primary to-success rounded-3xl p-8 lg:p-12 text-center"
    >
      <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
        Ready to Start Trading Like a Pro?
      </h2>
      <p className="text-lg lg:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
        Join 500+ successful traders who are already profiting from our premium signals
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
        <Link to="/dashboard/wallet">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-background hover:bg-muted text-foreground font-bold text-lg rounded-xl transition-all shadow-xl"
          >
            Get Started Now
          </motion.button>
        </Link>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          onClick={scrollToPricing}
          className="px-8 py-4 bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur text-primary-foreground font-bold text-lg rounded-xl transition-all border-2 border-primary-foreground/30"
        >
          View Sample Signals
        </motion.button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 text-primary-foreground/80 text-sm">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>14-day guarantee</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>Cancel anytime</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>Secure payment</span>
        </div>
      </div>
    </motion.div>
  );
};
