import { Users, Radio, Timer, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface SlowModeConfig {
  enabled: boolean;
  seconds: number;
}

interface ChatHeaderProps {
  onlineCount: number;
  isLive?: boolean;
  isAdmin?: boolean;
  slowMode?: SlowModeConfig;
  onToggleSlowMode?: (enabled: boolean, seconds?: number) => void;
}

export const ChatHeader = ({ 
  onlineCount, 
  isLive = true, 
  isAdmin = false,
  slowMode = { enabled: false, seconds: 30 },
  onToggleSlowMode,
}: ChatHeaderProps) => {
  const slowModeOptions = [10, 30, 60, 120];

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

        {/* Slow Mode Indicator */}
        {slowMode.enabled && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
            <Timer className="h-3 w-3" />
            {slowMode.seconds}s
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Online Count */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{onlineCount}</span>
        </div>

        {/* Admin Settings */}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-muted-foreground">Slow Mode</p>
              </div>
              <DropdownMenuItem
                onClick={() => onToggleSlowMode?.(false)}
                className={cn(!slowMode.enabled && 'bg-primary/10')}
              >
                <Timer className="h-4 w-4 mr-2" />
                Off
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {slowModeOptions.map((seconds) => (
                <DropdownMenuItem
                  key={seconds}
                  onClick={() => onToggleSlowMode?.(true, seconds)}
                  className={cn(
                    slowMode.enabled && slowMode.seconds === seconds && 'bg-primary/10'
                  )}
                >
                  <Timer className="h-4 w-4 mr-2" />
                  {seconds < 60 ? `${seconds} seconds` : `${seconds / 60} minute${seconds > 60 ? 's' : ''}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
