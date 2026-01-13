interface LiveStreamPlayerProps {
  videoId: string;
}

export const LiveStreamPlayer = ({ videoId }: LiveStreamPlayerProps) => {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
       src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&enablejsapi=1&rel=0&modestbranding=1&origin=${encodeURIComponent(
  origin
)}`}

        title="Live Trading Session"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
};
