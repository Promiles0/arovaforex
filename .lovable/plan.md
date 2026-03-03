

## Admin Dashboard Enhancement Plan

### 1. Sidebar Redesign (`AdminSidebar.tsx`)
- Add Arova logo at top of sidebar
- Group nav items into logical sections: **Overview** (Home, Analytics), **Content** (Content, Calendar Events, Journal), **Communication** (Notifications, Contact, Contact Analytics, Live Stream, AI Assistant), **Users** (Users)
- Add a "Back to App" link and logout button at bottom
- Staggered fade-in animation on sidebar items using framer-motion

### 2. Enhanced Header (`AdminHeader.tsx`)
- Add admin avatar (from profile) with dropdown menu
- Notification bell with unread count badge (from `notifications` table)
- Quick search bar (command palette style) for navigating admin pages
- Current date/time display
- Smooth entrance animation

### 3. Gradient Stat Cards (`AdminHome.tsx`)
- Each card gets a unique gradient background (blue, green, red, purple)
- Larger icons with colored icon containers
- Percentage change indicator comparing today vs yesterday
- Staggered animation on card entrance using framer-motion variants
- Hover lift effect with shadow

### 4. System Health Widget (new section in `AdminHome.tsx`)
- Database status indicator (green dot + "Healthy")
- Active sessions count (from `profiles` with recent activity)
- Storage usage display (bucket count)
- Uptime indicator
- Progress bars with animated fill
- All wrapped in a glassmorphic card

### 5. Top Users Leaderboard Widget
- Query profiles ordered by forecast count or journal entry count
- Show avatar, name, join date, activity count
- Ranked 1-5 with medal icons for top 3
- Slide-in animation

### 6. Platform Overview Donut Chart
- PieChart from recharts showing breakdown: Forecasts, Journal Entries, Contact Messages, Live Stream Views
- Animated on mount
- Color-coded legend

### 7. Recent Contact Messages Preview
- Show latest 3-5 open contact messages
- Status badge (open/resolved), priority indicator
- Quick "View" link to `/admin/contact`
- Fade-in list animation

### 8. Upcoming Events Calendar Widget
- Query `calendar_events` for next 5 upcoming events
- Show date, title, category badge
- Link to `/admin/calendar-events`

### 9. Live Session Scheduler
- Add `scheduled_start` field already exists in `live_stream_config`
- Show next scheduled session in admin home
- When scheduled, display countdown on user Live Room page
- No DB migration needed -- `scheduled_start` column already exists

### 10. Motion & Animations Throughout
- Page-level staggered container animation (framer-motion `staggerChildren`)
- Each card/section fades + slides up with delay
- Stat number count-up animation
- Chart draw animation
- Activity list items stagger in
- Hover micro-interactions on all interactive elements

### Technical Details

**No database changes needed** -- all data sources already exist in Supabase tables.

**Files to create/edit:**
- Edit `src/components/admin/AdminSidebar.tsx` -- logo, grouped sections, logout
- Edit `src/components/admin/AdminHeader.tsx` -- avatar, notifications bell, search
- Edit `src/pages/admin/AdminHome.tsx` -- full redesign with all new widgets, gradient cards, animations
- The `UnderDevelopmentNotice` shared component will also be extracted in parallel

**Dependencies used:** framer-motion (installed), recharts (installed), lucide-react (installed)

