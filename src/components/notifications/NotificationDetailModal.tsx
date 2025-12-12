import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Check, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getNotificationConfig } from '@/lib/notificationConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NotificationItem {
  id: string;
  type: string;
  content: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationDetailModalProps {
  notification: NotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (link: string) => void;
}

export const NotificationDetailModal = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  onDelete,
  onNavigate,
}: NotificationDetailModalProps) => {
  if (!notification) return null;

  const config = getNotificationConfig(notification.type);
  const createdDate = new Date(notification.created_at);

  const handleAction = () => {
    if (notification.link) {
      if (!notification.is_read) {
        onMarkAsRead(notification.id);
      }
      onNavigate(notification.link);
      onClose();
    }
  };

  const handleDelete = () => {
    onDelete(notification.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`w-14 h-14 rounded-xl ${config.bgClass} flex items-center justify-center text-3xl`}
            >
              {config.icon}
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={`${config.bgClass} ${config.textClass} border-0`}>
                  {config.label}
                </Badge>
                {!notification.is_read && (
                  <Badge className="bg-primary/20 text-primary border-0">
                    New
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                {config.label} Notification
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 mt-4"
        >
          {/* Message Content */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <p className="text-foreground leading-relaxed">{notification.content}</p>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatDistanceToNow(createdDate, { addSuffix: true })}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{format(createdDate, 'MMM d, yyyy • h:mm a')}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {notification.link && (
              <Button 
                onClick={handleAction}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {config.defaultAction}
              </Button>
            )}
            
            <div className="flex gap-2">
              {!notification.is_read && (
                <Button
                  variant="outline"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Read
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDelete}
                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
