import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  full_name: string | null;
  telegram_handle: string | null;
  email: string | null;
}

interface UserDisplayNameProps {
  profile?: Profile | null;
  userId?: string;
  className?: string;
  showFallback?: boolean;
}

export const UserDisplayName = ({ 
  profile: initialProfile, 
  userId,
  className = '',
  showFallback = true 
}: UserDisplayNameProps) => {
  const [profile, setProfile] = useState<Profile | null>(initialProfile || null);

  useEffect(() => {
    if (!userId) return;

    // Fetch profile if not provided
    if (!initialProfile) {
      fetchProfile();
    }

    // Set up real-time subscription
    const channel = supabase
      .channel(`profile-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, initialProfile]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('full_name, telegram_handle, email')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  // Priority: Telegram Handle > Full Name > Email (if showFallback)
  const displayName = profile?.telegram_handle 
    ? `@${profile.telegram_handle}` 
    : profile?.full_name || (showFallback ? profile?.email || 'User' : '');

  return <span className={className}>{displayName}</span>;
};
