import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Send, MessageCircle, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


export default function ContactUs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    subject: "",
    category: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate sending support request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message sent successfully",
        description: "Your message has been received. We'll get back to you soon.",
      });
      
      setFormData(prev => ({
        ...prev,
        subject: "",
        category: "",
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

  const whatsappUrl = "https://wa.me/message/AJEAKKDPJ5SSN1";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-4 animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Contact Us</h1>
        <p className="text-xl text-muted-foreground">
          Have questions about your account, forecasts, or mentorship? We're happy to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <Card className="animate-fade-in border-primary/20 shadow-brand">
          <CardHeader>
            <CardTitle className="text-primary">Send us a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                  required
                  className="transition-all duration-200 focus:scale-105 focus:border-primary"
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
                  className="transition-all duration-200 focus:scale-105 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your inquiry"
                  required
                  className="transition-all duration-200 focus:scale-105 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="transition-all duration-200 focus:scale-105 focus:border-primary">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="forecasts">Forecasts or Signals</SelectItem>
                    <SelectItem value="academy">Join Academy</SelectItem>
                    <SelectItem value="technical">Technical Help</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe your inquiry in detail..."
                  required
                  className="transition-all duration-200 focus:scale-105 focus:border-primary"
                />
              </div>
              <Button 
                type="submit" 
                variant="brand"
                className="w-full transition-all duration-300 hover:scale-105 shadow-brand" 
                disabled={loading}
              >
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

        {/* Direct Contact Card */}
        <div className="space-y-6">
          <Card className="animate-fade-in border-primary/20 shadow-brand" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="text-primary">Direct Contact</CardTitle>
              <CardDescription>
                Get immediate assistance through our preferred channels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Button 
                  asChild
                  size="lg"
                  variant="brand"
                  className="font-semibold transition-all duration-300 hover:scale-105 w-full shadow-brand"
                >
                  <a 
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Message Us on WhatsApp
                  </a>
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Get instant support through WhatsApp
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@arovaforex.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-sm text-muted-foreground">Within 24 hours</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}