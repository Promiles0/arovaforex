import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Heart, MessageCircle, Bookmark, Megaphone, AlertTriangle, Check, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationItem {
  id: string;
  user_id: string;
  type: "like" | "bookmark" | "comment" | "announcement" | "system";
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const typeIconMap: Record<NotificationItem["type"], React.ReactNode> = {
  like: <Heart className="w-4 h-4 text-primary" />,
  bookmark: <Bookmark className="w-4 h-4 text-primary" />,
  comment: <MessageCircle className="w-4 h-4 text-primary" />,
  announcement: <Megaphone className="w-4 h-4 text-primary" />,
  system: <AlertTriangle className="w-4 h-4 text-primary" />,
};

export function NotificationsBell() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

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

    // Realtime subscription
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as unknown as NotificationItem;
          setItems((prev) => [n, ...prev].slice(0, pageSize));
        }
      )
      .subscribe();

    // Fallback polling every 30s
    const interval = setInterval(() => fetchNotifications(), 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const onClickItem = async (n: NotificationItem) => {
    await markAsRead(n.id);
    if (n.link) {
      window.location.href = n.link;
    }
  };

  const loadMore = async () => {
    const newSize = pageSize + 20;
    setPageSize(newSize);
    await fetchNotifications(newSize);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
          <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="w-4 h-4 mr-1" /> Mark all as read
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          <div className="py-1">
            {items.length === 0 && (
              <div className="px-4 py-6 text-center text-muted-foreground">No notifications yet</div>
            )}
            {items.map((n) => (
              <DropdownMenuItem key={n.id} onClick={() => onClickItem(n)} className="gap-3 py-3 cursor-pointer">
                <div className="relative">
                  {typeIconMap[n.type]}
                  {!n.is_read && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm leading-snug">{n.content}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>
                {n.is_read ? (
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <span className="text-xs text-primary">New</span>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t p-2">
          <Button variant="secondary" className="w-full" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationsBell;
