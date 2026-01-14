import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Pin, Trash2, Crown, MoreVertical, SmilePlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/hooks/useLiveChat';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🚀', '👏'];

interface ChatMessageProps {
  message: ChatMessageType;
  isOwnMessage: boolean;
  isAdmin: boolean;
  isHostMessage: boolean;
  onPin?: (messageId: string, pinned: boolean) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export const ChatMessage = ({
  message,
  isOwnMessage,
  isAdmin,
  isHostMessage,
  onPin,
  onDelete,
  onReact,
}: ChatMessageProps) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const displayName = message.user?.telegram_handle 
    ? `@${message.user.telegram_handle}` 
    : message.user?.full_name || 'Anonymous';

  const initials = (message.user?.full_name || 'A')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: false });
  const formattedTime = timeAgo === 'less than a minute' ? 'Just now' : `${timeAgo} ago`;

  const handleReaction = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowReactionPicker(false);
  };

  return (
    <div
      className={cn(
        'group relative px-3 py-2 rounded-lg transition-colors',
        isOwnMessage && 'bg-primary/10',
        isHostMessage && !isOwnMessage && 'bg-amber-500/10 border border-amber-500/20',
        message.is_pinned && 'bg-purple-500/10 border border-purple-500/20',
        !isOwnMessage && !isHostMessage && !message.is_pinned && 'hover:bg-muted/50'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-2">
        {/* Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={message.user?.avatar_url || undefined} alt={displayName} />
          <AvatarFallback className={cn(
            'text-xs',
            isHostMessage ? 'bg-amber-500 text-white' : 'bg-muted'
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Host Badge */}
            {isHostMessage && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded">
                <Crown className="h-3 w-3" />
                Host
              </span>
            )}
            
            {/* Pinned Badge */}
            {message.is_pinned && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            )}

            {/* Username */}
            <span className={cn(
              'font-medium text-sm truncate',
              isHostMessage ? 'text-amber-400' : 'text-foreground'
            )}>
              {displayName}
            </span>

            {/* Timestamp */}
            <span className="text-xs text-muted-foreground">
              {formattedTime}
            </span>
          </div>

          {/* Message Text */}
          <p className="text-sm text-foreground/90 mt-0.5 break-words">
            {message.message}
          </p>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => onReact?.(message.id, reaction.emoji)}
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors',
                    reaction.userReacted
                      ? 'bg-primary/20 border border-primary/40'
                      : 'bg-muted/50 border border-transparent hover:bg-muted'
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-muted-foreground">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Reaction Picker */}
            <Popover open={showReactionPicker} onOpenChange={setShowReactionPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <SmilePlus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <div className="flex gap-1">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Admin Actions */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPin?.(message.id, !message.is_pinned)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {message.is_pinned ? 'Unpin' : 'Pin'} Message
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(message.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
