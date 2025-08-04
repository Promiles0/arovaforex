import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  country: string | null;
  phone_number: string | null;
  telegram_handle: string | null;
  whatsapp_handle: string | null;
}

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const countries = [
    "Afghanistan", "Albania", "Algeria", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Chad", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Estonia", "Ethiopia", "Finland", "France", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon", "Libya", "Lithuania", "Luxembourg", "Malaysia", "Mali", "Mexico", "Morocco", "Mozambique", "Myanmar", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "Norway", "Oman", "Pakistan", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland", "Syria", "Tanzania", "Thailand", "Tunisia", "Turkey", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      } else {
        // Create a new profile
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ user_id: user.id }])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          country: profile.country,
          phone_number: profile.phone_number,
          telegram_handle: profile.telegram_handle,
          whatsapp_handle: profile.whatsapp_handle,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (field: keyof Profile, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  const isProfileComplete = () => {
    return profile?.full_name && profile?.country && profile?.phone_number;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold text-primary">Profile Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Complete your profile to unlock all features including forecast uploads.
        </p>
      </div>

      <Card className="border-primary/20 shadow-brand">
        <CardHeader>
          <CardTitle className="text-primary">Personal Information</CardTitle>
          <CardDescription>
            Fill out your profile details. Fields marked with * are required to submit forecasts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={profile?.full_name || ''}
              onChange={(e) => updateProfile('full_name', e.target.value)}
              placeholder="Enter your full name"
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <Select
              value={profile?.country || ''}
              onValueChange={(value) => updateProfile('country', value)}
            >
              <SelectTrigger className="border-primary/20 focus:border-primary">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={profile?.phone_number || ''}
              onChange={(e) => updateProfile('phone_number', e.target.value)}
              placeholder="Enter your phone number"
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <Label htmlFor="telegram">Telegram Handle (Optional)</Label>
            <Input
              id="telegram"
              value={profile?.telegram_handle || ''}
              onChange={(e) => updateProfile('telegram_handle', e.target.value)}
              placeholder="@username"
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp Handle (Optional)</Label>
            <Input
              id="whatsapp"
              value={profile?.whatsapp_handle || ''}
              onChange={(e) => updateProfile('whatsapp_handle', e.target.value)}
              placeholder="WhatsApp contact info"
              className="border-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm">
              {isProfileComplete() ? (
                <span className="text-success">✓ Profile is complete</span>
              ) : (
                <span className="text-warning">Profile incomplete - complete to submit forecasts</span>
              )}
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}