import { useState, useCallback, useEffect, KeyboardEvent } from 'react';
import { Send, Smile, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => Promise<boolean>;
  isSending: boolean;
  canSend: boolean;
  disabled?: boolean;
  cooldownSeconds?: number;
  slowModeEnabled?: boolean;
}

const QUICK_EMOJIS = ['👍', '🔥', '💰', '📈', '📉', '🎯', '💪', '🙏', '❤️', '😊', '🤔', '👀', '🚀', '👏', '⚡', '💯'];

export const ChatInput = ({ 
  onSend, 
  isSending, 
  canSend, 
  disabled,
  cooldownSeconds = 0,
  slowModeEnabled = false,
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [displayCooldown, setDisplayCooldown] = useState(0);

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

  const handleSend = useCallback(async () => {
    if (!message.trim() || isSending || !canSend) return;
    
    const success = await onSend(message);
    if (success) {
      setMessage('');
    }
  }, [message, isSending, canSend, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmoji(false);
  };

  const isOnCooldown = displayCooldown > 0;

  return (
    <div className="p-3 border-t border-border">
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Sign in to chat' : 'Type a message...'}
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
  );
};
