import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StreamConfig {
  id: string;
  video_id: string;
  is_live: boolean;
  title: string;
  description: string | null;
  scheduled_start: string | null;
  thumbnail_url: string | null;
}

export const useLiveStreamStatus = () => {
  const [isLive, setIsLive] = useState(false);
  const [streamConfig, setStreamConfig] = useState<StreamConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStreamConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('live_stream_config')
        .select('*')
        .single();

      if (error) throw error;

      setStreamConfig(data);
      setIsLive(data?.is_live || false);
    } catch (error) {
      console.error('Error fetching stream config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamConfig();

    // Check stream status every 30 seconds
    const interval = setInterval(fetchStreamConfig, 30000);

    // Subscribe to realtime changes
    const channel = supabase
      .channel('live_stream_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_stream_config',
        },
        (payload) => {
          if (payload.new) {
            const newConfig = payload.new as StreamConfig;
            setStreamConfig(newConfig);
            setIsLive(newConfig.is_live);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return { isLive, streamConfig, isLoading, refetch: fetchStreamConfig };
};
