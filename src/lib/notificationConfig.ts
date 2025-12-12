export type NotificationType = 
  | 'like'
  | 'bookmark'
  | 'comment'
  | 'announcement'
  | 'system'
  | 'signal_alert'
  | 'price_alert'
  | 'achievement_unlocked';

export interface NotificationConfig {
  icon: string;
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  defaultAction: string;
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  like: {
    icon: '❤️',
    label: 'Like',
    color: 'pink',
    bgClass: 'bg-pink-500/10',
    borderClass: 'border-pink-500/50',
    textClass: 'text-pink-400',
    defaultAction: 'View Forecast',
  },
  bookmark: {
    icon: '🔖',
    label: 'Bookmark',
    color: 'amber',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/50',
    textClass: 'text-amber-400',
    defaultAction: 'View Forecast',
  },
  comment: {
    icon: '💬',
    label: 'Comment',
    color: 'blue',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/50',
    textClass: 'text-blue-400',
    defaultAction: 'View Comment',
  },
  announcement: {
    icon: '📢',
    label: 'Announcement',
    color: 'emerald',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/50',
    textClass: 'text-emerald-400',
    defaultAction: 'Learn More',
  },
  system: {
    icon: '⚙️',
    label: 'System',
    color: 'gray',
    bgClass: 'bg-gray-500/10',
    borderClass: 'border-gray-500/50',
    textClass: 'text-gray-400',
    defaultAction: 'View Details',
  },
  signal_alert: {
    icon: '📡',
    label: 'Signal Alert',
    color: 'teal',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/50',
    textClass: 'text-teal-400',
    defaultAction: 'View Signal',
  },
  price_alert: {
    icon: '💰',
    label: 'Price Alert',
    color: 'green',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/50',
    textClass: 'text-green-400',
    defaultAction: 'View Chart',
  },
  achievement_unlocked: {
    icon: '🏆',
    label: 'Achievement',
    color: 'yellow',
    bgClass: 'bg-yellow-500/10',
    borderClass: 'border-yellow-500/50',
    textClass: 'text-yellow-400',
    defaultAction: 'View Achievements',
  },
};

export const getNotificationConfig = (type: string): NotificationConfig => {
  return NOTIFICATION_CONFIG[type as NotificationType] || NOTIFICATION_CONFIG.system;
};
