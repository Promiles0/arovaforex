import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import type { MentionUser } from '@/hooks/useMentionAutocomplete';

interface MentionAutocompleteProps {
  suggestions: MentionUser[];
  isLoading: boolean;
  onSelect: (user: MentionUser) => void;
  selectedIndex: number;
}

export const MentionAutocomplete = ({
  suggestions,
  isLoading,
  onSelect,
  selectedIndex,
}: MentionAutocompleteProps) => {
  if (suggestions.length === 0 && !isLoading) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
      {isLoading ? (
        <div className="p-3 text-sm text-muted-foreground text-center">
          Searching users...
        </div>
      ) : (
        <ul className="py-1 max-h-48 overflow-y-auto">
          {suggestions.map((user, index) => (
            <li key={user.user_id}>
              <button
                type="button"
                onClick={() => onSelect(user)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors ${
                  index === selectedIndex ? 'bg-accent' : ''
                }`}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user.full_name?.[0] || user.telegram_handle?.[0] || <User className="w-3 h-3" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {user.full_name || 'Anonymous'}
                  </div>
                  {user.telegram_handle && (
                    <div className="text-xs text-muted-foreground truncate">
                      @{user.telegram_handle}
                    </div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
