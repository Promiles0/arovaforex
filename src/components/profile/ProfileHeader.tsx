import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, TrendingUp, BookOpen, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserStats } from '@/hooks/useUserStats';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

interface ProfileHeaderProps {
  profile: any;
  onAvatarUpdate: (url: string) => void;
}

export const ProfileHeader = ({ profile, onAvatarUpdate }: ProfileHeaderProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useUserStats(profile?.user_id);

  // Real-time subscription for stats updates
  useEffect(() => {
    if (!profile?.user_id) return;

    const forecastChannel = supabase
      .channel('profile-forecast-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forecasts',
          filter: `user_id=eq.${profile.user_id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-stats', profile.user_id] });
        }
      )
      .subscribe();

    const journalChannel = supabase
      .channel('profile-journal-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `user_id=eq.${profile.user_id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-stats', profile.user_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(forecastChannel);
      supabase.removeChannel(journalChannel);
    };
  }, [profile?.user_id, queryClient]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      
      if (!file) return;
      
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image under 5MB",
          variant: "destructive"
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive"
        });
        return;
      }
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}-${Date.now()}.${fileExt}`;
      const filePath = `${profile.user_id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', profile.user_id);
      
      if (updateError) throw updateError;
      
      onAvatarUpdate(publicUrl);
      
      toast({
        title: "Success",
        description: "Profile photo updated successfully"
      });
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const displayName = profile.telegram_handle 
    ? `@${profile.telegram_handle}` 
    : profile.full_name || profile.email || 'User';

  return (
    <motion.div
      className="bg-card border rounded-xl p-8 mb-6"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
        <div className="relative group">
          <Avatar className="w-32 h-32 border-4 border-primary">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name} />
            <AvatarFallback className="text-3xl bg-primary/10">
              {profile.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          {uploading && (
            <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          <motion.label
            className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer border-4 border-background shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Camera size={20} className="text-primary-foreground" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
              className="hidden"
            />
          </motion.label>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-bold bg-gradient-text mb-1">
            {profile.full_name || 'Complete Your Profile'}
          </h2>
          <p className="text-muted-foreground text-lg mb-2">{displayName}</p>
          <p className="text-sm text-muted-foreground">
            Member since {new Date(profile.created_at).toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="bg-muted/50 rounded-lg p-4 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="text-primary" size={24} />
          </div>
          {statsLoading ? (
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
          ) : (
            <p className="text-2xl font-bold">{stats?.totalForecasts || 0}</p>
          )}
          <p className="text-sm text-muted-foreground">Forecasts</p>
        </motion.div>
        
        <motion.div
          className="bg-muted/50 rounded-lg p-4 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-center mb-2">
            <BookOpen className="text-primary" size={24} />
          </div>
          {statsLoading ? (
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
          ) : (
            <p className="text-2xl font-bold">{stats?.totalJournalEntries || 0}</p>
          )}
          <p className="text-sm text-muted-foreground">Journal Entries</p>
        </motion.div>
        
        <motion.div
          className="bg-muted/50 rounded-lg p-4 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-center mb-2">
            <Award className="text-primary" size={24} />
          </div>
          {statsLoading ? (
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
          ) : (
            <p className="text-2xl font-bold">{stats?.winRate || 0}%</p>
          )}
          <p className="text-sm text-muted-foreground">Win Rate</p>
        </motion.div>
      </div>
    </motion.div>
  );
};
