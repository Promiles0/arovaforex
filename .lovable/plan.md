

## Plan: Three Enhancements

### Task 1: Verify Admin Dashboard (Browser Test)
Navigate to `/admin` in the preview to visually verify all widgets render. This requires login first -- will ask user to log in if needed.

### Task 2: Live Session Scheduling Form + User Countdown

**Live Stream Control page** (`src/pages/admin/LiveStreamControl.tsx`):
- Add a new "Schedule Session" card with a date picker (Shadcn Calendar in Popover) and time input
- Save `scheduled_start` to `live_stream_config` table (column already exists)
- Show currently scheduled session with option to clear it

**User-facing Live Room** (`src/pages/LiveRoom.tsx`):
- When stream is offline but `scheduled_start` is in the future, show a countdown timer instead of the generic offline message
- Countdown displays days/hours/minutes/seconds, auto-updates every second
- Show session title and scheduled time

**Offline Message** (`src/components/live-room/OfflineMessage.tsx`):
- Accept optional `scheduledStart` and `title` props
- When scheduled, render countdown timer with animated digits
- When no schedule, keep current "No Live Session" message

### Task 3: Dark/Light Mode Toggle + Sidebar Dark Theme

**Setup ThemeProvider** (`src/App.tsx`):
- Wrap app with `ThemeProvider` from `next-themes` (already installed)
- Set `attribute="class"`, `defaultTheme="dark"`

**Admin Header** (`src/components/admin/AdminHeader.tsx`):
- Add Sun/Moon toggle button using `useTheme()` from next-themes
- Animated icon swap on click

**Admin Sidebar** (`src/components/admin/AdminSidebar.tsx`):
- Add `dark:bg-black` class to the Sidebar component so it renders black in dark mode
- Ensure nav items have proper dark mode contrast

**Index.css / Tailwind**:
- No changes needed -- Tailwind dark mode via `class` strategy is already configured

### Files to create/edit:
1. `src/App.tsx` -- wrap with ThemeProvider
2. `src/components/admin/AdminHeader.tsx` -- add theme toggle
3. `src/components/admin/AdminSidebar.tsx` -- dark:bg-black
4. `src/pages/admin/LiveStreamControl.tsx` -- add scheduling card
5. `src/pages/LiveRoom.tsx` -- show countdown when scheduled
6. `src/components/live-room/OfflineMessage.tsx` -- countdown timer UI

No database changes needed -- `scheduled_start` column already exists on `live_stream_config`.

