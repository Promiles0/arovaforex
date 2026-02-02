

# Trading Journal Settings Page - Implementation Plan

## Overview

Build a comprehensive, fully-functional Settings panel for the Trading Journal feature, replacing the current "Settings panel coming soon" placeholder. The implementation will use real Supabase database integration with auto-save functionality, collapsible accordion sections, and a mobile-first responsive design matching ArovaForex's brand styling.

---

## Database Changes

### New Table: `journal_settings`

Create a new table to store user-specific journal preferences:

```sql
CREATE TABLE public.journal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Display Preferences
  default_currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  entries_per_page INTEGER DEFAULT 20,
  enable_animations BOOLEAN DEFAULT true,
  
  -- Entry Defaults  
  default_risk_reward_ratio DECIMAL DEFAULT 2.0,
  default_risk_percentage DECIMAL DEFAULT 1.0,
  default_position_size_method TEXT DEFAULT 'percentage' 
    CHECK (default_position_size_method IN ('percentage', 'fixed', 'units')),
  require_screenshots BOOLEAN DEFAULT false,
  require_trade_plan BOOLEAN DEFAULT false,
  require_post_trade_review BOOLEAN DEFAULT false,
  auto_fill_last_values BOOLEAN DEFAULT true,
  
  -- Privacy & Sharing
  journal_visibility TEXT DEFAULT 'private' 
    CHECK (journal_visibility IN ('private', 'mentors_only', 'public')),
  allow_mentors_view BOOLEAN DEFAULT true,
  allow_mentors_comment BOOLEAN DEFAULT true,
  share_statistics BOOLEAN DEFAULT false,
  anonymous_sharing BOOLEAN DEFAULT false,
  share_link TEXT,
  
  -- Notifications
  notify_milestone_achieved BOOLEAN DEFAULT true,
  notify_weekly_summary BOOLEAN DEFAULT true,
  notify_monthly_report BOOLEAN DEFAULT true,
  notify_mentor_feedback BOOLEAN DEFAULT true,
  notify_goal_reminder BOOLEAN DEFAULT true,
  notify_inactivity BOOLEAN DEFAULT true,
  inactivity_days INTEGER DEFAULT 7,
  notification_method TEXT DEFAULT 'both' 
    CHECK (notification_method IN ('email', 'in_app', 'both', 'disabled')),
  weekly_summary_day TEXT DEFAULT 'sunday',
  
  -- Analytics Preferences
  show_emotion_tracking BOOLEAN DEFAULT true,
  show_advanced_metrics BOOLEAN DEFAULT true,
  track_trading_psychology BOOLEAN DEFAULT true,
  auto_calculate_statistics BOOLEAN DEFAULT true,
  enable_goal_tracking BOOLEAN DEFAULT true,
  monthly_profit_target DECIMAL,
  win_rate_target DECIMAL,
  max_drawdown_limit DECIMAL,
  
  -- Data Management
  auto_backup_enabled BOOLEAN DEFAULT true,
  backup_frequency TEXT DEFAULT 'weekly' 
    CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
  data_retention_days INTEGER DEFAULT 365,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.journal_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings"
  ON public.journal_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.journal_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.journal_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_journal_settings_user_id ON public.journal_settings(user_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_journal_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_journal_settings_updated_at
  BEFORE UPDATE ON public.journal_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_settings_timestamp();
```

### New Table: `journal_backup_history`

Track backup history for the data management section:

```sql
CREATE TABLE public.journal_backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  backup_type TEXT CHECK (backup_type IN ('manual', 'automatic')),
  backup_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  entries_count INTEGER NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.journal_backup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backups"
  ON public.journal_backup_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backups"
  ON public.journal_backup_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups"
  ON public.journal_backup_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_backup_history_user_id ON public.journal_backup_history(user_id);
CREATE INDEX idx_backup_history_created_at ON public.journal_backup_history(created_at DESC);
```

### Storage Bucket

Create a storage bucket for journal backups and exports:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('journal-backups', 'journal-backups', false);

-- RLS for the bucket
CREATE POLICY "Users can upload own backups"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'journal-backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own backups"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'journal-backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own backups"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'journal-backups' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## File Changes

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/journal/settings/JournalSettings.tsx` | Main settings component with all sections |
| `src/components/journal/settings/DisplayPreferencesSection.tsx` | Display & format settings section |
| `src/components/journal/settings/EntryDefaultsSection.tsx` | Default entry settings section |
| `src/components/journal/settings/PrivacySharingSection.tsx` | Privacy & sharing settings section |
| `src/components/journal/settings/NotificationsSection.tsx` | Notification preferences section |
| `src/components/journal/settings/AnalyticsSection.tsx` | Analytics preferences section |
| `src/components/journal/settings/DataManagementSection.tsx` | Data & backup management section |
| `src/components/journal/settings/DangerZoneSection.tsx` | Danger zone for destructive actions |
| `src/hooks/useJournalSettings.ts` | Custom hook for fetching/saving settings with auto-save |
| `src/components/journal/settings/index.ts` | Barrel export file |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Journal.tsx` | Replace placeholder with `<JournalSettings />` component |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |

---

## Component Architecture

### Main Component: `JournalSettings.tsx`

```
┌─────────────────────────────────────────────────────────────┐
│ Journal Settings                                            │
│ Configure your journal preferences and sharing options      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ Saved • Last updated: 2 minutes ago                  │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎨 Display & Format Preferences                    [v]  │ │
│ │─────────────────────────────────────────────────────────│ │
│ │ [Expanded content: currency, timezone, date/time, etc] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✍️ Default Entry Settings                          [>]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔒 Privacy & Sharing                               [>]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔔 Notifications                                   [>]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 Analytics & Tracking                            [>]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 💾 Data & Backup Management                        [>]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ Danger Zone                    [border-destructive] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Auto-Save Hook: `useJournalSettings.ts`

Key features:
- Fetches settings on mount (creates defaults if none exist)
- Debounced auto-save (1 second after last change)
- Save status tracking: `idle`, `saving`, `saved`, `error`
- Optimistic updates with rollback on error
- Returns: `{ settings, updateSetting, saveStatus, lastSaved, resetToDefaults }`

```typescript
interface UseJournalSettingsReturn {
  settings: JournalSettings | null;
  loading: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  updateSetting: <K extends keyof JournalSettings>(key: K, value: JournalSettings[K]) => void;
  updateSettings: (updates: Partial<JournalSettings>) => void;
  resetToDefaults: () => Promise<void>;
}
```

---

## Section Details

### Section 1: Display & Format Preferences

**Icon:** Palette (lucide-react)

| Setting | Type | Options/Range |
|---------|------|---------------|
| Currency | Select | USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD, RWF |
| Timezone | Searchable Select | All IANA timezones + "Detect my timezone" button |
| Date Format | Radio Group | MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, DD MMM YYYY |
| Time Format | Toggle | 12h / 24h with live preview |
| Entries Per Page | Slider | 10-100, step 10 |
| Enable Animations | Switch | On/Off |

**Live Preview:** Shows current date/time in selected format

### Section 2: Default Entry Settings

**Icon:** FileEdit (lucide-react)

| Setting | Type | Options/Range |
|---------|------|---------------|
| Default R:R Ratio | Number Input | 0.5-10.0, step 0.1 |
| Default Risk % | Number Input | 0.1%-5.0%, step 0.1 |
| Position Size Method | Radio Group | Percentage, Fixed Amount, Units/Lots |
| Require Screenshots | Switch | On/Off |
| Require Trade Plan | Switch | On/Off |
| Require Post-Trade Review | Switch | On/Off |
| Auto-fill Last Values | Switch | On/Off |

### Section 3: Privacy & Sharing

**Icon:** Lock (lucide-react)

| Setting | Type | Options/Range |
|---------|------|---------------|
| Journal Visibility | Radio Cards | Private, Mentors Only, Public |
| Allow Mentors View | Switch | On/Off (conditional) |
| Allow Mentors Comment | Switch | On/Off (conditional) |
| Share Statistics | Switch | On/Off |
| Anonymous Sharing | Switch | On/Off |
| Share Link | Button + Copy | Generate/Revoke/Copy link |

### Section 4: Notifications

**Icon:** Bell (lucide-react)

| Setting | Type | Options/Range |
|---------|------|---------------|
| Notification Method | Radio Group | Email, In-App, Both, Disabled |
| Milestone Achievements | Switch | On/Off |
| Weekly Summary | Switch + Day Select | On/Off + weekday dropdown |
| Monthly Report | Switch | On/Off |
| Mentor Feedback | Switch | On/Off |
| Goal Reminders | Switch | On/Off |
| Inactivity Reminder | Switch + Days Input | On/Off + 3/7/14 days dropdown |

### Section 5: Analytics & Tracking

**Icon:** BarChart3 (lucide-react)

| Setting | Type | Options/Range |
|---------|------|---------------|
| Emotion Tracking | Switch | On/Off |
| Advanced Metrics | Switch + Info Tooltip | On/Off |
| Trading Psychology | Switch | On/Off |
| Auto-Calculate Stats | Switch | On/Off |
| Enable Goal Tracking | Switch | On/Off |
| Monthly Profit Target | Number Input | Conditional on goal tracking |
| Win Rate Target | Number Input (%) | Conditional on goal tracking |
| Max Drawdown Limit | Number Input (%) | Conditional on goal tracking |

### Section 6: Data & Backup Management

**Icon:** Database (lucide-react)

| Feature | Type | Description |
|---------|------|-------------|
| Auto Backup | Switch + Frequency Select | On/Off + daily/weekly/monthly |
| Manual Backup | Button | Create backup now with progress |
| Backup History | Table | Date, Type, Size, Entries, Download, Delete |
| Export Data | Button Group + Date Range | CSV, JSON, PDF formats |
| Import Data | File Upload + Dropzone | CSV, JSON with validation preview |
| Data Retention | Select | Forever, 1yr, 2yrs, 5yrs |

### Section 7: Danger Zone

**Icon:** AlertTriangle (lucide-react)  
**Border:** `border-destructive`

| Action | Type | Confirmation |
|--------|------|--------------|
| Reset Settings | Button (outline) | Confirmation dialog |
| Delete All Journal Data | Button (destructive) | Type "DELETE" + password |

---

## UI/UX Specifications

### Save Status Indicator

Located in the header, shows real-time save status:

```
┌─────────────────────────────────────────────────┐
│ ⏳ Saving...          (gray, spinner)           │
│ ✓ Saved               (emerald, checkmark)      │
│ ✗ Failed to save      (red, retry button)       │
│ Last saved: 2 min ago (muted text)              │
└─────────────────────────────────────────────────┘
```

### Accordion Behavior

- **Mobile:** Single section open at a time (type="single")
- **Desktop:** Multiple sections can be open (type="multiple")
- Smooth animation using existing `animate-accordion-down/up` classes
- Chevron rotation on expand/collapse

### Toggle Switch Styling

- Uses existing `Switch` component from shadcn/ui
- Emerald color when ON (matches brand)
- Gray when OFF
- Disabled state at 50% opacity

### Form Input Styling

- Uses existing `journal-input` class for consistent styling
- Focus state with emerald ring
- Helper text in `text-muted-foreground`
- Error state with red border

---

## Responsive Design

### Mobile (< 768px)

- All sections collapsed by default
- Single accordion mode
- Full-width inputs and selects
- Stacked layout for setting rows
- Native select dropdowns
- Larger touch targets (min 44px)

### Tablet (768px - 1024px)

- 2-column grid for some settings
- Multiple accordion mode
- Standard select components

### Desktop (> 1024px)

- Multi-column layouts where appropriate
- Multiple accordion mode
- Hover effects enabled
- Side-by-side labels and controls

---

## Technical Implementation

### Settings State Management

```typescript
// useJournalSettings.ts
const useJournalSettings = () => {
  const [settings, setSettings] = useState<JournalSettings | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced save function
  const debouncedSave = useCallback((newSettings: JournalSettings) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await supabase
          .from('journal_settings')
          .upsert(newSettings, { onConflict: 'user_id' });
        setSaveStatus('saved');
        setLastSaved(new Date());
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('error');
      }
    }, 1000);
  }, []);

  // ... fetch, update, reset functions
};
```

### Export Implementation

```typescript
const exportData = async (format: 'csv' | 'json' | 'pdf', dateRange: DateRange) => {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', dateRange.start)
    .lte('created_at', dateRange.end);

  if (format === 'csv') {
    const csv = convertToCSV(entries);
    downloadFile(csv, 'journal-export.csv', 'text/csv');
  } else if (format === 'json') {
    downloadFile(JSON.stringify(entries, null, 2), 'journal-export.json', 'application/json');
  }
  // PDF would require additional library (e.g., jspdf)
};
```

### Backup Implementation

```typescript
const createBackup = async () => {
  setBackupLoading(true);
  
  // 1. Fetch all journal data
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id);

  // 2. Create backup object
  const backupData = {
    version: '1.0',
    created_at: new Date().toISOString(),
    entries,
    settings
  };

  // 3. Upload to storage
  const fileName = `${user.id}/backup-${Date.now()}.json`;
  const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
  
  await supabase.storage
    .from('journal-backups')
    .upload(fileName, blob);

  // 4. Record in history
  await supabase.from('journal_backup_history').insert({
    user_id: user.id,
    backup_type: 'manual',
    backup_url: fileName,
    file_size: blob.size,
    entries_count: entries.length
  });
};
```

---

## Integration with Journal Page

Update `src/pages/Journal.tsx` to use the new settings component:

```tsx
// In the Settings TabsContent (line 568-584)
<TabsContent value="settings" className="space-y-6 mt-6">
  <JournalSettings />
</TabsContent>
```

---

## File Summary

| Action | File |
|--------|------|
| DATABASE | Migration for `journal_settings`, `journal_backup_history`, storage bucket |
| CREATE | `src/components/journal/settings/JournalSettings.tsx` |
| CREATE | `src/components/journal/settings/DisplayPreferencesSection.tsx` |
| CREATE | `src/components/journal/settings/EntryDefaultsSection.tsx` |
| CREATE | `src/components/journal/settings/PrivacySharingSection.tsx` |
| CREATE | `src/components/journal/settings/NotificationsSection.tsx` |
| CREATE | `src/components/journal/settings/AnalyticsSection.tsx` |
| CREATE | `src/components/journal/settings/DataManagementSection.tsx` |
| CREATE | `src/components/journal/settings/DangerZoneSection.tsx` |
| CREATE | `src/hooks/useJournalSettings.ts` |
| CREATE | `src/components/journal/settings/index.ts` |
| MODIFY | `src/pages/Journal.tsx` |
| MODIFY | `src/integrations/supabase/types.ts` (auto-updated) |

---

## Animations

Uses existing journal animation classes plus:

- Accordion expand/collapse: `animate-accordion-down/up`
- Save indicator: fade in/out with Framer Motion
- Section cards: `journal-glassmorphism` class
- Hover effects: scale 1.02 on interactive elements
- Toggle transitions: 300ms ease

---

## Key Features Summary

1. **Real Database Integration** - All settings stored in Supabase with RLS
2. **Auto-Save** - 1-second debounced saves with visual feedback
3. **Collapsible Sections** - Accordion-style sections using Radix UI
4. **Responsive Design** - Mobile-first with proper touch targets
5. **Brand Consistent** - Uses existing journal styles and emerald theme
6. **Data Export/Import** - CSV, JSON formats with date range selection
7. **Backup System** - Manual and automatic backups to Supabase Storage
8. **Live Previews** - Date/time format previews update in real-time
9. **Danger Zone** - Protected destructive actions with confirmations

