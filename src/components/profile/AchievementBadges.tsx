import { motion } from 'framer-motion';
import { UserStats } from '@/hooks/useUserStats';

interface AchievementBadgesProps {
  stats: UserStats | undefined;
  isLoading: boolean;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  color: string;
}

export const AchievementBadges = ({ stats, isLoading }: AchievementBadgesProps) => {
  const badges: Badge[] = [
    {
      id: 'first-forecast',
      name: 'First Forecast',
      icon: '🎯',
      description: 'Created your first forecast',
      unlocked: (stats?.totalForecasts || 0) >= 1,
      color: 'emerald',
    },
    {
      id: 'forecast-master',
      name: 'Forecast Master',
      icon: '👑',
      description: 'Created 50 forecasts',
      unlocked: (stats?.totalForecasts || 0) >= 50,
      color: 'amber',
    },
    {
      id: 'sharp-shooter',
      name: 'Sharp Shooter',
      icon: '🎪',
      description: '70%+ win rate',
      unlocked: (stats?.winRate || 0) >= 70,
      color: 'purple',
    },
    {
      id: 'streak-keeper',
      name: 'Streak Keeper',
      icon: '🔥',
      description: '7-day active streak',
      unlocked: (stats?.activeStreak || 0) >= 7,
      color: 'orange',
    },
    {
      id: 'popular',
      name: 'Popular Analyst',
      icon: '⭐',
      description: '100+ total views',
      unlocked: (stats?.totalViews || 0) >= 100,
      color: 'blue',
    },
    {
      id: 'journal-keeper',
      name: 'Journal Keeper',
      icon: '📖',
      description: '20+ journal entries',
      unlocked: (stats?.totalJournalEntries || 0) >= 20,
      color: 'indigo',
    },
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/30 animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  const colorClasses: Record<string, { bg: string; border: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-xl p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span>🏆</span>
          Achievements
        </h3>
        <span className="text-sm text-muted-foreground">
          {unlockedCount} / {badges.length} Unlocked
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`
              relative p-4 rounded-lg text-center transition-all duration-300 border
              ${badge.unlocked
                ? `${colorClasses[badge.color]?.bg} ${colorClasses[badge.color]?.border} hover:scale-105`
                : 'bg-muted/20 border-border/50 opacity-50 grayscale'
              }
            `}
          >
            <div className={`text-3xl mb-2 ${badge.unlocked ? '' : 'grayscale opacity-50'}`}>
              {badge.icon}
            </div>
            <div className="text-xs font-medium text-foreground mb-1 truncate">
              {badge.name}
            </div>
            <div className="text-[10px] text-muted-foreground line-clamp-2">
              {badge.description}
            </div>

            {badge.unlocked && (
              <div className="absolute top-2 right-2">
                <span className="w-2 h-2 bg-primary rounded-full block animate-pulse" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
