import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Check, Shield, Lock, Award } from "lucide-react";

export const AcademyPricing = () => {
  const whatsappUrl = "https://wa.me/message/AJEAKKDPJ5SSN1";

  const benefits = [
    "Lifetime access to all courses",
    "Weekly live mentorship sessions",
    "Private trading community",
    "1-on-1 mentor support",
    "All future course updates",
    "Downloadable resources",
    "Certificate of completion",
    "24/7 support access"
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Investment in Your Trading Future</h2>
          <p className="text-muted-foreground text-lg">One-time payment, lifetime access</p>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden shadow-brand hover:shadow-hover transition-all duration-300">
            <Badge className="absolute top-4 right-4 bg-gradient-to-r from-primary to-primary/80">
              Limited Time Offer
            </Badge>

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl mb-4">Complete Academy Access</CardTitle>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-primary">
                  Contact for Pricing
                </div>
                <p className="text-muted-foreground">One-time payment</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {benefits.map((benefit, i) => (
                  <motion.li
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                variant="brand"
                className="w-full shadow-brand hover:shadow-hover transition-all duration-300"
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Enroll via WhatsApp
                </a>
              </Button>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Lock className="w-5 h-5 text-primary" />
                  <span className="text-xs text-muted-foreground">Secure payment</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-xs text-muted-foreground">Money-back guarantee</span>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="text-xs text-muted-foreground">Instant access</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
