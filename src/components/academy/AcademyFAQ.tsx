import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do I need any prior trading experience?",
    answer: "No! Our academy is designed for complete beginners. We start from the very basics and gradually build up to advanced institutional strategies. Whether you've never traded before or have some experience, our curriculum will help you develop the skills you need."
  },
  {
    question: "How long does it take to complete the course?",
    answer: "The course is self-paced, so you can learn at your own speed. Most students complete the core curriculum in 2-3 months, but you'll have lifetime access to all materials, so you can take as long as you need. We recommend dedicating 5-10 hours per week for optimal learning."
  },
  {
    question: "What's included in the mentorship program?",
    answer: "You get weekly live Zoom sessions with experienced traders, 1-on-1 mentoring calls for personalized guidance, detailed trade reviews and feedback, and access to our private trading community. Our mentors have years of institutional trading experience."
  },
  {
    question: "Is there a money-back guarantee?",
    answer: "Yes! We offer a 30-day money-back guarantee. If you're not satisfied with the academy for any reason within the first 30 days, we'll give you a full refund—no questions asked. We're confident you'll find immense value in our program."
  },
  {
    question: "Do I need a large amount of capital to start?",
    answer: "No! You can start learning with a demo account (free virtual money) and practice until you're consistently profitable. When you're ready for live trading, you can start with as little as $100-$500. We teach proper risk management regardless of account size."
  },
  {
    question: "How is this different from other forex courses?",
    answer: "Unlike most courses that just provide videos, we offer ongoing mentorship, live trading sessions, and a supportive community. You're learning from real traders with institutional experience, not just theory. Plus, you get lifetime access with all future updates included."
  },
  {
    question: "Can I access the course on my phone?",
    answer: "Yes! All course materials are accessible on any device—desktop, tablet, or smartphone. You can learn wherever and whenever it's convenient for you. Our platform is fully responsive and optimized for mobile learning."
  },
  {
    question: "What if I have questions outside of live sessions?",
    answer: "You'll have access to our private community where you can ask questions anytime. Our mentors and fellow students are active daily to help you. Plus, you can schedule 1-on-1 calls with mentors for more personalized support."
  }
];

export const AcademyFAQ = () => {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-lg">Everything you need to know about the academy</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background rounded-lg px-6 border"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold pr-4">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};
