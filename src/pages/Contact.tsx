import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  MessageCircle, 
  Mail, 
  CheckCircle, 
  Loader2, 
  Paperclip, 
  X,
  Clock,
  ThumbsUp,
  Headphones,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Reply,
  Bug,
  Download,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const categories = [
  { value: 'account', label: 'Account Issues', icon: '👤', description: 'Login, profile, settings' },
  { value: 'forecast', label: 'Forecast Questions', icon: '📊', description: 'Analysis & predictions' },
  { value: 'mentorship', label: 'Mentorship Inquiry', icon: '🎓', description: 'Learning & courses' },
  { value: 'technical', label: 'Technical Support', icon: '🔧', description: 'Platform issues' },
  { value: 'billing', label: 'Billing & Payments', icon: '💳', description: 'Subscriptions & refunds' },
  { value: 'bug_report', label: 'Bug Report', icon: '🐛', description: 'Report errors' },
  { value: 'other', label: 'Other', icon: '💬', description: 'General questions' }
];

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  open: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Clock className="w-3 h-3" />, label: 'Open' },
  in_progress: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Loader2 className="w-3 h-3 animate-spin" />, label: 'In Progress' },
  resolved: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle className="w-3 h-3" />, label: 'Resolved' },
  closed: { color: 'bg-muted text-muted-foreground border-border', icon: <CheckCircle className="w-3 h-3" />, label: 'Closed' },
};

interface ContactMessage {
  id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority?: string;
  created_at: string;
  admin_response?: string;
  responded_at?: string;
  attachment_urls?: string[];
}

interface ContactResponse {
  id: string;
  responder_type: string;
  responder_name: string;
  message: string;
  created_at: string;
}

export default function Contact() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      setProfile(data);
    };
    fetchProfile();
  }, [user?.id]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  });

  // Fetch user messages
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['contact-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data || []) as ContactMessage[];
    },
    enabled: !!user?.id,
  });

  // Fetch responses for selected message
  const { data: responses = [] } = useQuery({
    queryKey: ['contact-responses', selectedMessage?.id],
    queryFn: async () => {
      if (!selectedMessage?.id) return [];
      const { data } = await supabase
        .from('contact_responses')
        .select('*')
        .eq('message_id', selectedMessage.id)
        .order('created_at', { ascending: true });
      return (data || []) as ContactResponse[];
    },
    enabled: !!selectedMessage?.id,
  });

  useEffect(() => {
    if (user && profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.full_name || "",
        email: user.email || ""
      }));
    }
  }, [user, profile]);

  const isBugReport = formData.category === 'bug_report';
  const maxFiles = isBugReport ? 5 : 3;
  const maxFileSize = isBugReport ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    let validFiles = files.filter(file => {
      if (file.size > maxFileSize) {
        toast.error(`${file.name} is too large (max ${maxFileSize / 1024 / 1024}MB)`);
        return false;
      }
      if (isBugReport && !file.type.startsWith('image/')) {
        toast.error(`${file.name} must be an image for bug reports`);
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles].slice(0, maxFiles));
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async () => {
    if (attachments.length === 0) return [];

    const uploadedUrls: string[] = [];
    setUploadingFiles(true);

    try {
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('contact-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from('contact-attachments')
            .getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error("Failed to upload some attachments");
    } finally {
      setUploadingFiles(false);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBugReport && attachments.length === 0) {
      toast.error("Please attach a screenshot for bug reports");
      return;
    }

    setLoading(true);

    try {
      const attachmentUrls = await uploadAttachments();

      const { error } = await supabase
        .from('contact_messages')
        .insert({
          user_id: user?.id,
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          category: formData.category,
          message: formData.message,
          status: 'open',
          priority: isBugReport ? 'high' : 'normal',
          attachment_urls: attachmentUrls
        });

      if (error) throw error;

      toast.success("Message sent! We'll respond within 24 hours.");
      setSubmitted(true);
      setAttachments([]);
      refetchMessages();

      setTimeout(() => {
        setFormData({
          name: profile?.full_name || "",
          email: user?.email || "",
          subject: "",
          category: "",
          message: ""
        });
        setSubmitted(false);
        setIsFormModalOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFollowUp = async () => {
    if (!followUpMessage.trim() || !selectedMessage) return;

    setSendingFollowUp(true);
    try {
      const { error } = await supabase
        .from('contact_responses')
        .insert({
          message_id: selectedMessage.id,
          responder_type: 'user',
          responder_id: user?.id,
          responder_name: profile?.full_name || 'User',
          message: followUpMessage.trim()
        });

      if (error) throw error;

      toast.success("Follow-up sent!");
      setFollowUpMessage("");
      queryClient.invalidateQueries({ queryKey: ['contact-responses', selectedMessage.id] });
    } catch (error) {
      console.error('Error sending follow-up:', error);
      toast.error('Failed to send follow-up');
    } finally {
      setSendingFollowUp(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = searchQuery === "" ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || msg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openMessageDetail = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <motion.div 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-background via-muted/50 to-primary/10 p-8 md:p-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-6"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <MessageCircle className="w-10 h-10 text-primary-foreground" />
          </motion.div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">We're Here to Help</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Have questions about your account, forecasts, or mentorship? We're happy to help.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Clock className="w-5 h-5" />, value: '24h', label: 'Response Time' },
              { icon: <ThumbsUp className="w-5 h-5" />, value: '98%', label: 'Satisfaction' },
              { icon: <Headphones className="w-5 h-5" />, value: '24/7', label: 'Available' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:border-primary/50 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  {stat.icon}
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { 
            icon: '💬', 
            title: 'WhatsApp Support', 
            subtitle: 'Get instant support',
            description: 'Chat with us on WhatsApp for quick responses',
            action: 'Message on WhatsApp',
            gradient: 'from-green-500 to-emerald-600',
            href: 'https://wa.me/message/ORMMHGOZH7GOE1'
          },
          { 
            icon: '✈️', 
            title: 'Telegram', 
            subtitle: 'Join our channel',
            description: 'Get real-time assistance via Telegram',
            action: 'Message on Telegram',
            gradient: 'from-blue-500 to-cyan-600',
            href: 'https://t.me/arloforex'
          },
          { 
            icon: '📧', 
            title: 'Email Support', 
            subtitle: 'support@arovaforex.com',
            description: 'Send us an email for detailed inquiries',
            action: 'Send Email',
            gradient: 'from-purple-500 to-pink-600',
            href: 'mailto:support@arovaforex.com'
          },
        ].map((card, index) => (
          <motion.a
            key={card.title}
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
            
            <div className="relative z-10">
              <span className="text-4xl block mb-4">{card.icon}</span>
              <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{card.subtitle}</p>
              <p className="text-sm text-muted-foreground mb-4">{card.description}</p>
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                {card.action}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.a>
        ))}
      </div>

      {/* Send Message Button */}
      <div className="flex justify-center">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            size="lg" 
            className="gap-2 text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            onClick={() => setIsFormModalOpen(true)}
          >
            <MessageCircle className="w-5 h-5" />
            Send us a Message
          </Button>
        </motion.div>
      </div>

      {/* Recent Messages Section */}
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">Your Messages</h2>
              <p className="text-sm text-muted-foreground">
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="pl-9 w-full sm:w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {messagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No messages found' : 'No messages yet'}
              </h3>
              <p className="text-muted-foreground text-sm">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Send us a message and we\'ll respond within 24 hours'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((message, index) => {
                const status = statusConfig[message.status] || statusConfig.open;
                const category = categories.find(c => c.value === message.category);
                
                return (
                  <motion.div
                    key={message.id}
                    className="p-4 bg-muted/30 border border-border/50 rounded-xl hover:border-primary/30 hover:bg-muted/50 cursor-pointer transition-all group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => openMessageDetail(message)}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium truncate">{message.subject}</h4>
                          <Badge className={`${status.color} border text-xs`}>
                            {status.icon}
                            <span className="ml-1">{status.label}</span>
                          </Badge>
                          {message.category === 'bug_report' && (
                            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                              <Bug className="w-3 h-3 mr-1" />
                              Bug
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {message.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                          {category && (
                            <span>{category.icon} {category.label}</span>
                          )}
                          {message.attachment_urls && message.attachment_urls.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {message.attachment_urls.length} file{message.attachment_urls.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {message.admin_response && (
                            <span className="flex items-center gap-1 text-emerald-500">
                              <Reply className="w-3 h-3" />
                              Replied
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Form Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl">Send us a Message</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                Fill out the form and we'll get back to you ASAP
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[calc(90vh-120px)] p-6">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <div className="grid sm:grid-cols-2 gap-4">
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
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
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
                      rows={5}
                      maxLength={1000}
                      required
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {formData.message.length} / 1000
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attachments {isBugReport ? '(Required for bug reports)' : '(Optional)'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {isBugReport 
                        ? `Upload up to ${maxFiles} images (max ${maxFileSize / 1024 / 1024}MB each)`
                        : `Upload up to ${maxFiles} files (max ${maxFileSize / 1024 / 1024}MB each)`
                      }
                    </p>
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      multiple
                      accept={isBugReport ? 'image/*' : 'image/*,.pdf,.doc,.docx'}
                      className="cursor-pointer"
                      disabled={attachments.length >= maxFiles}
                    />
                    
                    {attachments.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-lg">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate">{file.name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                ({(file.size / 1024).toFixed(1)}KB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || uploadingFiles || !formData.category}
                    size="lg"
                  >
                    {loading || uploadingFiles ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {uploadingFiles ? "Uploading files..." : "Sending..."}
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
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle className="w-16 h-16 text-primary mb-6" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3">Message Sent!</h3>
                  <p className="text-muted-foreground">
                    We've received your message and will respond within 24 hours.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Message Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          {selectedMessage && (
            <>
              <div className="sticky top-0 z-10 bg-card border-b p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-xl font-semibold truncate">{selectedMessage.subject}</h2>
                      <Badge className={`${statusConfig[selectedMessage.status]?.color || ''} border`}>
                        {statusConfig[selectedMessage.status]?.icon}
                        <span className="ml-1">{statusConfig[selectedMessage.status]?.label}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Ticket: #{selectedMessage.id.slice(0, 8)}</span>
                      <span>{new Date(selectedMessage.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <ScrollArea className="max-h-[calc(90vh-200px)] p-6">
                <div className="space-y-6">
                  {/* Original Message */}
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold">
                        {profile?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{profile?.full_name || 'You'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                    
                    {/* Attachments */}
                    {selectedMessage.attachment_urls && selectedMessage.attachment_urls.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-sm font-medium mb-2">Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMessage.attachment_urls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                            >
                              {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <ExternalLink className="w-4 h-4" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Admin Response (legacy) */}
                  {selectedMessage.admin_response && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">ArovaForex Support</p>
                          <p className="text-xs text-muted-foreground">
                            {selectedMessage.responded_at 
                              ? new Date(selectedMessage.responded_at).toLocaleString()
                              : 'Support Team'}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{selectedMessage.admin_response}</p>
                    </div>
                  )}

                  {/* Threaded Responses */}
                  {responses.map((response) => (
                    <div 
                      key={response.id}
                      className={`p-4 rounded-xl border ${
                        response.responder_type === 'admin'
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-muted/30 border-border/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          response.responder_type === 'admin'
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                            : 'bg-gradient-to-br from-primary to-primary/60'
                        }`}>
                          {response.responder_type === 'admin' ? (
                            <MessageCircle className="w-5 h-5 text-white" />
                          ) : (
                            <span className="text-primary-foreground font-semibold">
                              {response.responder_name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{response.responder_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(response.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                    </div>
                  ))}

                  {/* No Responses Yet */}
                  {!selectedMessage.admin_response && responses.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">Waiting for response from our support team...</p>
                      <p className="text-sm">We typically respond within 24 hours</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Follow-up Input */}
              {selectedMessage.status === 'open' && (
                <div className="sticky bottom-0 border-t bg-card p-4">
                  <div className="flex gap-2">
                    <Input
                      value={followUpMessage}
                      onChange={(e) => setFollowUpMessage(e.target.value)}
                      placeholder="Add a follow-up message..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendFollowUp()}
                    />
                    <Button 
                      onClick={handleSendFollowUp}
                      disabled={!followUpMessage.trim() || sendingFollowUp}
                    >
                      {sendingFollowUp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
