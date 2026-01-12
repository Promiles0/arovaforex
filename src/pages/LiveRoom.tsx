import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Video, Users, Clock, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useLiveStreamStatus } from "@/hooks/useLiveStreamStatus";
import {
  LiveStreamPlayer,
  LiveChat,
  OfflineMessage,
  LoadingScreen,
} from "@/components/live-room";

const LiveRoom = () => {
  const { user } = useAuth();
  const { streamConfig, isLive, isLoading } = useLiveStreamStatus();
  const viewIdRef = useRef<string | null>(null);
  const joinedAtRef = useRef<Date | null>(null);

  // Track user view when joining
  useEffect(() => {
    if (!user || !streamConfig?.video_id || !isLive) return;

    const trackView = async () => {
      joinedAtRef.current = new Date();
      
      const { data, error } = await supabase
        .from('live_stream_views')
        .insert({
          user_id: user.id,
          video_id: streamConfig.video_id,
        })
        .select('id')
        .single();

      if (!error && data) {
        viewIdRef.current = data.id;
      }
    };

    trackView();

    // Update duration when leaving
    return () => {
      if (viewIdRef.current && joinedAtRef.current) {
        const duration = Math.floor(
          (Date.now() - joinedAtRef.current.getTime()) / 60000
        );
        
        supabase
          .from('live_stream_views')
          .update({
            left_at: new Date().toISOString(),
            duration_minutes: duration,
          })
          .eq('id', viewIdRef.current)
          .then(() => {
            viewIdRef.current = null;
            joinedAtRef.current = null;
          });
      }
    };
  }, [user, streamConfig?.video_id, isLive]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <span className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </span>
            Live Trading Room
          </h1>
          <p className="text-muted-foreground mt-2">
            Join Arova's live trading sessions and interact in real-time
          </p>
        </div>

        {/* Live Badge */}
        {isLive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full"
          >
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-semibold">LIVE NOW</span>
          </motion.div>
        )}
      </motion.div>

      {/* Main Content */}
      {isLive && streamConfig?.video_id ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player (2/3 width on desktop) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Stream Title */}
              <div className="p-4 border-b border-border">
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  {streamConfig.title || 'Live Trading Session'}
                </h2>
                {streamConfig.description && (
                  <p className="text-muted-foreground text-sm mt-1">
                    {streamConfig.description}
                  </p>
                )}
              </div>

              {/* Video Player */}
              <LiveStreamPlayer videoId={streamConfig.video_id} />

              {/* Stream Info */}
              <div className="p-4 bg-muted/30">
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span>Live Now</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Watching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Live Chat (1/3 width on desktop) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-card border border-border rounded-2xl overflow-hidden h-full min-h-[500px] lg:min-h-0">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <span>Live Chat</span>
                </h3>
              </div>
              <LiveChat videoId={streamConfig.video_id} />
            </div>
          </motion.div>
        </div>
      ) : (
        <OfflineMessage />
      )}
    </div>
  );
};

export default LiveRoom;
