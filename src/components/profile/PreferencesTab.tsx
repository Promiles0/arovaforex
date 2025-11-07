import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PreferencesTabProps {
  profile: any;
  onUpdate: (data: any) => void;
}

export const PreferencesTab = ({ profile, onUpdate }: PreferencesTabProps) => {
  const [formData, setFormData] = useState({
    notify_like: profile.notify_like ?? true,
    notify_bookmark: profile.notify_bookmark ?? true,
    notify_comment: profile.notify_comment ?? true,
    notify_announcement: profile.notify_announcement ?? true,
    notify_system: profile.notify_system ?? true,
    email_notifications_enabled: profile.email_notifications_enabled ?? false,
    push_notifications_enabled: profile.push_notifications_enabled ?? false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          notify_like: formData.notify_like,
          notify_bookmark: formData.notify_bookmark,
          notify_comment: formData.notify_comment,
          notify_announcement: formData.notify_announcement,
          notify_system: formData.notify_system,
          email_notifications_enabled: formData.email_notifications_enabled,
          push_notifications_enabled: formData.push_notifications_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);
      
      if (error) throw error;
      
      onUpdate(formData);
      setIsDirty(false);
      
      toast({
        title: "Success",
        description: "Preferences updated successfully"
      });
      
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.form
      className="space-y-6"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell size={20} className="text-primary" />
            In-App Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="notify_like" className="font-medium">Likes</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone likes your forecast</p>
              </div>
              <Switch
                id="notify_like"
                checked={formData.notify_like}
                onCheckedChange={(checked) => handleChange('notify_like', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="notify_bookmark" className="font-medium">Bookmarks</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone bookmarks your forecast</p>
              </div>
              <Switch
                id="notify_bookmark"
                checked={formData.notify_bookmark}
                onCheckedChange={(checked) => handleChange('notify_bookmark', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="notify_comment" className="font-medium">Comments</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone comments on your forecast</p>
              </div>
              <Switch
                id="notify_comment"
                checked={formData.notify_comment}
                onCheckedChange={(checked) => handleChange('notify_comment', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="notify_announcement" className="font-medium">Announcements</Label>
                <p className="text-sm text-muted-foreground">Receive platform announcements and updates</p>
              </div>
              <Switch
                id="notify_announcement"
                checked={formData.notify_announcement}
                onCheckedChange={(checked) => handleChange('notify_announcement', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="notify_system" className="font-medium">System Notifications</Label>
                <p className="text-sm text-muted-foreground">Important system alerts and maintenance notices</p>
              </div>
              <Switch
                id="notify_system"
                checked={formData.notify_system}
                onCheckedChange={(checked) => handleChange('notify_system', checked)}
              />
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail size={20} className="text-primary" />
            External Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="email_notifications" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                id="email_notifications"
                checked={formData.email_notifications_enabled}
                onCheckedChange={(checked) => handleChange('email_notifications_enabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="push_notifications" className="font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
              </div>
              <Switch
                id="push_notifications"
                checked={formData.push_notifications_enabled}
                onCheckedChange={(checked) => handleChange('push_notifications_enabled', checked)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <Button
        type="submit"
        disabled={!isDirty || isSaving}
        className="w-full md:w-auto"
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Saving...
          </>
        ) : (
          <>
            <CheckCircle size={16} className="mr-2" />
            Save Preferences
          </>
        )}
      </Button>
    </motion.form>
  );
};
