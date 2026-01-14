import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdminCheck } from './useAdminCheck';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id: string;
  user_id: string;
  stream_id: string | null;
  message: string;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  user?: {
    full_name: string | null;
    telegram_handle: string | null;
    avatar_url: string | null;
  };
}

interface UseLiveChatOptions {
  streamId?: string;
  messageLimit?: number;
}

export function useLiveChat({ streamId, messageLimit = 100 }: UseLiveChatOptions = {}) {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  // Rate limiting: 2 seconds between messages
  const RATE_LIMIT_MS = 2000;

  const canSendMessage = useCallback(() => {
    const now = Date.now();
    return now - lastMessageTime >= RATE_LIMIT_MS;
  }, [lastMessageTime]);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select(`
          id,
          user_id,
          stream_id,
          message,
          is_pinned,
          is_deleted,
          created_at
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(messageLimit);

      if (error) throw error;

      // Fetch user profiles for messages
      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, telegram_handle, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const messagesWithUsers = (data || []).map(msg => ({
        ...msg,
        user: profileMap.get(msg.user_id) || null,
      }));

      const pinned = messagesWithUsers.filter(m => m.is_pinned);
      const regular = messagesWithUsers.filter(m => !m.is_pinned);

      setPinnedMessages(pinned);
      setMessages(regular);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messageLimit]);

  const sendMessage = useCallback(async (message: string) => {
    if (!user || !message.trim() || isSending) return false;

    if (!canSendMessage()) {
      return false;
    }

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .insert({
          user_id: user.id,
          stream_id: streamId || null,
          message: message.trim(),
        });

      if (error) throw error;
      setLastMessageTime(Date.now());
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [user, streamId, isSending, canSendMessage]);

  const pinMessage = useCallback(async (messageId: string, pinned: boolean) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .update({ is_pinned: pinned })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error pinning message:', error);
      return false;
    }
  }, [isAdmin]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }, [isAdmin]);

  // Set up realtime subscription
  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    channelRef.current = supabase
      .channel('live_chat_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_chat_messages',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as ChatMessage;
            
            // Fetch user profile for new message
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_id, full_name, telegram_handle, avatar_url')
              .eq('user_id', newMsg.user_id)
              .single();

            const msgWithUser = { ...newMsg, user: profile || null };
            
            if (newMsg.is_pinned) {
              setPinnedMessages(prev => [...prev, msgWithUser]);
            } else {
              setMessages(prev => [...prev, msgWithUser].slice(-messageLimit));
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ChatMessage;
            
            if (updated.is_deleted) {
              setMessages(prev => prev.filter(m => m.id !== updated.id));
              setPinnedMessages(prev => prev.filter(m => m.id !== updated.id));
            } else if (updated.is_pinned) {
              setMessages(prev => prev.filter(m => m.id !== updated.id));
              setPinnedMessages(prev => {
                const exists = prev.find(m => m.id === updated.id);
                if (exists) return prev.map(m => m.id === updated.id ? { ...m, ...updated } : m);
                const msg = messages.find(m => m.id === updated.id);
                return msg ? [...prev, { ...msg, ...updated }] : prev;
              });
            } else {
              setPinnedMessages(prev => prev.filter(m => m.id !== updated.id));
              setMessages(prev => {
                const exists = prev.find(m => m.id === updated.id);
                if (exists) return prev.map(m => m.id === updated.id ? { ...m, ...updated } : m);
                const msg = pinnedMessages.find(m => m.id === updated.id);
                return msg ? [...prev, { ...msg, ...updated }] : prev;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setMessages(prev => prev.filter(m => m.id !== deleted.id));
            setPinnedMessages(prev => prev.filter(m => m.id !== deleted.id));
          }
        }
      )
      .subscribe();

    // Set up presence channel for online count
    if (user) {
      presenceChannelRef.current = supabase
        .channel('live_chat_presence')
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannelRef.current?.presenceState() || {};
          const count = Object.keys(state).length;
          setOnlineCount(count);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannelRef.current?.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        });
    }

    return () => {
      channelRef.current?.unsubscribe();
      presenceChannelRef.current?.unsubscribe();
    };
  }, [user, fetchMessages, messageLimit]);

  return {
    messages,
    pinnedMessages,
    isLoading,
    onlineCount,
    isSending,
    sendMessage,
    pinMessage,
    deleteMessage,
    canSendMessage,
    isAdmin,
    user,
  };
}
