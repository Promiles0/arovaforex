import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MentionUser {
  user_id: string;
  full_name: string | null;
  telegram_handle: string | null;
  avatar_url: string | null;
}

interface UseMentionAutocompleteOptions {
  enabled?: boolean;
  limit?: number;
}

export const useMentionAutocomplete = (
  inputValue: string,
  cursorPosition: number,
  options: UseMentionAutocompleteOptions = {}
) => {
  const { enabled = true, limit = 5 } = options;
  
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);

  // Detect if we're in a mention context
  useEffect(() => {
    if (!enabled) {
      setSuggestions([]);
      setMentionQuery(null);
      return;
    }

    // Look backwards from cursor to find @
    const textBeforeCursor = inputValue.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex === -1) {
      setSuggestions([]);
      setMentionQuery(null);
      setMentionStartIndex(-1);
      return;
    }

    // Check if there's a space between @ and cursor
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
    if (textAfterAt.includes(' ')) {
      setSuggestions([]);
      setMentionQuery(null);
      setMentionStartIndex(-1);
      return;
    }

    // Check if @ is at start or after a space
    const charBeforeAt = lastAtIndex > 0 ? inputValue[lastAtIndex - 1] : ' ';
    if (charBeforeAt !== ' ' && lastAtIndex !== 0) {
      setSuggestions([]);
      setMentionQuery(null);
      setMentionStartIndex(-1);
      return;
    }

    setMentionQuery(textAfterAt);
    setMentionStartIndex(lastAtIndex);
  }, [inputValue, cursorPosition, enabled]);

  // Fetch suggestions when mention query changes
  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length === 0) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, telegram_handle, avatar_url')
          .or(`full_name.ilike.%${mentionQuery}%,telegram_handle.ilike.%${mentionQuery}%`)
          .limit(limit);

        if (error) throw error;
        setSuggestions(data || []);
      } catch (error) {
        console.error('Error fetching mention suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounceTimer);
  }, [mentionQuery, limit]);

  // Insert mention at the cursor position
  const insertMention = useCallback((user: MentionUser): string => {
    if (mentionStartIndex === -1) return inputValue;

    const username = user.telegram_handle || user.full_name || 'user';
    const beforeMention = inputValue.substring(0, mentionStartIndex);
    const afterCursor = inputValue.substring(cursorPosition);
    
    return `${beforeMention}@${username} ${afterCursor}`;
  }, [inputValue, cursorPosition, mentionStartIndex]);

  const isActive = mentionQuery !== null && mentionQuery.length >= 0;

  return {
    suggestions,
    isLoading,
    isActive,
    mentionQuery,
    insertMention,
    closeSuggestions: () => {
      setSuggestions([]);
      setMentionQuery(null);
      setMentionStartIndex(-1);
    },
  };
};
