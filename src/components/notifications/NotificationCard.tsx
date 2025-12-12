import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getNotificationConfig } from '@/lib/notificationConfig';

interface NotificationItem {
  id: string;
  type: string;
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationCardProps {
  notification: NotificationItem;
  onClick: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

export const NotificationCard = ({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
  index,
}: NotificationCardProps) => {
  const config = getNotificationConfig(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-lg border cursor-pointer
        bg-card/50 backdrop-blur-sm
        hover:bg-card/80 hover:border-primary/30
        transition-all duration-200 group
        ${!notification.is_read ? 'border-l-4 border-l-primary' : 'border-border/50'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg ${config.bgClass} flex items-center justify-center text-xl shrink-0`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${config.textClass}`}>
              {config.label}
            </span>
            {!notification.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <p className="text-sm text-foreground line-clamp-2 mb-1">
            {notification.content}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
