

# Trading Journal Calendar Enhancement - Premium Modern Design

## Overview

Add a sophisticated, premium Calendar view to the Trading Journal page with interactive P&L visualization, weekly summaries, and modern glassmorphic design with fluid Framer Motion animations. All data will be fetched from the existing `journal_entries` table in Supabase.

---

## Data Source

The calendar will use **real data** from the existing `journal_entries` table which already contains:
- `entry_date` - Trade date
- `pnl` - Profit/loss amount
- `outcome` - win/loss/breakeven/open

No database changes required - all data already exists.

---

## File Changes

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `src/components/journal/calendar/JournalCalendar.tsx` | Main calendar component |
| CREATE | `src/components/journal/calendar/CalendarCell.tsx` | Individual date cell with P&L |
| CREATE | `src/components/journal/calendar/CalendarHeader.tsx` | Month navigation & stats summary |
| CREATE | `src/components/journal/calendar/WeeklySummary.tsx` | Weekly accordion breakdown |
| CREATE | `src/components/journal/calendar/CalendarSkeleton.tsx` | Loading skeleton with shimmer |
| CREATE | `src/components/journal/calendar/DayDetailModal.tsx` | Trade details for selected day |
| CREATE | `src/components/journal/calendar/index.ts` | Barrel exports |
| CREATE | `src/hooks/useCalendarData.ts` | Calendar data aggregation hook |
| MODIFY | `src/pages/Journal.tsx` | Add Calendar tab |
| MODIFY | `src/index.css` | Add calendar-specific styles |

---

## Component Architecture

```text
JournalCalendar
|-- CalendarHeader (month nav, today button, stats)
|-- CalendarGrid (7x6 grid)
|   |-- CalendarCell (x42 cells)
|       |-- Date number
|       |-- Trade count indicator
|       |-- P&L display
|       |-- Hover tooltip
|-- WeeklySummary (sidebar/bottom on mobile)
|   |-- Week accordion cards (collapsible)
|       |-- Weekly P&L
|       |-- Trading days count
|       |-- Mini day previews
|-- DayDetailModal (click to view day's trades)
```

---

## Design Specifications

### Color Palette (Brand Consistent)

| Element | Color |
|---------|-------|
| Profit cells | `#10b981` (emerald-500) with gradient glow |
| Loss cells | `#ef4444` (red-500) with subtle pulse |
| No trades | `#1e293b` (slate-800) neutral |
| Current day | Gold/amber border ring |
| Card background | `rgba(255,255,255,0.03)` glassmorphic |
| Hover glow | 30px spread, color-matched |

### Glassmorphism Effects

```css
.calendar-glass {
  background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 
    0 4px 30px rgba(0,0,0,0.1),
    inset 0 1px 0 rgba(255,255,255,0.05);
}
```

---

## Animation Specifications

### Page Load Sequence

1. **Skeleton Phase (0-500ms)**
   - Shimmer gradient sweep across placeholder cells
   - Staggered opacity 0.3 -> 0.6 -> 0.3

2. **Grid Reveal (500-1500ms)**
   - Cells fade + slide up from bottom
   - Stagger delay: `index * 30ms`
   - Spring physics: `stiffness: 100, damping: 15`

3. **Number Count-Up (1000-2000ms)**
   - P&L values animate from 0 to actual value
   - Smooth easing with spring bounce

### Cell Interactions (Framer Motion)

```typescript
const cellVariants = {
  initial: { opacity: 0, y: 20, scale: 0.9 },
  animate: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.03, type: "spring", stiffness: 100, damping: 15 }
  }),
  hover: {
    scale: 1.08,
    rotateX: 5, rotateY: 5, // 3D tilt effect
    boxShadow: "0 20px 40px rgba(16,185,129,0.3)",
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  tap: { scale: 0.98 }
};
```

### Tab Navigation

- Floating pill indicator morphs between tabs
- Content crossfade with blur: `scale 0.95->1, blur 10px->0`
- Duration: 400ms with elastic easing

### Weekly Summary Accordion

- Spring physics expansion with slight overshoot
- Mini day previews stagger fade-in (100ms each)
- Chevron rotates 180deg smoothly

---

## Component Details

### 1. CalendarHeader

```text
+----------------------------------------------------------+
|  < January 2026 >     [Today]   | Total P&L: +$2,450.00  |
|                                 | Trading Days: 12        |
|                                 | Win Rate: 65%           |
+----------------------------------------------------------+
```

**Features:**
- Month/year display with animated arrow navigation
- "Today" button with pulse glow effect
- Monthly stats card (glassmorphic)
- Stats animate with count-up effect

### 2. CalendarCell

```text
+---------------+
| 15        2⇅  |  <- Date + trade count
|               |
|  +$2,027.10   |  <- Large P&L (glowing if profit)
|               |
| ▓▓▓▓▓▓▓░░░░  |  <- Optional: mini progress bar
+---------------+
```

**States:**

| State | Background | Border | Effects |
|-------|------------|--------|---------|
| Profit | emerald gradient tint | Animated gradient rotation | Upward floating particles (optional) |
| Loss | red gradient tint | Dashed animated offset | Subtle pulse |
| No trades | slate-800 | Default border | None |
| Today | Any | Gold ring animation | Glow pulse |
| Hover | Lifted | Neon underglow | 3D tilt, scale 1.08 |

### 3. WeeklySummary

```text
+--------------------------------+
| Week Two       Dec 7 - Dec 13  |
| [Chevron ▼]                    |
+--------------------------------+
|  P&L: -$3,327.90               |
|  Days: 2  |  Win Rate: 50%    |
|  +--------+  +--------+        |
|  | Dec 11 |  | Dec 12 |        |
|  | +$2027 |  | -$5355 |        |
|  +--------+  +--------+        |
+--------------------------------+
```

### 4. DayDetailModal

Triggered on cell click:
- Shows all trades for that date
- Uses existing `JournalEntryCard` component
- Animated modal with scale-in
- Click-through to full entry detail

---

## Hook: useCalendarData

```typescript
interface DayData {
  date: string;
  trades: number;
  pnl: number;
  wins: number;
  losses: number;
  breakeven: number;
  outcome: 'profit' | 'loss' | 'breakeven' | 'none';
  entries: JournalEntry[];
}

interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalPnl: number;
  tradingDays: number;
  winRate: number;
  days: DayData[];
}

interface CalendarData {
  month: number;
  year: number;
  days: Map<string, DayData>;
  weeks: WeekData[];
  totalPnl: number;
  tradingDays: number;
  winRate: number;
}

const useCalendarData = (entries: JournalEntry[], month: number, year: number): CalendarData
```

---

## Responsive Breakpoints

### Desktop (>1024px)
- Full 7-column calendar grid
- Weekly summary sidebar (right side)
- All animations enabled
- Cursor 3D tilt effects

### Tablet (768-1024px)
- Full 7-column calendar
- Collapsible sidebar (drawer)
- Standard animations

### Mobile (<768px)
- Compact calendar (keeps 7 cols, smaller cells)
- Weekly summary as bottom sheet (swipe up)
- Simplified animations for performance
- Touch-optimized (44px min targets)

---

## Tab Integration

**Current tabs:** Entries | Analytics | Settings

**New tabs:** Entries | **Calendar** | Analytics | Settings

```tsx
<TabsList className="grid w-full grid-cols-4 max-w-lg">
  <TabsTrigger value="entries">Entries</TabsTrigger>
  <TabsTrigger value="calendar" className="flex items-center gap-1.5">
    <CalendarIcon className="w-4 h-4" />
    Calendar
  </TabsTrigger>
  <TabsTrigger value="analytics">Analytics</TabsTrigger>
  <TabsTrigger value="settings">Settings</TabsTrigger>
</TabsList>
```

---

## Performance Optimizations

1. **Lazy Loading**: Only fetch current month's entries
2. **Memoization**: `useMemo` for calendar grid calculations
3. **GPU Acceleration**: Use `transform` and `opacity` only
4. **Virtualization**: If >10 weeks in view, virtualize weekly summary
5. **Reduced Motion**: Respect `prefers-reduced-motion`
6. **Debounced Hover**: 100ms threshold for hover effects

---

## CSS Additions (index.css)

```css
/* Calendar Premium Styles */
.calendar-cell {
  @apply relative overflow-hidden rounded-xl transition-all duration-300;
  background: linear-gradient(145deg, hsl(var(--card)), hsl(var(--muted)) / 0.3);
  backdrop-filter: blur(8px);
}

.calendar-cell-profit {
  background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05));
  border: 1px solid rgba(16,185,129,0.3);
  box-shadow: 0 0 30px rgba(16,185,129,0.2), inset 0 0 60px rgba(16,185,129,0.05);
}

.calendar-cell-loss {
  background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05));
  border: 1px solid rgba(239,68,68,0.3);
}

.calendar-cell-today {
  @apply ring-2 ring-amber-500/50;
  animation: today-pulse 2s ease-in-out infinite;
}

@keyframes today-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
}

.calendar-header-glass {
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

/* Number count-up animation */
@keyframes count-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-count-up {
  animation: count-up 0.6s ease-out forwards;
}

/* Stagger animation for grid */
.calendar-grid-item {
  opacity: 0;
  animation: calendar-reveal 0.5s ease-out forwards;
}

@keyframes calendar-reveal {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

---

## Empty State

When no trades exist for the month:

```text
+----------------------------------------+
|       [Calendar illustration]          |
|                                         |
|       No trades this month              |
|   Start logging to see your calendar    |
|                                         |
|      [+ Add First Trade] (pulsing)      |
+----------------------------------------+
```

---

## Accessibility

- Keyboard navigation with visible focus states
- ARIA labels for all interactive elements
- `prefers-reduced-motion` support (disable 3D effects)
- High contrast mode support
- Screen reader announcements for P&L values

---

## Implementation Priority

1. Core calendar grid with basic styling
2. Data hook for aggregating entries by day
3. Profit/loss cell styling with gradients
4. Page load stagger animation
5. Cell hover effects (scale, glow)
6. 3D tilt effect on hover
7. Weekly summary accordion
8. Tab navigation integration
9. Month navigation with animations
10. Mobile responsive layout
11. Day detail modal
12. Performance optimizations

---

## File Summary

| Action | File |
|--------|------|
| CREATE | `src/components/journal/calendar/JournalCalendar.tsx` |
| CREATE | `src/components/journal/calendar/CalendarCell.tsx` |
| CREATE | `src/components/journal/calendar/CalendarHeader.tsx` |
| CREATE | `src/components/journal/calendar/WeeklySummary.tsx` |
| CREATE | `src/components/journal/calendar/CalendarSkeleton.tsx` |
| CREATE | `src/components/journal/calendar/DayDetailModal.tsx` |
| CREATE | `src/components/journal/calendar/index.ts` |
| CREATE | `src/hooks/useCalendarData.ts` |
| MODIFY | `src/pages/Journal.tsx` |
| MODIFY | `src/index.css` |

