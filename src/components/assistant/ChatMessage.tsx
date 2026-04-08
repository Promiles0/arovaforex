import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ChatMessageProps {
  sender: "user" | "assistant";
  message: string;
  timestamp: string;
}

interface ActionLink {
  type: string;
  path: string;
  label: string;
}

function parseActions(text: string): { cleanText: string; actions: ActionLink[] } {
  const actionRegex = /\[ACTION:navigate:([^\]:]+):([^\]]+)\]/g;
  const actions: ActionLink[] = [];
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    actions.push({ type: "navigate", path: match[1], label: match[2] });
  }

  const cleanText = text.replace(actionRegex, "").trim();
  return { cleanText, actions };
}

const ChatMessage = ({ sender, message, timestamp }: ChatMessageProps) => {
  const isUser = sender === "user";
  const navigate = useNavigate();

  const { cleanText, actions } = isUser
    ? { cleanText: message, actions: [] }
    : parseActions(message);

  const formatMessage = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIdx) => {
      if (line.match(/^[\-\*•]\s/)) {
        elements.push(
          <div key={lineIdx} className="flex gap-1.5 items-start">
            <span className="mt-0.5">•</span>
            <span>{formatInline(line.replace(/^[\-\*•]\s/, ""))}</span>
          </div>
        );
        return;
      }

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

      if (line.trim() === "") {
        elements.push(<div key={lineIdx} className="h-1.5" />);
        return;
      }

      elements.push(
        <span key={lineIdx}>
          {formatInline(line)}
          {lineIdx < lines.length - 1 && <br />}
        </span>
      );
    });

    return elements;
  };

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
          {formatMessage(cleanText)}
        </div>

        {actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                variant="secondary"
                size="sm"
                className="h-7 text-xs gap-1 bg-primary/10 hover:bg-primary/20 text-primary border-0"
                onClick={() => navigate(action.path)}
              >
                {action.label}
                <ArrowRight className="w-3 h-3" />
              </Button>
            ))}
          </div>
        )}

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
