import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Testimonial {
  name: string;
  role: string;
  text: string;
  rating: number;
  avatar: string;
  profit?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "John Martinez",
    role: "Day Trader",
    text: "ArovaForex transformed my trading. The signals are incredibly accurate and the analysis is professional-grade. I've seen consistent profits since joining.",
    rating: 5,
    avatar: "JM",
    profit: "+45%"
  },
  {
    name: "Sarah Chen",
    role: "Swing Trader",
    text: "The risk management tools and trading journal have been game-changers for me. I can now track my progress and identify what works best for my strategy.",
    rating: 5,
    avatar: "SC",
    profit: "+62%"
  },
  {
    name: "Michael Brown",
    role: "Professional Trader",
    text: "Finally, a platform that delivers on its promises. The forecasts are detailed, accurate, and delivered on time. Highly recommend to serious traders.",
    rating: 5,
    avatar: "MB",
    profit: "+78%"
  },
  {
    name: "Emma Wilson",
    role: "Part-time Trader",
    text: "As someone new to forex, ArovaForex made it easy to understand the markets. The educational content and clear signals helped me become profitable quickly.",
    rating: 5,
    avatar: "EW",
    profit: "+34%"
  }
];

export const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const visibleTestimonials = [
    testimonials[currentIndex],
    testimonials[(currentIndex + 1) % testimonials.length],
    testimonials[(currentIndex + 2) % testimonials.length]
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">What Our Traders Say</h2>
          <p className="text-xl text-muted-foreground">Join thousands of successful traders</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleTestimonials.map((testimonial, index) => (
            <motion.div
              key={`${currentIndex}-${index}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-border/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-300">
                <CardContent className="p-6">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-muted-foreground mb-6 line-clamp-4">"{testimonial.text}"</p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-success flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                    {testimonial.profit && (
                      <div className="px-3 py-1 rounded-full bg-success/20 text-success text-sm font-semibold">
                        {testimonial.profit}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
