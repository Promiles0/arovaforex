import { useState, useCallback, KeyboardEvent } from 'react';
import { Send, Smile } from 'lucide-react';
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
}

const QUICK_EMOJIS = ['👍', '🔥', '💰', '📈', '📉', '🎯', '💪', '🙏', '❤️', '😊', '🤔', '👀'];

export const ChatInput = ({ onSend, isSending, canSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);

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

  return (
    <div className="p-3 border-t border-border">
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
            <div className="grid grid-cols-6 gap-1">
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
          disabled={!message.trim() || isSending || !canSend || disabled}
          size="icon"
          className={cn(
            'h-9 w-9 flex-shrink-0 transition-all',
            message.trim() && canSend ? 'bg-primary hover:bg-primary/90' : ''
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Rate Limit Warning */}
      {!canSend && !isSending && (
        <p className="text-xs text-muted-foreground mt-1.5 text-center">
          Please wait before sending another message
        </p>
      )}
    </div>
  );
};
