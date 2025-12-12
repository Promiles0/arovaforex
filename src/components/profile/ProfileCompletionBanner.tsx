import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProfileCompletionBannerProps {
  profile: {
    full_name: string | null;
    phone_number: string | null;
    country: string | null;
    telegram_handle: string | null;
    whatsapp_handle: string | null;
    bio: string | null;
    avatar_url: string | null;
  };
}

export const ProfileCompletionBanner = ({ profile }: ProfileCompletionBannerProps) => {
  const requiredFields = [
    { key: 'full_name', label: 'Full Name', completed: !!profile.full_name, weight: 25 },
    { key: 'country', label: 'Country', completed: !!profile.country, weight: 15 },
    { key: 'phone_number', label: 'Phone Number', completed: !!profile.phone_number, weight: 15 },
  ];

  const optionalFields = [
    { key: 'telegram_handle', label: 'Telegram', completed: !!profile.telegram_handle, weight: 10 },
    { key: 'whatsapp_handle', label: 'WhatsApp', completed: !!profile.whatsapp_handle, weight: 10 },
    { key: 'bio', label: 'Bio', completed: !!profile.bio && profile.bio.length > 10, weight: 15 },
    { key: 'avatar_url', label: 'Profile Picture', completed: !!profile.avatar_url, weight: 10 },
  ];

  const allFields = [...requiredFields, ...optionalFields];
  const completedWeight = allFields
    .filter(f => f.completed)
    .reduce((sum, f) => sum + f.weight, 0);
  
  const completionPercentage = Math.min(100, completedWeight);
  const missingRequired = requiredFields.filter(f => !f.completed);
  const missingOptional = optionalFields.filter(f => !f.completed);

  if (completionPercentage === 100) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-5 mb-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
            {completionPercentage >= 70 ? (
              <CheckCircle className="w-5 h-5 text-primary" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            )}
            Complete Your Profile
          </h3>
          <p className="text-sm text-muted-foreground">
            {completionPercentage}% complete — Unlock all features
          </p>
        </div>
        <div className="text-3xl">
          {completionPercentage >= 70 ? '🎯' : completionPercentage >= 40 ? '📝' : '🚀'}
        </div>
      </div>

      <Progress value={completionPercentage} className="h-2 mb-4" />

      {missingRequired.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Required fields:</p>
          <div className="flex flex-wrap gap-2">
            {missingRequired.map(field => (
              <span
                key={field.key}
                className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium"
              >
                Add {field.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {missingOptional.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Optional fields:</p>
          <div className="flex flex-wrap gap-2">
            {missingOptional.map(field => (
              <span
                key={field.key}
                className="px-3 py-1 bg-muted/50 text-muted-foreground rounded-full text-xs"
              >
                Add {field.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
