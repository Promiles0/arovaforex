import { Check, Loader2, X, Clock } from 'lucide-react';
import { Accordion } from '@/components/ui/accordion';
import { useJournalSettings } from '@/hooks/useJournalSettings';
import { DisplayPreferencesSection } from './DisplayPreferencesSection';
import { EntryDefaultsSection } from './EntryDefaultsSection';
import { PrivacySharingSection } from './PrivacySharingSection';
import { NotificationsSection } from './NotificationsSection';
import { AnalyticsSection } from './AnalyticsSection';
import { DataManagementSection } from './DataManagementSection';
import { DangerZoneSection } from './DangerZoneSection';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function JournalSettings() {
  const { settings, loading, saveStatus, lastSaved, updateSetting, resetToDefaults } = useJournalSettings();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-6 w-32" />
        </div>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load settings. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Journal Settings</h2>
          <p className="text-muted-foreground">Configure your journal preferences and sharing options</p>
        </div>
        
        {/* Save Status */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
          saveStatus === 'saving' && "bg-muted text-muted-foreground",
          saveStatus === 'saved' && "bg-emerald-500/10 text-emerald-500",
          saveStatus === 'error' && "bg-destructive/10 text-destructive",
          saveStatus === 'idle' && lastSaved && "bg-muted/50 text-muted-foreground"
        )}>
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="h-4 w-4" />
              <span>Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <X className="h-4 w-4" />
              <span>Failed to save</span>
            </>
          )}
          {saveStatus === 'idle' && lastSaved && (
            <>
              <Clock className="h-3 w-3" />
              <span>Last saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
            </>
          )}
        </div>
      </div>

      {/* Settings Sections */}
      <Accordion type="multiple" defaultValue={['display']} className="space-y-4">
        <DisplayPreferencesSection settings={settings} onUpdate={updateSetting} />
        <EntryDefaultsSection settings={settings} onUpdate={updateSetting} />
        <PrivacySharingSection settings={settings} onUpdate={updateSetting} />
        <NotificationsSection settings={settings} onUpdate={updateSetting} />
        <AnalyticsSection settings={settings} onUpdate={updateSetting} />
        <DataManagementSection settings={settings} onUpdate={updateSetting} />
        <DangerZoneSection onResetToDefaults={resetToDefaults} />
      </Accordion>
    </div>
  );
}
