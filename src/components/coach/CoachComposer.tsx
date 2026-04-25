import { useState, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  onSend: (text: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  disabled?: boolean;
}

export const CoachComposer = ({ onSend, isStreaming, onStop, disabled }: Props) => {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || isStreaming || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-3">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={disabled ? "Sign in to chat with your coach" : "Ask your coach… (Shift+Enter for newline)"}
          disabled={disabled}
          className="resize-none min-h-[48px] max-h-40"
          rows={1}
        />
        {isStreaming ? (
          <Button onClick={onStop} variant="destructive" size="icon" className="h-12 w-12 flex-shrink-0">
            <Square className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={!value.trim() || disabled} size="icon" className="h-12 w-12 flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Coach uses your journal data to give context-aware feedback. Not financial advice.
      </p>
    </div>
  );
};
