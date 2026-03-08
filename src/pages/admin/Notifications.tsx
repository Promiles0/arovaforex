import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo/SEO";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Bell, Users, Shield, Calendar, Trash2, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface NotificationHistory {
  id: string;
  type: string;
  content: string;
  created_at: string;
  user_id: string;
}

const MAX_TITLE = 80;
const MAX_MESSAGE = 500;

export default function AdminNotifications() {
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [formData, setFormData] = useState({ title: '', message: '', type: 'announcement', target: 'all' });
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadNotificationHistory(); }, []);

  const loadNotificationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .in('type', ['announcement', 'system'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      if (data) setHistory(data);
    } catch {
      toast({ title: "Error", description: "Failed to load notification history", variant: "destructive" });
    }
    setHistoryLoading(false);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      let targetUserIds = null;
      if (formData.target !== 'all') {
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles').select('user_id').eq('role', formData.target as 'user' | 'admin');
        if (rolesError) throw rolesError;
        targetUserIds = userRoles?.map(r => r.user_id) || [];
      }
      const { data, error } = await supabase.rpc('broadcast_notification', {
        p_type: formData.type,
        p_content: `${formData.title}: ${formData.message}`,
        p_link: null,
        p_user_ids: targetUserIds
      });
      if (error) throw error;
      toast({ title: "Success", description: `Notification sent to ${data || 0} users` });
      setFormData({ title: '', message: '', type: 'announcement', target: 'all' });
      setShowPreview(false);
      loadNotificationHistory();
    } catch {
      toast({ title: "Error", description: "Failed to send notification", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Deleted", description: "Notification removed" });
      loadNotificationHistory();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Bell className="w-4 h-4" />;
      case 'system': return <Shield className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <>
      <SEO title="Admin Notifications | Arova" description="Send and manage notifications" />
      <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <h1 className="text-2xl font-semibold mb-6">Notifications Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Send Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Send className="w-5 h-5" /> Send Notification</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <Input
                    placeholder="Notification Title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value.slice(0, MAX_TITLE) }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{formData.title.length}/{MAX_TITLE}</p>
                </div>
                
                <div>
                  <Textarea
                    placeholder="Notification Message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value.slice(0, MAX_MESSAGE) }))}
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{formData.message.length}/{MAX_MESSAGE}</p>
                </div>

                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement"><div className="flex items-center gap-2"><Bell className="w-4 h-4" /> Announcement</div></SelectItem>
                    <SelectItem value="system"><div className="flex items-center gap-2"><Shield className="w-4 h-4" /> System Notice</div></SelectItem>
                  </SelectContent>
                </Select>

                <Select value={formData.target} onValueChange={(value) => setFormData(prev => ({ ...prev, target: value }))}>
                  <SelectTrigger><SelectValue placeholder="Audience" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all"><div className="flex items-center gap-2"><Users className="w-4 h-4" /> All Users</div></SelectItem>
                    <SelectItem value="user"><div className="flex items-center gap-2"><Users className="w-4 h-4" /> Regular Users Only</div></SelectItem>
                    <SelectItem value="admin"><div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Admins Only</div></SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1 gap-1" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="w-4 h-4" /> Preview
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <><div className="w-4 h-4 animate-spin rounded-full border-2 border-transparent border-t-current mr-2" /> Sending...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" /> Send</>
                    )}
                  </Button>
                </div>
              </form>

              {/* Preview */}
              {showPreview && (formData.title || formData.message) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl border border-border bg-card"
                >
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Preview</p>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {formData.type === 'announcement' ? <Bell className="w-4 h-4 text-primary" /> : <Shield className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{formData.title || "Title"}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{formData.message || "Message body..."}</p>
                      <p className="text-xs text-muted-foreground mt-2">Just now · {formData.type}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Broadcast Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{history.filter(n => n.type === 'announcement').length}</div>
                  <div className="text-sm text-muted-foreground">Announcements</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{history.filter(n => n.type === 'system').length}</div>
                  <div className="text-sm text-muted-foreground">System Notices</div>
                </div>
              </div>
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <div className="text-lg font-semibold text-primary">{history.length} Total Sent</div>
                <div className="text-xs text-muted-foreground">All time broadcasts</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notification History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="w-16 h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="w-48 h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="w-24 h-4 bg-muted animate-pulse rounded" /></TableCell>
                        <TableCell><div className="w-8 h-4 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : history.length > 0 ? (
                    history.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(notification.type)}
                            <Badge variant={notification.type === 'announcement' ? 'default' : 'secondary'}>{notification.type}</Badge>
                          </div>
                        </TableCell>
                        <TableCell><div className="max-w-md truncate">{notification.content}</div></TableCell>
                        <TableCell>{new Date(notification.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                                <AlertDialogDescription>This will remove this notification record. This cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteNotification(notification.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No notifications sent yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </>
  );
}
