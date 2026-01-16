import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getAssistantResponse } from "@/lib/aiAssistant";

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  message: string;
  timestamp: string;
  matchedIntent?: string;
}

interface UseArovaAssistantReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  canSaveHistory: boolean;
  isLoading: boolean;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useArovaAssistant(): UseArovaAssistantReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const initializedRef = useRef(false);

  const canSaveHistory = subscriptionTier === 'professional';

  // Fetch user's subscription tier
  useEffect(() => {
    const fetchSubscriptionTier = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          setSubscriptionTier(data.subscription_tier || 'free');
        }
      } catch (error) {
        console.error('Error fetching subscription tier:', error);
      }
    };

    fetchSubscriptionTier();
  }, [user]);

  // Initialize chat session
  useEffect(() => {
    const initializeChat = async () => {
      if (!user || initializedRef.current) return;
      initializedRef.current = true;

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        sender: 'assistant',
        message: canSaveHistory
          ? "👋 Welcome back! I'm Arova Assistant, here to help you 24/7. Your chat history is saved. What can I help you with today?"
          : "👋 Hi! I'm Arova Assistant, here to help you 24/7 with platform features and trading education. How can I assist you today?\n\n💡 *Upgrade to Professional to save your chat history.*",
        timestamp: new Date().toISOString(),
      };

      if (canSaveHistory) {
        setIsLoading(true);
        try {
          // Check for existing session
          const { data: sessions } = await supabase
            .from('assistant_chat_sessions')
            .select('*')
            .eq('user_id', user.id)
            .is('ended_at', null)
            .order('started_at', { ascending: false })
            .limit(1);

          let currentSessionId: string;

          if (sessions && sessions.length > 0) {
            currentSessionId = sessions[0].id;
          } else {
            // Create new session
            const { data: newSession, error } = await supabase
              .from('assistant_chat_sessions')
              .insert([{ user_id: user.id }])
              .select()
              .single();
            
            if (error) throw error;
            currentSessionId = newSession.id;
          }

          setSessionId(currentSessionId);

          // Load existing messages
          const { data: chatMessages } = await supabase
            .from('assistant_chat_messages')
            .select('*')
            .eq('session_id', currentSessionId)
            .order('created_at', { ascending: true });

          if (chatMessages && chatMessages.length > 0) {
            setMessages(chatMessages.map(msg => ({
              id: msg.id,
              sender: msg.sender as 'user' | 'assistant',
              message: msg.message,
              timestamp: msg.created_at,
              matchedIntent: msg.matched_intent || undefined,
            })));
          } else {
            setMessages([welcomeMessage]);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          setMessages([welcomeMessage]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setMessages([welcomeMessage]);
      }
    };

    initializeChat();
  }, [user, canSaveHistory]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      sender: 'user',
      message: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Save user message if professional
    if (canSaveHistory && sessionId) {
      try {
        await supabase.from('assistant_chat_messages').insert([{
          session_id: sessionId,
          user_id: user.id,
          message: messageText.trim(),
          sender: 'user',
        }]);
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    try {
      // Get AI response
      const { response, matchedIntent } = await getAssistantResponse(messageText);

      // Small delay for natural feel
      await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 300));

      const assistantMessage: ChatMessage = {
        id: generateId(),
        sender: 'assistant',
        message: response,
        timestamp: new Date().toISOString(),
        matchedIntent,
      };

      // Add assistant response to UI
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message if professional
      if (canSaveHistory && sessionId) {
        try {
          await supabase.from('assistant_chat_messages').insert([{
            session_id: sessionId,
            user_id: user.id,
            message: response,
            sender: 'assistant',
            matched_intent: matchedIntent,
          }]);
        } catch (error) {
          console.error('Error saving assistant message:', error);
        }
      }
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage: ChatMessage = {
        id: generateId(),
        sender: 'assistant',
        message: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [user, canSaveHistory, sessionId]);

  const clearMessages = useCallback(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome-new',
      sender: 'assistant',
      message: "Chat cleared! 👋 How can I help you?",
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
    canSaveHistory,
    isLoading,
  };
}
