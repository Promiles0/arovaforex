import { useState, useCallback, useEffect, KeyboardEvent, useRef } from 'react';
import { Send, Smile, Timer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useMentionAutocomplete, MentionUser } from '@/hooks/useMentionAutocomplete';
import { MentionAutocomplete } from './MentionAutocomplete';
import { ReplyPreview } from './ReplyPreview';
import type { ChatMessage } from '@/hooks/useLiveChat';

interface ChatInputProps {
  onSend: (message: string, replyToId?: string) => Promise<boolean>;
  isSending: boolean;
  canSend: boolean;
  disabled?: boolean;
  cooldownSeconds?: number;
  slowModeEnabled?: boolean;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

const QUICK_EMOJIS = ['👍', '🔥', '💰', '📈', '📉', '🎯', '💪', '🙏', '❤️', '😊', '🤔', '👀', '🚀', '👏', '⚡', '💯'];

export const ChatInput = ({ 
  onSend, 
  isSending, 
  canSend, 
  disabled,
  cooldownSeconds = 0,
  slowModeEnabled = false,
  replyTo,
  onCancelReply,
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [displayCooldown, setDisplayCooldown] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mention autocomplete
  const {
    suggestions,
    isLoading: mentionLoading,
    isActive: mentionActive,
    insertMention,
    closeSuggestions,
  } = useMentionAutocomplete(message, cursorPosition);

  // Update cooldown display
  useEffect(() => {
    if (cooldownSeconds > 0) {
      setDisplayCooldown(cooldownSeconds);
      const interval = setInterval(() => {
        setDisplayCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setDisplayCooldown(0);
    }
  }, [cooldownSeconds]);

  // Reset mention selection when suggestions change
  useEffect(() => {
    setMentionSelectedIndex(0);
  }, [suggestions]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || isSending || !canSend) return;
    
    const success = await onSend(message, replyTo?.id);
    if (success) {
      setMessage('');
      closeSuggestions();
    }
  }, [message, isSending, canSend, onSend, replyTo, closeSuggestions]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle mention navigation
    if (mentionActive && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        handleMentionSelect(suggestions[mentionSelectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        closeSuggestions();
        return;
      }
    }

    // Normal enter to send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMentionSelect = (user: MentionUser) => {
    const newValue = insertMention(user);
    setMessage(newValue);
    closeSuggestions();
    
    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setCursorPosition(target.selectionStart || 0);
  };

  const isOnCooldown = displayCooldown > 0;

  return (
    <div className="border-t border-border">
      {/* Reply Preview */}
      {replyTo && (
        <ReplyPreview
          senderName={replyTo.user?.full_name || replyTo.user?.telegram_handle || 'User'}
          messagePreview={replyTo.message.substring(0, 100)}
          onCancel={() => onCancelReply?.()}
        />
      )}

      <div className="p-3 relative">
        {/* Mention Autocomplete */}
        {mentionActive && suggestions.length > 0 && (
          <MentionAutocomplete
            suggestions={suggestions}
            isLoading={mentionLoading}
            onSelect={handleMentionSelect}
            selectedIndex={mentionSelectedIndex}
          />
        )}

        {/* Cooldown Indicator */}
        {isOnCooldown && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-amber-500/10 rounded-lg">
            <Timer className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-amber-400">
              {slowModeEnabled ? 'Slow mode: ' : ''}Wait {displayCooldown}s before sending
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Emoji Picker */}
          <Popover open={showEmoji} onOpenChange={setShowEmoji}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                disabled={disabled}
              >
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-2" 
              side="top" 
              align="start"
            >
              <div className="grid grid-cols-8 gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="p-2 hover:bg-muted rounded-md text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Message Input */}
          <Input
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Sign in to chat' : 'Type a message... Use @ to mention'}
            disabled={disabled || isSending}
            className="flex-1"
            maxLength={500}
          />

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending || !canSend || disabled || isOnCooldown}
            size="icon"
            className={cn(
              'h-9 w-9 flex-shrink-0 transition-all',
              message.trim() && canSend && !isOnCooldown ? 'bg-primary hover:bg-primary/90' : ''
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Rate Limit Warning (only show if no cooldown indicator) */}
        {!canSend && !isSending && !isOnCooldown && (
          <p className="text-xs text-muted-foreground mt-1.5 text-center">
            Please wait before sending another message
          </p>
        )}
      </div>
    </div>
  );
};
