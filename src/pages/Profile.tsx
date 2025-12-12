import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, TrendingUp, Settings, Eye, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PersonalInfoTab } from '@/components/profile/PersonalInfoTab';
import { TradingProfileTab } from '@/components/profile/TradingProfileTab';
import { PreferencesTab } from '@/components/profile/PreferencesTab';
import { ProfilePreviewModal } from '@/components/profile/ProfilePreviewModal';
import { ProfileCompletionBanner } from '@/components/profile/ProfileCompletionBanner';
import { AchievementBadges } from '@/components/profile/AchievementBadges';
import { RecentActivity } from '@/components/profile/RecentActivity';
import { SEO } from '@/components/seo/SEO';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUserStats } from '@/hooks/useUserStats';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  country: string | null;
  phone_number: string | null;
  telegram_handle: string | null;
  whatsapp_handle: string | null;
  bio: string | null;
  avatar_url: string | null;
  trading_style: string | null;
  experience_level: string | null;
  risk_tolerance: string | null;
  trading_goals: string | null;
  notify_like: boolean;
  notify_bookmark: boolean;
  notify_comment: boolean;
  notify_announcement: boolean;
  notify_system: boolean;
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  created_at: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { data: stats, isLoading: statsLoading } = useUserStats(user?.id);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (updatedData: Partial<Profile>) => {
    if (profile) {
      setProfile({ ...profile, ...updatedData });
    }
  };

  const handleAvatarUpdate = (url: string) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: url });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Profile not found</h2>
        <p className="text-muted-foreground">Unable to load your profile. Please try again.</p>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Profile Settings"
        description="Manage your ArovaForex profile, trading preferences, and notification settings"
      />
      
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-text mb-2">Profile Settings</h1>
              <p className="text-muted-foreground">
                Complete your profile to unlock all features and personalize your experience
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2"
              >
                <Eye size={16} />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>

          {/* Profile Completion Banner */}
          <ProfileCompletionBanner profile={profile} />

          <ProfileHeader profile={profile} onAvatarUpdate={handleAvatarUpdate} />

          {/* Achievement Badges */}
          <AchievementBadges stats={stats} isLoading={statsLoading} />

          {/* Recent Activity */}
          {user && <RecentActivity userId={user.id} />}

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User size={16} />
                <span className="hidden sm:inline">Personal Info</span>
              </TabsTrigger>
              <TabsTrigger value="trading" className="flex items-center gap-2">
                <TrendingUp size={16} />
                <span className="hidden sm:inline">Trading Profile</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings size={16} />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
            </TabsList>

            <div className="bg-card border rounded-xl p-6">
              <TabsContent value="personal" className="mt-0">
                <PersonalInfoTab profile={profile} onUpdate={handleUpdate} />
              </TabsContent>

              <TabsContent value="trading" className="mt-0">
                <TradingProfileTab profile={profile} onUpdate={handleUpdate} />
              </TabsContent>

              <TabsContent value="preferences" className="mt-0">
                <PreferencesTab profile={profile} onUpdate={handleUpdate} />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </div>

      {profile && (
        <ProfilePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          profile={profile}
        />
      )}
    </>
  );
};

export default Profile;
