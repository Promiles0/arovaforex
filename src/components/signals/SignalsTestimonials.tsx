import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  rating: number;
  text: string;
  profit: string;
}

export const SignalsTestimonials = () => {
  // Real testimonials will come from database — no fake reviews
  const testimonials: Testimonial[] = [];

  return (
    <div className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
          What Our Members Say
        </h2>
        <p className="text-muted-foreground">
          Join hundreds of profitable traders
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="bg-card/50 backdrop-blur border border-border rounded-2xl p-6"
          >
            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-warning fill-warning" />
              ))}
            </div>

            {/* Review Text */}
            <p className="text-muted-foreground mb-4 leading-relaxed">
              "{testimonial.text}"
            </p>

            {/* Profit Badge */}
            <div className="inline-block px-3 py-1 bg-success/20 text-success rounded-full text-sm font-semibold mb-4">
              {testimonial.profit} profit
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-2xl">
                {testimonial.avatar}
              </div>
              <div>
                <div className="font-semibold text-foreground">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
