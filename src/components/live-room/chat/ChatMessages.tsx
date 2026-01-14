import { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatMessage as ChatMessageType } from '@/hooks/useLiveChat';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  pinnedMessages: ChatMessageType[];
  isLoading: boolean;
  currentUserId?: string;
  isAdmin: boolean;
  adminUserIds?: string[];
  onPin?: (messageId: string, pinned: boolean) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export const ChatMessages = ({
  messages,
  pinnedMessages,
  isLoading,
  currentUserId,
  isAdmin,
  adminUserIds = [],
  onPin,
  onDelete,
  onReact,
}: ChatMessagesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const hasMessages = messages.length > 0 || pinnedMessages.length > 0;

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="p-3 space-y-1">
        {/* Pinned Messages */}
        {pinnedMessages.length > 0 && (
          <div className="mb-4 space-y-1">
            {pinnedMessages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwnMessage={msg.user_id === currentUserId}
                isAdmin={isAdmin}
                isHostMessage={adminUserIds.includes(msg.user_id)}
                onPin={onPin}
                onDelete={onDelete}
                onReact={onReact}
              />
            ))}
          </div>
        )}

        {/* Regular Messages */}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isOwnMessage={msg.user_id === currentUserId}
            isAdmin={isAdmin}
            isHostMessage={adminUserIds.includes(msg.user_id)}
            onPin={onPin}
            onDelete={onDelete}
            onReact={onReact}
          />
        ))}

        {/* Empty State */}
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-muted-foreground text-sm">
              No messages yet. Be the first to say hello!
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
