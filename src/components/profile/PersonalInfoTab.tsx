import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Globe, Phone, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PersonalInfoTabProps {
  profile: any;
  onUpdate: (data: any) => void;
}

export const PersonalInfoTab = ({ profile, onUpdate }: PersonalInfoTabProps) => {
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    country: profile.country || '',
    phone_number: profile.phone_number || '',
    telegram_handle: profile.telegram_handle || '',
    whatsapp_handle: profile.whatsapp_handle || '',
    bio: profile.bio || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  const handleChange = (field: string, value: string) => {
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
          full_name: formData.full_name,
          country: formData.country,
          phone_number: formData.phone_number,
          telegram_handle: formData.telegram_handle,
          whatsapp_handle: formData.whatsapp_handle,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);
      
      if (error) throw error;
      
      onUpdate(formData);
      setIsDirty(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const requiredFields = ['full_name', 'country', 'phone_number'];
  const completedRequired = requiredFields.filter(field => formData[field as keyof typeof formData]).length;
  const completionPercent = Math.round((completedRequired / requiredFields.length) * 100);
  const isComplete = completedRequired === requiredFields.length;

  return (
    <motion.form
      className="space-y-6"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="flex items-center gap-2">
            <User size={16} />
            Full Name *
          </Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country" className="flex items-center gap-2">
            <Globe size={16} />
            Country *
          </Label>
          <Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rwanda">Rwanda</SelectItem>
              <SelectItem value="Kenya">Kenya</SelectItem>
              <SelectItem value="Uganda">Uganda</SelectItem>
              <SelectItem value="Tanzania">Tanzania</SelectItem>
              <SelectItem value="Burundi">Burundi</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone_number" className="flex items-center gap-2">
            <Phone size={16} />
            Phone Number *
          </Label>
          <Input
            id="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={(e) => handleChange('phone_number', e.target.value)}
            placeholder="0790313166"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="telegram_handle" className="flex items-center gap-2">
            <MessageCircle size={16} />
            Telegram Handle
          </Label>
          <Input
            id="telegram_handle"
            value={formData.telegram_handle}
            onChange={(e) => handleChange('telegram_handle', e.target.value)}
            placeholder="@username"
          />
          <p className="text-xs text-muted-foreground">Used as your display name</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="whatsapp_handle">WhatsApp Handle</Label>
          <Input
            id="whatsapp_handle"
            value={formData.whatsapp_handle}
            onChange={(e) => handleChange('whatsapp_handle', e.target.value)}
            placeholder="WhatsApp contact"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleChange('bio', e.target.value)}
          placeholder="Tell us about yourself..."
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {formData.bio.length}/500 characters
        </p>
      </div>
      
      {/* Profile Completion */}
      <motion.div
        className="bg-muted/50 rounded-lg p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Profile Completion</h4>
          <span className="text-2xl font-bold text-primary">{completionPercent}%</span>
        </div>
        
        <div className="w-full h-3 bg-background rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-brand"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        
        <div className="mt-4">
          {isComplete ? (
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle size={20} />
              <span className="text-sm font-medium">Profile is complete!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertCircle size={20} />
              <span className="text-sm">Complete all required fields to unlock features</span>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={!isDirty || isSaving}
          className="flex-1 md:flex-none"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle size={16} className="mr-2" />
              Save Profile
            </>
          )}
        </Button>
        
        {isDirty && (
          <motion.p
            className="text-sm text-muted-foreground flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AlertCircle size={16} />
            You have unsaved changes
          </motion.p>
        )}
      </div>
    </motion.form>
  );
};
