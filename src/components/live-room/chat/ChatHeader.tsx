import { Users, Radio } from 'lucide-react';

interface ChatHeaderProps {
  onlineCount: number;
  isLive?: boolean;
}

export const ChatHeader = ({ onlineCount, isLive = true }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center gap-2">
        {isLive ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="h-5 w-5 text-red-500" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
            <span className="font-semibold text-foreground">Live Chat</span>
          </div>
        ) : (
          <span className="font-semibold text-muted-foreground">Chat</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{onlineCount}</span>
      </div>
    </div>
  );
};
