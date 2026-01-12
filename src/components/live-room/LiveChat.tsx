interface LiveChatProps {
  videoId: string;
}

export const LiveChat = ({ videoId }: LiveChatProps) => {
  return (
    <div className="relative w-full h-[500px] lg:h-full min-h-[400px]">
      <iframe
        className="w-full h-full"
        src={`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${window.location.hostname}`}
        title="Live Chat"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
};
