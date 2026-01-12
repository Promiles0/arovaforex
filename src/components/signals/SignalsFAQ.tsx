import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQ {
  q: string;
  a: string;
}

export const SignalsFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQ[] = [
    {
      q: 'How do I receive the signals?',
      a: "Signals are delivered instantly via Telegram and email. You'll receive notifications for new signals, updates, and when positions close.",
    },
    {
      q: 'What is your average win rate?',
      a: "Our 6-month average win rate is 72%. However, past performance doesn't guarantee future results. We provide transparent monthly statistics.",
    },
    {
      q: 'Can I cancel anytime?',
      a: "Yes! You can cancel your subscription at any time with no questions asked. If you cancel within 14 days, you'll receive a full refund.",
    },
    {
      q: 'Do you provide trading education?',
      a: 'Yes, premium members get access to weekly webinars, trading guides, and detailed analysis with each signal to help you learn.',
    },
    {
      q: 'What currency pairs do you cover?',
      a: 'We cover all major pairs (EUR/USD, GBP/USD, etc.) and selected cross pairs. Signals are provided for scalping, day trading, and swing trading.',
    },
    {
      q: 'Is there a free trial?',
      a: "We offer a 14-day money-back guarantee. If you're not satisfied within the first 14 days, we'll refund your payment in full.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground">
          Everything you need to know about our premium signals
        </p>
      </motion.div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="bg-card/50 backdrop-blur border border-border rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="font-semibold text-foreground pr-4">{faq.q}</span>
              <motion.div
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
