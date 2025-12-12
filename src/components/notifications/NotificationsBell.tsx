import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Check, X, Filter, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationCard } from "./NotificationCard";
import { NotificationDetailModal } from "./NotificationDetailModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NOTIFICATION_CONFIG } from "@/lib/notificationConfig";

interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const filterTabs = [
  { id: 'all', label: 'All', icon: '📥' },
  { id: 'unread', label: 'Unread', icon: '🔵' },
  { id: 'like', label: 'Likes', icon: '❤️' },
  { id: 'comment', label: 'Comments', icon: '💬' },
  { id: 'announcement', label: 'Announcements', icon: '📢' },
];

export function NotificationsBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return items;
    if (activeFilter === 'unread') return items.filter(n => !n.is_read);
    return items.filter(n => n.type === activeFilter);
  }, [items, activeFilter]);

  const fetchNotifications = async (limit = pageSize) => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, type, content, link, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("Error fetching notifications", error);
    } else if (data) {
      setItems(data as unknown as NotificationItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as unknown as NotificationItem;
          setItems((prev) => [n, ...prev].slice(0, pageSize));
          toast({
            title: "New Notification",
            description: n.content.slice(0, 60) + (n.content.length > 60 ? '...' : ''),
          });
        }
      )
      .subscribe();

    const interval = setInterval(() => fetchNotifications(), 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user?.id, pageSize]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) {
      console.error(error);
    } else {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    if (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to mark all as read", variant: "destructive" });
    } else {
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({ title: "All caught up", description: "All notifications marked as read" });
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to delete notification", variant: "destructive" });
    } else {
      setItems((prev) => prev.filter((n) => n.id !== id));
      toast({ title: "Deleted", description: "Notification removed" });
    }
  };

  const handleCardClick = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const handleNavigate = (link: string) => {
    window.location.href = link;
  };

  const loadMore = async () => {
    const newSize = pageSize + 20;
    setPageSize(newSize);
    await fetchNotifications(newSize);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge
                    variant="destructive"
                    className="h-5 min-w-5 p-0 flex items-center justify-center text-xs animate-pulse"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-[400px] p-0 bg-card/95 backdrop-blur-xl border-border/50"
          sideOffset={8}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Notifications
              </h3>
              <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead} 
                disabled={unreadCount === 0}
                className="text-xs h-8"
              >
                <Check className="w-3 h-3 mr-1" /> 
                Mark all read
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 p-2 border-b border-border/50 overflow-x-auto scrollbar-hide">
            {filterTabs.map((tab) => {
              const count = tab.id === 'all' 
                ? items.length 
                : tab.id === 'unread' 
                  ? unreadCount 
                  : items.filter(n => n.type === tab.id).length;
              
              return (
                <Button
                  key={tab.id}
                  variant={activeFilter === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`h-7 text-xs whitespace-nowrap ${
                    activeFilter === tab.id ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-[400px]">
            <div className="p-2 space-y-2">
              {filteredItems.length === 0 && (
                <div className="px-4 py-12 text-center text-muted-foreground">
                  <div className="text-4xl mb-2">
                    {activeFilter === 'unread' ? '✅' : '📭'}
                  </div>
                  <p className="text-sm">
                    {activeFilter === 'unread' 
                      ? 'All caught up!' 
                      : 'No notifications yet'
                    }
                  </p>
                </div>
              )}
              
              {filteredItems.map((notification, index) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleCardClick(notification)}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  index={index}
                />
              ))}
            </div>
          </ScrollArea>

          {/* Load More */}
          {filteredItems.length >= pageSize && (
            <div className="border-t border-border/50 p-2">
              <Button 
                variant="ghost" 
                className="w-full text-sm" 
                onClick={loadMore} 
                disabled={loading}
              >
                {loading ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
        onNavigate={handleNavigate}
      />
    </>
  );
}

export default NotificationsBell;
