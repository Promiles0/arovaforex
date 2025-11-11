import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Mail, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const categories = [
  { value: 'account', label: 'Account Issues', icon: '👤' },
  { value: 'forecast', label: 'Forecast Questions', icon: '📊' },
  { value: 'mentorship', label: 'Mentorship Inquiry', icon: '🎓' },
  { value: 'technical', label: 'Technical Support', icon: '🔧' },
  { value: 'billing', label: 'Billing & Payments', icon: '💳' },
  { value: 'other', label: 'Other', icon: '💬' }
];

const UserMessagesHistory = ({ userId }: { userId: string }) => {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['user-messages', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      return data;
    },
  });

  if (isLoading || !messages || messages.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">Your Recent Messages</h3>
      <div className="space-y-3">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            className="p-4 bg-card/50 border border-border rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{msg.subject}</h4>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                msg.status === 'open' 
                  ? 'bg-orange-500/10 text-orange-500' 
                  : 'bg-green-500/10 text-green-500'
              }`}>
                {msg.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {new Date(msg.created_at).toLocaleDateString()}
            </p>
            {msg.admin_response && (
              <div className="mt-3 p-3 bg-green-500/5 border-l-4 border-green-500 rounded">
                <span className="inline-block px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded mb-2">
                  Admin Reply
                </span>
                <p className="text-sm">{msg.admin_response}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default function ContactUs() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || ""
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert({
          user_id: user?.id,
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Message sent successfully! We'll respond within 24 hours.");
      setSubmitted(true);

      setTimeout(() => {
        setFormData({
          name: "",
          email: user?.email || "",
          subject: "",
          category: "",
          message: ""
        });
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="text-6xl mb-4"
          animate={{
            rotate: [0, 10, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
        >
          💬
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
          Contact Us
        </h1>
        <p className="text-lg text-muted-foreground">
          Have questions about your account, forecasts, or mentorship? We're happy to help.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-[1.2fr,0.8fr] gap-8">
        {/* Contact Form */}
        <motion.div
          className="bg-card/50 border border-border rounded-2xl p-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex flex-col items-center text-center mb-8">
            <MessageCircle className="w-6 h-6 text-primary mb-3" />
            <h2 className="text-2xl font-bold mb-2">Send us a Message</h2>
            <p className="text-muted-foreground text-sm">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-6"
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your inquiry"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <motion.label
                        key={cat.value}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.category === cat.value
                            ? 'bg-primary/10 border-primary'
                            : 'bg-card/50 border-border hover:border-primary/50'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={cat.value}
                          checked={formData.category === cat.value}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="sr-only"
                          required
                        />
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-xs font-medium text-center">{cat.label}</span>
                      </motion.label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your inquiry in detail..."
                    rows={6}
                    maxLength={1000}
                    required
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {formData.message.length} / 1000
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                className="flex flex-col items-center justify-center py-16 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="text-primary mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle className="w-16 h-16" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-3">Message Sent Successfully!</h3>
                <p className="text-muted-foreground">
                  We've received your message and will respond within 24 hours.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="bg-card/50 border border-border rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-2">Direct Contact</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Get immediate assistance through our preferred channels.
            </p>

            <div className="space-y-4">
              <motion.a
                href="https://wa.me/yourphonenumber"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-card/50 border border-border rounded-xl hover:bg-primary/10 hover:border-primary/50 transition-all"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Message Us on WhatsApp</h3>
                  <p className="text-sm text-muted-foreground">Get instant support</p>
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-2xl"
                >
                  →
                </motion.div>
              </motion.a>

              <motion.a
                href="mailto:support@arovaforex.com"
                className="flex items-center gap-4 p-4 bg-card/50 border border-border rounded-xl hover:bg-primary/10 hover:border-primary/50 transition-all"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Email Support</h3>
                  <p className="text-sm text-muted-foreground">support@arovaforex.com</p>
                </div>
              </motion.a>

              <div className="flex items-center gap-4 p-4 bg-card/50 border border-border rounded-xl">
                <div className="text-3xl">⏱️</div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Response Time</h4>
                  <p className="text-sm text-muted-foreground">Within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {user && <UserMessagesHistory userId={user.id} />}
        </motion.div>
      </div>
    </div>
  );
}
