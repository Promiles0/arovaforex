import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Video, Save, Eye, EyeOff, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StreamConfig {
  id: string;
  video_id: string;
  is_live: boolean;
  title: string;
  description: string | null;
  scheduled_start: string | null;
  thumbnail_url: string | null;
}

const LiveStreamControl = () => {
  const [config, setConfig] = useState<StreamConfig>({
    id: '',
    video_id: '',
    is_live: false,
    title: 'Live Trading Session',
    description: '',
    scheduled_start: null,
    thumbnail_url: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('live_stream_config')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setConfig({
          ...data,
          description: data.description || '',
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load stream configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('live_stream_config')
        .update({
          video_id: config.video_id,
          is_live: config.is_live,
          title: config.title,
          description: config.description || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (error) throw error;

      toast.success('Live stream configuration updated!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to update configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLiveStatus = async () => {
    const newStatus = !config.is_live;
    setConfig({ ...config, is_live: newStatus });
    
    try {
      const { error } = await supabase
        .from('live_stream_config')
        .update({
          is_live: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (error) throw error;

      toast.success(newStatus ? '🔴 Stream is now LIVE!' : 'Stream is now offline');
    } catch (error) {
      console.error('Error toggling status:', error);
      setConfig({ ...config, is_live: !newStatus });
      toast.error('Failed to update stream status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
          <span className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </span>
          Live Stream Control
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your live trading room stream settings
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Stream Configuration</CardTitle>
              <CardDescription>
                Configure your YouTube Live stream settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Live Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${config.is_live ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground'}`} />
                  <div>
                    <div className="font-medium text-foreground">Stream Status</div>
                    <div className="text-sm text-muted-foreground">
                      {config.is_live ? '🔴 Live Now' : '⚫ Offline'}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={config.is_live}
                  onCheckedChange={toggleLiveStatus}
                />
              </div>

              {/* Video ID Input */}
              <div className="space-y-2">
                <Label htmlFor="videoId">YouTube Video ID</Label>
                <Input
                  id="videoId"
                  value={config.video_id}
                  onChange={(e) => setConfig({ ...config, video_id: e.target.value })}
                  placeholder="e.g., dQw4w9WgXcQ"
                />
                <p className="text-xs text-muted-foreground">
                  Extract from YouTube Live URL: youtube.com/watch?v=<strong>VIDEO_ID</strong>
                </p>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Stream Title</Label>
                <Input
                  id="title"
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  placeholder="Live Trading Session"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={config.description || ''}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  placeholder="Describe your live session..."
                  rows={3}
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preview Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {config.video_id ? (
                  <Eye className="w-5 h-5 text-primary" />
                ) : (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                )}
                Preview
              </CardTitle>
              <CardDescription>
                {config.video_id ? 'Live preview of your stream' : 'Enter a video ID to see preview'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config.video_id ? (
                <div className="space-y-4">
                  <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                    <iframe
  className="absolute top-0 left-0 w-full h-full"
  src={`https://www.youtube.com/embed/${config.video_id}?origin=${encodeURIComponent(window.location.origin)}&autoplay=1`}
  title="Stream Preview"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  referrerPolicy="strict-origin-when-cross-origin"
  allowFullScreen
/>

                  </div>
                  <div className="p-4 bg-muted rounded-xl">
                    <h4 className="font-semibold text-foreground">{config.title}</h4>
                    {config.description && (
                      <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-xl">
                  <Video className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No video ID configured</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant={config.is_live ? "destructive" : "default"}
                className="w-full gap-2"
                onClick={toggleLiveStatus}
              >
                <Radio className="w-4 h-4" />
                {config.is_live ? 'Go Offline' : 'Go Live Now'}
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open(`https://studio.youtube.com/video/${config.video_id}/livestreaming`, '_blank')}
                disabled={!config.video_id}
              >
                <Video className="w-4 h-4" />
                Open YouTube Studio
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveStreamControl;
