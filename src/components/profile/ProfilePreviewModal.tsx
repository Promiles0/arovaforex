import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, TrendingUp, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    telegram_handle: string | null;
    email: string | null;
    country: string | null;
    bio: string | null;
    trading_style: string | null;
    experience_level: string | null;
    risk_tolerance: string | null;
    created_at: string;
  };
}

export const ProfilePreviewModal = ({ isOpen, onClose, profile }: ProfilePreviewModalProps) => {
  const displayName = profile.telegram_handle 
    ? `@${profile.telegram_handle}` 
    : profile.full_name || profile.email || 'User';

  const getExperienceBadgeColor = (level: string | null) => {
    switch (level) {
      case 'beginner': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'intermediate': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'advanced': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'expert': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile Preview</DialogTitle>
          <p className="text-sm text-muted-foreground">
            This is how other users will see your profile
          </p>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-border">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <h3 className="text-2xl font-bold text-foreground mb-1">{displayName}</h3>
              {profile.country && (
                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <MapPin size={16} />
                  <span>{profile.country}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={16} />
              <span>
                Member since {new Date(profile.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">About</h4>
              <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Trading Info */}
          {(profile.trading_style || profile.experience_level || profile.risk_tolerance) && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Trading Profile</h4>
              
              <div className="grid grid-cols-1 gap-3">
                {profile.trading_style && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                    <TrendingUp size={20} className="text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Trading Style</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {profile.trading_style.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                )}

                {profile.experience_level && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                    <Target size={20} className="text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-2">Experience Level</p>
                      <Badge className={getExperienceBadgeColor(profile.experience_level)}>
                        {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)}
                      </Badge>
                    </div>
                  </div>
                )}

                {profile.risk_tolerance && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Risk Tolerance</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {profile.risk_tolerance}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!profile.bio && !profile.trading_style && !profile.experience_level && !profile.risk_tolerance && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Complete your profile to show more information to other traders</p>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
