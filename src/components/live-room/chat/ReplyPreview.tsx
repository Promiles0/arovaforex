import { X, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReplyPreviewProps {
  senderName: string;
  messagePreview: string;
  onCancel: () => void;
}

export const ReplyPreview = ({ senderName, messagePreview, onCancel }: ReplyPreviewProps) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-accent/50 border-l-2 border-primary rounded-t-lg">
      <Reply className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-primary">
          Replying to {senderName}
        </span>
        <p className="text-xs text-muted-foreground truncate">
          {messagePreview}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onCancel}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};
