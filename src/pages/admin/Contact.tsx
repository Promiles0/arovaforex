import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  X, 
  Send, 
  Loader2,
  Search 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';

interface ContactMessage {
  id: string;
  user_id: string;
  name?: string;
  email: string;
  subject: string;
  category?: string;
  message: string;
  status: string;
  admin_response?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminContact() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedMessage) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [selectedMessage]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMessage) {
        setSelectedMessage(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedMessage]);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel('contact-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_messages'
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);

  const loadMessages = async () => {
    try {
      let query = supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) setMessages(data);
    } catch (error) {
      console.error('Error loading contact messages:', error);
      toast.error('Failed to load contact messages');
    }
    setLoading(false);
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    setIsSending(true);
    try {
      const { error: updateError } = await supabase
        .from('contact_messages')
        .update({
          admin_response: replyText,
          status: 'resolved',
          responded_at: new Date().toISOString()
        })
        .eq('id', selectedMessage.id);

      if (updateError) throw updateError;

      // Create notification for user
      if (selectedMessage.user_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: selectedMessage.user_id,
            type: 'system',
            content: `Admin responded to your message: "${selectedMessage.subject}"`,
            link: '/support'
          });
      }

      toast.success('Reply sent successfully!');
      setSelectedMessage(null);
      setReplyText("");
      loadMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: messages.length,
    open: messages.filter(m => m.status === 'open').length,
    resolved: messages.filter(m => m.status === 'resolved').length
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contact Messages</h1>
        <p className="text-muted-foreground">Manage user inquiries and support requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          className="bg-card/50 border border-border rounded-xl p-6 border-l-4 border-l-blue-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Messages</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Mail className="w-7 h-7 text-blue-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-card/50 border border-border rounded-xl p-6 border-l-4 border-l-orange-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Open</p>
              <p className="text-3xl font-bold text-orange-500">{stats.open}</p>
            </div>
            <div className="w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center">
              <Clock className="w-7 h-7 text-orange-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-card/50 border border-border rounded-xl p-6 border-l-4 border-l-green-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Resolved</p>
              <p className="text-3xl font-bold text-green-500">{stats.resolved}</p>
            </div>
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Message Inbox */}
      <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Message Inbox
          </h2>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
              <Button
                variant={statusFilter === "all" ? "default" : "ghost"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "open" ? "default" : "ghost"}
                onClick={() => setStatusFilter("open")}
                size="sm"
              >
                Open
              </Button>
              <Button
                variant={statusFilter === "resolved" ? "default" : "ghost"}
                onClick={() => setStatusFilter("resolved")}
                size="sm"
              >
                Resolved
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mail className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No contact messages found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="hidden md:grid grid-cols-[100px,1fr,1fr,2fr,150px,120px] gap-4 px-6 py-3 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase">
              <div>Status</div>
              <div>From</div>
              <div>Email</div>
              <div>Subject</div>
              <div>Date</div>
              <div>Actions</div>
            </div>

            <div className="divide-y divide-border">
              {filteredMessages.map((message, i) => (
                <motion.div
                  key={message.id}
                  className="grid md:grid-cols-[100px,1fr,1fr,2fr,150px,120px] gap-4 px-6 py-5 hover:bg-muted/50 cursor-pointer transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedMessage(message)}
                >
                  <div>
                    <Badge variant={message.status === 'open' ? 'destructive' : 'default'} className={message.status === 'resolved' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {message.status}
                    </Badge>
                  </div>
                  <div className="font-medium truncate">{message.name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground truncate">{message.email}</div>
                  <div className="truncate">{message.subject}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </div>
                  <div>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMessage(null)}
            />

            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-3xl max-h-[90vh] md:max-h-[85vh] bg-background border border-border rounded-2xl md:rounded-xl mobile:w-full mobile:h-full mobile:max-w-full mobile:max-h-full mobile:rounded-none mobile:top-0 mobile:left-0 mobile:translate-x-0 mobile:translate-y-0 z-50 overflow-y-auto flex flex-col"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold">Message Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedMessage(null)}
                  className="rounded-full hover:rotate-90 transition-transform duration-200"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 md:p-4 space-y-6 flex-1 overflow-y-auto">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                    {selectedMessage.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{selectedMessage.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedMessage.email}</div>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">Category</div>
                    {selectedMessage.category && (
                      <Badge variant="outline" className="capitalize">{selectedMessage.category}</Badge>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">Date</div>
                    <div className="text-sm">{new Date(selectedMessage.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">Status</div>
                    <Badge variant={selectedMessage.status === 'open' ? 'destructive' : 'default'} className={selectedMessage.status === 'resolved' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {selectedMessage.status}
                    </Badge>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">Subject</div>
                  <h3 className="text-lg font-semibold">{selectedMessage.subject}</h3>
                </div>

                {/* Message */}
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">Message</div>
                  <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap leading-relaxed">
                    {selectedMessage.message}
                  </div>
                </div>

                {/* Previous Response */}
                {selectedMessage.admin_response && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold mb-2">Your Previous Response</div>
                    <div className="p-4 bg-green-500/5 border-l-4 border-green-500 rounded-lg">
                      {selectedMessage.admin_response}
                    </div>
                  </div>
                )}

                {/* Reply Section */}
                {selectedMessage.status !== 'resolved' && (
                  <div className="pt-6 border-t border-border">
                    <div className="text-sm font-semibold mb-3">Reply to {selectedMessage.name}:</div>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response here..."
                      rows={6}
                      className="mb-4 text-base"
                      style={{ fontSize: '16px' }}
                    />
                    <Button
                      onClick={handleReply}
                      disabled={!replyText.trim() || isSending}
                      className="w-full"
                      size="lg"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
