import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import { HelpCircle, Send, MessageCircle, Phone, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const faqs = [
  {
    question: "How do I access premium signals?",
    answer: "Premium signals are available to subscribed members. You can upgrade your account in the Wallet section to gain access to exclusive trading signals with entry, stop-loss, and take-profit levels."
  },
  {
    question: "What is the difference between forecasts and signals?",
    answer: "Forecasts are free market analysis available to all members, providing general market outlook and trends. Signals are specific trading recommendations with precise entry and exit points, available only to premium members."
  },
  {
    question: "How often are forecasts updated?",
    answer: "Our free forecasts are typically updated daily, with major currency pairs analyzed at least 3-4 times per week. Premium signals are sent as opportunities arise, usually 5-10 signals per week."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time from your Wallet section. Your premium access will continue until the end of your current billing period."
  },
  {
    question: "What time zone are the signals sent in?",
    answer: "All signals and market times are provided in GMT/UTC. You can adjust for your local timezone in your profile settings."
  },
  {
    question: "Do you provide trading education?",
    answer: "Yes! Our Academy section offers comprehensive trading courses, webinars, and educational materials for traders of all levels. Premium members get access to advanced courses and live trading sessions."
  },
  {
    question: "How accurate are your trading signals?",
    answer: "While we maintain high accuracy rates, trading involves risk and past performance doesn't guarantee future results. We provide detailed risk management guidelines with each signal."
  },
  {
    question: "Can I use the signals with any broker?",
    answer: "Yes, our signals are broker-independent and can be used with any forex broker. However, we recommend using ECN brokers for better execution and lower spreads."
  }
];

export default function Support() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate sending support request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Support request sent",
        description: "We've received your message and will get back to you within 24 hours.",
      });
      
      setFormData(prev => ({
        ...prev,
        subject: "",
        message: "",
      }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
        <p className="text-muted-foreground">
          Get help with your account, trading questions, or technical issues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQ Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Find quick answers to common questions about ArovaForex.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Contact & Support Form */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Other ways to reach our support team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Email Support</p>
                  <p className="text-sm text-muted-foreground">support@arovaforex.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Live Chat</p>
                  <p className="text-sm text-muted-foreground">Available 24/7</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Response Time</p>
                  <p className="text-sm text-muted-foreground">Within 24 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Can't find what you're looking for? Send us a message.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your issue or question in detail..."
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}