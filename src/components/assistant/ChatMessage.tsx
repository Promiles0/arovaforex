import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  sender: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

const ChatMessage = ({ sender, message, timestamp }: ChatMessageProps) => {
  const isUser = sender === 'user';

  // Simple markdown-like formatting for bold text
  const formatMessage = (text: string) => {
    // Replace **text** with bold
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      // Preserve newlines
      return part.split('\n').map((line, lineIndex, array) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < array.length - 1 && <br />}
        </span>
      ));
    });
  };

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {formatMessage(message)}
        </p>
        <p
          className={cn(
            "text-[10px] mt-1",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {format(new Date(timestamp), 'HH:mm')}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
