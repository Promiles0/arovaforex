

# Trading Journal Dual Mode System - Implementation Plan

## Overview

Transform the existing Trading Journal into a dual-mode system where users can seamlessly switch between **Manual Mode** (current functionality) and **Automatic Mode** (broker auto-sync with MT4/MT5 integration). Both modes share the same core features (Entries, Calendar, Analytics, Settings) but with different data sources and UI enhancements.

---

## Database Changes

### 1. New Table: `broker_connections`

Stores user broker connections for auto-sync functionality:

```sql
CREATE TABLE public.broker_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('metatrader', 'file_upload', 'email')),
  broker_name TEXT,
  account_number TEXT,
  connection_code TEXT UNIQUE,
  platform TEXT CHECK (platform IN ('mt4', 'mt5')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disconnected', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT DEFAULT 'realtime' CHECK (sync_frequency IN ('realtime', '5min', '15min', 'manual')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" 
  ON public.broker_connections FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" 
  ON public.broker_connections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" 
  ON public.broker_connections FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" 
  ON public.broker_connections FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX idx_broker_connections_user_id ON public.broker_connections(user_id);
CREATE INDEX idx_broker_connections_code ON public.broker_connections(connection_code);
```

### 2. New Table: `import_history`

Tracks all trade import events:

```sql
CREATE TABLE public.import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES public.broker_connections(id) ON DELETE SET NULL,
  import_type TEXT NOT NULL CHECK (import_type IN ('mt_sync', 'file_upload', 'email_import', 'manual')),
  source_name TEXT,
  trades_imported INTEGER DEFAULT 0,
  trades_skipped INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'partial', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import history" 
  ON public.import_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import history" 
  ON public.import_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_import_history_user_id ON public.import_history(user_id);
CREATE INDEX idx_import_history_created_at ON public.import_history(created_at DESC);
```

### 3. Extend `journal_settings` Table

Add mode and auto-sync preferences:

```sql
ALTER TABLE public.journal_settings 
  ADD COLUMN IF NOT EXISTS journal_mode TEXT DEFAULT 'manual' 
    CHECK (journal_mode IN ('manual', 'auto')),
  ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_frequency TEXT DEFAULT 'realtime' 
    CHECK (sync_frequency IN ('realtime', '5min', '15min', 'manual')),
  ADD COLUMN IF NOT EXISTS skip_duplicates BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_categorize BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_new_trades BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS import_closed_only BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS first_auto_setup_complete BOOLEAN DEFAULT false;
```

### 4. Extend `journal_entries` Table

Add fields to support auto-imported trades:

```sql
ALTER TABLE public.journal_entries 
  ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'manual' 
    CHECK (import_source IN ('manual', 'mt4', 'mt5', 'file_upload', 'email')),
  ADD COLUMN IF NOT EXISTS auto_imported BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_ticket TEXT,
  ADD COLUMN IF NOT EXISTS broker_name TEXT,
  ADD COLUMN IF NOT EXISTS notes_added BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS trade_reasoning TEXT,
  ADD COLUMN IF NOT EXISTS import_id UUID REFERENCES public.import_history(id) ON DELETE SET NULL;

-- Unique constraint to prevent duplicate imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_external_trade 
  ON public.journal_entries(user_id, external_ticket, broker_name) 
  WHERE external_ticket IS NOT NULL;
```

---

## File Changes Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `src/components/journal/mode/JournalModeToggle.tsx` | Glassmorphic mode toggle switch |
| CREATE | `src/components/journal/mode/AutoModeWelcome.tsx` | First-time welcome modal |
| CREATE | `src/components/journal/mode/ConnectionMethodSelector.tsx` | Connection method cards |
| CREATE | `src/components/journal/mode/MetaTraderSetup.tsx` | MT4/MT5 setup wizard |
| CREATE | `src/components/journal/mode/FileUploadSetup.tsx` | File upload interface |
| CREATE | `src/components/journal/mode/EmailSetup.tsx` | Email auto-import setup |
| CREATE | `src/components/journal/mode/ConnectionSuccess.tsx` | Success confirmation with confetti |
| CREATE | `src/components/journal/mode/ConnectionStatusBar.tsx` | Active connection status bar |
| CREATE | `src/components/journal/mode/index.ts` | Barrel exports |
| CREATE | `src/components/journal/auto/AutoEntryCard.tsx` | Entry card with notes expansion |
| CREATE | `src/components/journal/auto/NotesEditor.tsx` | Expandable notes/reasoning editor |
| CREATE | `src/components/journal/auto/ImportHistoryList.tsx` | Import history table |
| CREATE | `src/components/journal/auto/index.ts` | Barrel exports |
| CREATE | `src/hooks/useJournalMode.ts` | Mode state management hook |
| CREATE | `src/hooks/useBrokerConnections.ts` | Broker connections CRUD hook |
| CREATE | `src/hooks/useImportHistory.ts` | Import history fetching hook |
| CREATE | `supabase/functions/mt-webhook/index.ts` | Webhook for MT EA sync |
| CREATE | `supabase/functions/generate-connection-code/index.ts` | Generate unique connection codes |
| CREATE | `supabase/functions/parse-trade-file/index.ts` | Parse CSV/Excel trade files |
| MODIFY | `src/pages/Journal.tsx` | Add mode toggle, conditional rendering |
| MODIFY | `src/hooks/useJournalSettings.ts` | Add mode-related settings |
| MODIFY | `src/components/journal/settings/JournalSettings.tsx` | Add auto-sync settings section |
| MODIFY | `src/index.css` | Add mode toggle and auto-mode styles |

---

## Component Architecture

```text
Journal Page (src/pages/Journal.tsx)
|
|-- JournalModeToggle (top-right header)
|   |-- Toggle switch (Manual <-> Auto)
|   |-- Animated slider with spring physics
|
|-- [MODE: MANUAL] ─────────────────────────────
|   |-- Current implementation (entries, calendar, analytics, settings)
|   |-- No changes to existing functionality
|
|-- [MODE: AUTO] ───────────────────────────────
|   |
|   |-- [First Time Setup Flow]
|   |   |-- AutoModeWelcome (modal)
|   |   |-- ConnectionMethodSelector
|   |   |   |-- MetaTraderSetup (3-step wizard)
|   |   |   |-- FileUploadSetup (drag & drop)
|   |   |   |-- EmailSetup (OAuth connection)
|   |   |-- ConnectionSuccess (confetti animation)
|   |
|   |-- [After Connection]
|   |   |-- ConnectionStatusBar (green/active indicator)
|   |   |-- AutoEntryCard (with expandable notes)
|   |   |   |-- NotesEditor (reasoning + lessons)
|   |   |-- Same Calendar/Analytics/Settings tabs
|   |
|   |-- [Settings Tab - Auto Section]
|       |-- Active connections list
|       |-- Sync preferences
|       |-- Import history
|       |-- Add/remove connections
```

---

## Key Component Details

### 1. JournalModeToggle

```text
+-------------------------------------------+
|  Manual Mode   [  ○━━━━━━  ]  Auto Mode   |
+-------------------------------------------+
```

**Design Specifications:**
- Width: 180px, Height: 44px
- Glassmorphic background with blur
- Spring physics animation (400ms)
- Slider circle: 36px diameter
- Gradient background when Auto mode active

**States:**
- Manual: Gray background, left-aligned slider
- Auto: Purple gradient background, right-aligned slider
- Transition: Crossfade with blur effect (400ms)

### 2. AutoModeWelcome (First-time Modal)

Displayed when user first switches to Auto mode and has no connections:

```text
+--------------------------------------------------+
|     [Icon]  Welcome to Auto Mode!                |
|                                                  |
|  Automatically sync your trades from your broker |
|  and save time on data entry!                    |
|                                                  |
|  * Real-time trade import                        |
|  * Never miss a trade                            |
|  * Still add notes & lessons                     |
|                                                  |
|  [Let's Get Started ->]    [Skip for now]        |
+--------------------------------------------------+
```

**Animations:**
- Slide up from bottom with spring physics
- Subtle backdrop blur
- Icon with gradient glow

### 3. ConnectionMethodSelector

Three card options:

| Method | Badge | Description |
|--------|-------|-------------|
| MetaTrader Auto-Sync | RECOMMENDED | Real-time sync with MT4/MT5 EA |
| Upload Trade Files | - | CSV, PDF, Excel import |
| Email Auto-Import | ADVANCED | Background passive sync |

**Interactions:**
- Hover: Scale 1.02 + shadow depth
- Click: Ripple effect
- Selected: Border glow

### 4. MetaTraderSetup (3-Step Wizard)

**Step 1: Connection Code**
- Generate unique code (e.g., `ARV-K8X2-9LMP`)
- Copy button with animated checkmark
- Code stored in `broker_connections.connection_code`

**Step 2: Download EA File**
- Platform selection (MT4/MT5)
- Download button with progress indicator
- Note: EA file would need to be pre-built and hosted

**Step 3: Installation Instructions**
- Numbered step-by-step guide
- Video tutorial link (placeholder)
- "Waiting for connection..." spinner
- Polls for connection status

**Success State:**
- Confetti animation
- Green checkmark with bounce
- Account details display
- "Go to Auto Journal" CTA

### 5. AutoEntryCard

Extended version of JournalEntryCard for auto-imported trades:

```text
+--------------------------------------------------+
| #12345                           2 hours ago  🔄 |
| 2025-02-06 14:45                          [Win]  |
|--------------------------------------------------|
| GOLD    |  Long                                  |
| Entry: $2,048.50 -> Exit: $2,068.50              |
| P&L: +$198.00     R/R: 0.54                      |
|--------------------------------------------------|
| [Auto-imported]  Add your notes below ▼          |
| +------------------------------------------------+
| | Why did you take this trade?                   |
| | [Click to add reasoning...]                    |
| |                                                |
| | What did you learn?                            |
| | [Click to add lessons...]                      |
| +------------------------------------------------+
| [Save Notes]              [View Details]         |
+--------------------------------------------------+
```

**Key Differences from Manual:**
- "Auto-imported" badge (animated gradient)
- Refresh icon showing sync status
- Collapsible notes section
- Trade data is read-only
- Only notes/reasoning can be edited

### 6. ConnectionStatusBar

Shown at top of journal when in Auto mode with active connection:

```text
+----------------------------------------------------------+
| 🟢 Connected: MT5 #987654321 | XM Global                 |
| Last sync: 2 minutes ago | Auto-sync: ON                 |
|                                    [Settings]            |
+----------------------------------------------------------+
```

---

## Hooks Implementation

### useJournalMode

```typescript
interface UseJournalModeReturn {
  mode: 'manual' | 'auto';
  setMode: (mode: 'manual' | 'auto') => void;
  isFirstTimeAuto: boolean;
  hasConnections: boolean;
  isLoading: boolean;
}
```

### useBrokerConnections

```typescript
interface UseBrokerConnectionsReturn {
  connections: BrokerConnection[];
  activeConnection: BrokerConnection | null;
  isLoading: boolean;
  createConnection: (data: CreateConnectionData) => Promise<void>;
  updateConnection: (id: string, data: Partial<BrokerConnection>) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  generateConnectionCode: () => Promise<string>;
  testConnection: (id: string) => Promise<boolean>;
  syncNow: (id: string) => Promise<void>;
}
```

### useImportHistory

```typescript
interface UseImportHistoryReturn {
  imports: ImportHistoryEntry[];
  isLoading: boolean;
  refetch: () => void;
}
```

---

## Edge Functions

### 1. `mt-webhook`

Receives trade data from MetaTrader EA:

```typescript
// POST /functions/v1/mt-webhook
{
  connection_code: string,
  trades: [{
    ticket: number,
    symbol: string,
    type: 'buy' | 'sell',
    lots: number,
    open_price: number,
    close_price: number,
    open_time: string,
    close_time: string,
    profit: number,
    commission: number,
    swap: number
  }]
}
```

**Logic:**
1. Validate connection code exists and is active
2. Map MT trade data to journal_entries schema
3. Skip duplicates based on external_ticket
4. Insert new entries with `auto_imported: true`
5. Update connection's `last_sync_at`
6. Create import_history record
7. Return success/failure response

### 2. `generate-connection-code`

Generates unique 12-character connection code:

```typescript
// POST /functions/v1/generate-connection-code
// Returns: { code: "ARV-XXXX-XXXX" }
```

### 3. `parse-trade-file`

Parses uploaded trade files (CSV, Excel):

```typescript
// POST /functions/v1/parse-trade-file
// FormData with file attachment
// Returns: { trades: [...], errors: [...] }
```

---

## Settings Tab Additions (Auto Mode)

New accordion section in JournalSettings:

```text
+--------------------------------------------------+
| [Icon] Broker Connections                    [v] |
|--------------------------------------------------|
| Active Connections:                              |
| +----------------------------------------------+ |
| | 🟢 MT5 #987654321 | XM Global               | |
| | Connected 3 days ago | 1,247 trades synced   | |
| | [Manage] [Sync Now] [Disconnect]             | |
| +----------------------------------------------+ |
|                                                  |
| [+ Add Another Connection]                       |
|--------------------------------------------------|
| Sync Preferences:                                |
| ○ Real-time (recommended)                        |
| ○ Every 5 minutes                                |
| ○ Every 15 minutes                               |
| ○ Manual only                                    |
|                                                  |
| [✓] Skip duplicate trades                        |
| [✓] Auto-categorize by setup                     |
| [✓] Notify on new trades                         |
| [ ] Import closed trades only                    |
|--------------------------------------------------|
| Import History:                                  |
| Today, 2:45 PM | MT5 Auto-sync | 3 trades | ✅  |
| Yesterday      | File upload   | 15 trades | ✅ |
| [View All History]                               |
+--------------------------------------------------+
```

---

## Animations Specification

### Mode Toggle Animation

```typescript
const toggleVariants = {
  manual: { x: 0 },
  auto: { x: 108 },
  transition: {
    type: "spring",
    stiffness: 500,
    damping: 30
  }
};

const backgroundVariants = {
  manual: { 
    background: "rgba(100, 100, 100, 0.2)" 
  },
  auto: { 
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
  }
};
```

### Page Transition on Mode Switch

```typescript
const pageTransition = {
  exit: { 
    opacity: 0, 
    y: -20, 
    filter: "blur(10px)",
    transition: { duration: 0.3 }
  },
  enter: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.4, delay: 0.1 }
  }
};
```

### Connection Success Animation

```typescript
// Confetti burst using existing Framer Motion
// Checkmark draw animation (800ms)
// Success card bounce-in (400ms spring)
// Glow pulse (continuous)
```

---

## CSS Additions

```css
/* Mode Toggle Styles */
.journal-mode-toggle {
  @apply relative flex items-center gap-2 px-3 py-2 rounded-full;
  @apply backdrop-blur-md border border-white/10;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
}

.journal-mode-toggle-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
}

.journal-mode-slider {
  @apply absolute w-9 h-9 rounded-full bg-white shadow-lg;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Auto-imported Badge */
.auto-imported-badge {
  @apply px-2 py-0.5 rounded-full text-xs font-medium;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
  border: 1px solid rgba(102, 126, 234, 0.3);
  animation: badge-shimmer 2s infinite;
}

@keyframes badge-shimmer {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* Connection Status Bar */
.connection-status-bar {
  @apply flex items-center gap-3 px-4 py-3 rounded-xl mb-4;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* Notes Expansion */
.notes-section-collapsed {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.3s ease-out;
}

.notes-section-expanded {
  max-height: 400px;
  opacity: 1;
  transition: all 0.4s ease-out;
}
```

---

## Responsive Design

### Mobile (<768px)

- Mode toggle: Smaller (140px), stacked labels on very small screens
- Welcome modal: Full-screen with swipeable steps
- Connection cards: Stack vertically
- Notes section: Bottom sheet style
- Settings: Collapsed by default

### Tablet (768-1024px)

- Standard layout with collapsible sidebar
- Modal: Centered card, 90% width

### Desktop (>1024px)

- Full layout with all animations
- Side-by-side comparison possible
- Hover effects enabled

---

## Implementation Priority

### Phase 1: Core Mode System (Week 1)
1. Database migration for new tables and columns
2. JournalModeToggle component with animations
3. useJournalMode hook with localStorage + Supabase sync
4. Mode toggle integration in Journal.tsx
5. Page transition animations

### Phase 2: First-Time Setup Flow (Week 2)
1. AutoModeWelcome modal
2. ConnectionMethodSelector
3. MetaTraderSetup wizard (UI only - no actual EA)
4. generate-connection-code edge function
5. ConnectionSuccess with confetti

### Phase 3: Auto Mode Interface (Week 3)
1. ConnectionStatusBar component
2. AutoEntryCard with expandable notes
3. NotesEditor component
4. useBrokerConnections hook
5. Settings tab auto-sync section

### Phase 4: Backend Integration (Week 4)
1. mt-webhook edge function
2. parse-trade-file edge function
3. useImportHistory hook
4. ImportHistoryList component
5. File upload interface

---

## Data Flow

```text
[Manual Mode]
User Input -> JournalEntryForm -> journal_entries (import_source: 'manual')

[Auto Mode - MetaTrader]
MT EA -> mt-webhook -> journal_entries (import_source: 'mt5', auto_imported: true)
     -> import_history

[Auto Mode - File Upload]  
File -> parse-trade-file -> Preview -> journal_entries (import_source: 'file_upload')
     -> import_history

[Notes on Auto-Imported Trades]
User adds reasoning/lessons -> UPDATE journal_entries SET notes_added = true
```

---

## Key Features Summary

### Manual Mode (Existing)
- Full control over entries
- Detailed notes, reasoning, lessons
- Screenshot uploads
- Custom tags
- Calendar view
- Analytics dashboard

### Auto Mode (New)
- Automatic trade sync from MT4/MT5
- File upload support (CSV, Excel)
- Email auto-import (future)
- Still add notes/lessons post-trade
- Real-time connection status
- Import history tracking
- Duplicate prevention
- Same Calendar/Analytics/Settings

### Shared Features
- Modern calendar view with P&L visualization
- Weekly summaries
- Analytics and performance metrics
- Export capabilities
- Mobile responsive
- Smooth animations
- Glassmorphic design

---

## Security Considerations

1. **Connection codes**: Unique, unguessable, tied to user
2. **Webhook authentication**: Validate connection_code on every request
3. **RLS policies**: All tables have user-scoped access
4. **File uploads**: Validate file types, size limits
5. **Data isolation**: Auto-imported trades fully owned by user

---

## File Creation Summary

| Action | File |
|--------|------|
| CREATE | `src/components/journal/mode/JournalModeToggle.tsx` |
| CREATE | `src/components/journal/mode/AutoModeWelcome.tsx` |
| CREATE | `src/components/journal/mode/ConnectionMethodSelector.tsx` |
| CREATE | `src/components/journal/mode/MetaTraderSetup.tsx` |
| CREATE | `src/components/journal/mode/FileUploadSetup.tsx` |
| CREATE | `src/components/journal/mode/EmailSetup.tsx` |
| CREATE | `src/components/journal/mode/ConnectionSuccess.tsx` |
| CREATE | `src/components/journal/mode/ConnectionStatusBar.tsx` |
| CREATE | `src/components/journal/mode/index.ts` |
| CREATE | `src/components/journal/auto/AutoEntryCard.tsx` |
| CREATE | `src/components/journal/auto/NotesEditor.tsx` |
| CREATE | `src/components/journal/auto/ImportHistoryList.tsx` |
| CREATE | `src/components/journal/auto/index.ts` |
| CREATE | `src/hooks/useJournalMode.ts` |
| CREATE | `src/hooks/useBrokerConnections.ts` |
| CREATE | `src/hooks/useImportHistory.ts` |
| CREATE | `supabase/functions/mt-webhook/index.ts` |
| CREATE | `supabase/functions/generate-connection-code/index.ts` |
| CREATE | `supabase/functions/parse-trade-file/index.ts` |
| DATABASE | Migration for broker_connections, import_history, extended columns |
| MODIFY | `src/pages/Journal.tsx` |
| MODIFY | `src/hooks/useJournalSettings.ts` |
| MODIFY | `src/components/journal/settings/JournalSettings.tsx` |
| MODIFY | `src/index.css` |

