import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLiveChat } from '@/hooks/useLiveChat';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

interface LiveChatContainerProps {
  streamId?: string;
  isLive?: boolean;
}

export const LiveChatContainer = ({ streamId, isLive = true }: LiveChatContainerProps) => {
  const [adminUserIds, setAdminUserIds] = useState<string[]>([]);
  
  const {
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
  } = useLiveChat({ streamId });

  // Fetch admin user IDs for host badge display
  useEffect(() => {
    const fetchAdmins = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (data) {
        setAdminUserIds(data.map(r => r.user_id));
      }
    };

    fetchAdmins();
  }, []);

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      <ChatHeader onlineCount={onlineCount} isLive={isLive} />
      
      <ChatMessages
        messages={messages}
        pinnedMessages={pinnedMessages}
        isLoading={isLoading}
        currentUserId={user?.id}
        isAdmin={isAdmin}
        adminUserIds={adminUserIds}
        onPin={pinMessage}
        onDelete={deleteMessage}
      />

      <ChatInput
        onSend={sendMessage}
        isSending={isSending}
        canSend={canSendMessage()}
        disabled={!user}
      />
    </div>
  );
};
