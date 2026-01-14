import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdminCheck } from './useAdminCheck';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatReaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

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
  reactions?: ChatReaction[];
}

interface SlowModeConfig {
  enabled: boolean;
  seconds: number;
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
  const [slowMode, setSlowMode] = useState<SlowModeConfig>({ enabled: false, seconds: 30 });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const reactionsChannelRef = useRef<RealtimeChannel | null>(null);

  // Rate limiting based on slow mode
  const RATE_LIMIT_MS = slowMode.enabled ? slowMode.seconds * 1000 : 2000;

  const getRemainingCooldown = useCallback(() => {
    const elapsed = Date.now() - lastMessageTime;
    const remaining = Math.max(0, RATE_LIMIT_MS - elapsed);
    return Math.ceil(remaining / 1000);
  }, [lastMessageTime, RATE_LIMIT_MS]);

  const canSendMessage = useCallback(() => {
    const now = Date.now();
    return now - lastMessageTime >= RATE_LIMIT_MS;
  }, [lastMessageTime, RATE_LIMIT_MS]);

  // Fetch slow mode config
  const fetchSlowModeConfig = useCallback(async () => {
    if (!streamId) return;
    
    const { data } = await supabase
      .from('live_stream_config')
      .select('slow_mode_enabled, slow_mode_seconds')
      .eq('id', streamId)
      .single();
    
    if (data) {
      setSlowMode({
        enabled: data.slow_mode_enabled || false,
        seconds: data.slow_mode_seconds || 30,
      });
    }
  }, [streamId]);

  // Fetch reactions for messages
  const fetchReactionsForMessages = useCallback(async (messageIds: string[]) => {
    if (!messageIds.length || !user) return new Map<string, ChatReaction[]>();

    const { data: reactions } = await supabase
      .from('chat_reactions')
      .select('message_id, emoji, user_id')
      .in('message_id', messageIds);

    const reactionMap = new Map<string, ChatReaction[]>();
    
    if (reactions) {
      const grouped = reactions.reduce((acc, r) => {
        if (!acc[r.message_id]) acc[r.message_id] = {};
        if (!acc[r.message_id][r.emoji]) {
          acc[r.message_id][r.emoji] = { count: 0, userReacted: false };
        }
        acc[r.message_id][r.emoji].count++;
        if (r.user_id === user.id) {
          acc[r.message_id][r.emoji].userReacted = true;
        }
        return acc;
      }, {} as Record<string, Record<string, { count: number; userReacted: boolean }>>);

      Object.entries(grouped).forEach(([msgId, emojis]) => {
        reactionMap.set(
          msgId,
          Object.entries(emojis).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            userReacted: data.userReacted,
          }))
        );
      });
    }

    return reactionMap;
  }, [user]);

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

      // Fetch reactions
      const messageIds = data?.map(m => m.id) || [];
      const reactionMap = await fetchReactionsForMessages(messageIds);

      const messagesWithUsers = (data || []).map(msg => ({
        ...msg,
        user: profileMap.get(msg.user_id) || null,
        reactions: reactionMap.get(msg.id) || [],
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
  }, [messageLimit, fetchReactionsForMessages]);

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

  // Toggle reaction on a message
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return false;

    try {
      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('chat_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from('chat_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction
        await supabase
          .from('chat_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
      }
      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return false;
    }
  }, [user]);

  // Toggle slow mode (admin only)
  const toggleSlowMode = useCallback(async (enabled: boolean, seconds?: number) => {
    if (!isAdmin || !streamId) return false;

    try {
      const { error } = await supabase
        .from('live_stream_config')
        .update({
          slow_mode_enabled: enabled,
          slow_mode_seconds: seconds || slowMode.seconds,
        })
        .eq('id', streamId);

      if (error) throw error;
      setSlowMode(prev => ({ ...prev, enabled, seconds: seconds || prev.seconds }));
      return true;
    } catch (error) {
      console.error('Error toggling slow mode:', error);
      return false;
    }
  }, [isAdmin, streamId, slowMode.seconds]);

  // Update reactions in state
  const updateMessageReactions = useCallback(async (messageId: string) => {
    const reactionMap = await fetchReactionsForMessages([messageId]);
    const newReactions = reactionMap.get(messageId) || [];

    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, reactions: newReactions } : m
    ));
    setPinnedMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, reactions: newReactions } : m
    ));
  }, [fetchReactionsForMessages]);

  // Set up realtime subscription
  useEffect(() => {
    fetchMessages();
    fetchSlowModeConfig();

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

            const msgWithUser = { ...newMsg, user: profile || null, reactions: [] };
            
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

    // Subscribe to reactions
    reactionsChannelRef.current = supabase
      .channel('chat_reactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_reactions',
        },
        async (payload) => {
          const messageId = (payload.new as { message_id?: string })?.message_id || 
                           (payload.old as { message_id?: string })?.message_id;
          if (messageId) {
            updateMessageReactions(messageId);
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
      reactionsChannelRef.current?.unsubscribe();
    };
  }, [user, fetchMessages, fetchSlowModeConfig, messageLimit, updateMessageReactions]);

  return {
    messages,
    pinnedMessages,
    isLoading,
    onlineCount,
    isSending,
    sendMessage,
    pinMessage,
    deleteMessage,
    toggleReaction,
    toggleSlowMode,
    canSendMessage,
    getRemainingCooldown,
    slowMode,
    isAdmin,
    user,
  };
}
