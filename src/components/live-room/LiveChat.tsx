import { LiveChatContainer } from './chat';

interface LiveChatProps {
  videoId?: string;
  streamId?: string;
  isLive?: boolean;
}

export const LiveChat = ({ streamId, isLive = true }: LiveChatProps) => {
  return (
    <div className="relative w-full h-[500px] lg:h-full min-h-[400px]">
      <LiveChatContainer streamId={streamId} isLive={isLive} />
    </div>
  );
};
