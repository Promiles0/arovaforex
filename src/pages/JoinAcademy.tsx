import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, BookOpen, Brain, TrendingUp, DollarSign, Users, Star, Zap } from "lucide-react";

const benefits = [
  {
    icon: BookOpen,
    title: "Learn Forex from Scratch",
    description: "Comprehensive beginner-to-pro curriculum covering all trading fundamentals and advanced strategies."
  },
  {
    icon: Brain,
    title: "Full Mentorship Program", 
    description: "Get personalized guidance from real traders with years of institutional trading experience."
  },
  {
    icon: TrendingUp,
    title: "Institutional Strategies",
    description: "Master ICT concepts, Order Blocks, FVGs, and other institutional trading methodologies."
  },
  {
    icon: DollarSign,
    title: "One-Time Affordable Fee",
    description: "Get lifetime access to our training program with a single, affordable enrollment payment."
  }
];

export default function JoinAcademy() {
  const whatsappUrl = "https://wa.me/message/AJEAKKDPJ5SSN1";

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight animate-fade-in">
          Join the ArovaForex Academy
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
          Ready to learn Forex the right way? Join our training program and level up your trading skills.
        </p>
      </div>

      {/* Hero Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-2 animate-scale-in">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green/5 to-transparent" />
        <CardHeader className="relative z-10 text-center pb-6">
          <CardTitle className="text-3xl font-bold mb-4">
            Become a Profitable Trader with ArovaForex Mentorship
          </CardTitle>
          <CardDescription className="text-lg mb-6">
            You'll get weekly Zoom sessions, full beginner-to-pro training, and live support from our mentors.
          </CardDescription>
          
          <Button 
            asChild
            size="lg"
            className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-4 px-8 text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-brand-green/25 animate-pulse"
          >
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
            >
              <MessageCircle className="w-6 h-6" />
              Enroll via WhatsApp
            </a>
          </Button>
        </CardHeader>
      </Card>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {benefits.map((benefit, index) => (
          <Card 
            key={index} 
            className="group hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-green/10 rounded-lg flex items-center justify-center group-hover:bg-brand-green/20 transition-colors">
                  <benefit.icon className="w-6 h-6 text-brand-green" />
                </div>
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{benefit.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action Section */}
      <Card className="bg-gradient-to-r from-brand-green/10 to-brand-green/5 border-brand-green/20 animate-fade-in">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-8 h-8 text-brand-green" />
            <h3 className="text-2xl font-bold">Ready to Start Your Trading Journey?</h3>
          </div>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Don't miss this opportunity to learn from experienced traders and transform your approach to the Forex market. 
            Contact us on WhatsApp to secure your spot in our next mentorship cohort.
          </p>
          <Button 
            asChild
            size="lg"
            className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold py-4 px-8 transition-all duration-300 hover:scale-105"
          >
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
            >
              <MessageCircle className="w-5 h-5" />
              Get Started Today
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}