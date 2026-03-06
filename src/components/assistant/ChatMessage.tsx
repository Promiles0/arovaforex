import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  sender: "user" | "assistant";
  message: string;
  timestamp: string;
}

const ChatMessage = ({ sender, message, timestamp }: ChatMessageProps) => {
  const isUser = sender === "user";

  const formatMessage = (text: string) => {
    // Split into lines first for block-level formatting
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIdx) => {
      // Bullet points
      if (line.match(/^[\-\*•]\s/)) {
        elements.push(
          <div key={lineIdx} className="flex gap-1.5 items-start">
            <span className="mt-0.5">•</span>
            <span>{formatInline(line.replace(/^[\-\*•]\s/, ""))}</span>
          </div>
        );
        return;
      }

      // Numbered lists
      const numMatch = line.match(/^(\d+)\.\s/);
      if (numMatch) {
        elements.push(
          <div key={lineIdx} className="flex gap-1.5 items-start">
            <span className="mt-0.5">{numMatch[1]}.</span>
            <span>{formatInline(line.replace(/^\d+\.\s/, ""))}</span>
          </div>
        );
        return;
      }

      // Empty lines → spacing
      if (line.trim() === "") {
        elements.push(<div key={lineIdx} className="h-1.5" />);
        return;
      }

      // Regular text line
      elements.push(
        <span key={lineIdx}>
          {formatInline(line)}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    });

    return elements;
  };

  // Inline formatting: **bold**, *italic*, `code`
  const formatInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="bg-background/50 px-1 py-0.5 rounded text-xs font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
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
        <div className="text-sm whitespace-pre-wrap break-words">
          {formatMessage(message)}
        </div>
        <p
          className={cn(
            "text-[10px] mt-1",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {format(new Date(timestamp), "HH:mm")}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
