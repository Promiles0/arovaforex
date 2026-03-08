

## Plan: Admin Dashboard Design Enhancements & New Features

### 1. AdminHome — Design Polish
- Add a **real-time clock** that updates every second in the welcome area
- Add **sparkline mini-charts** inside each gradient stat card showing 7-day trend
- Add an **"Active Now"** indicator showing online user count (from realtime presence)
- Improve Quick Actions section with icon-rich grid layout instead of inline buttons
- Add a **Recent Activity Feed** card showing latest platform actions (new users, new forecasts, new messages) with relative timestamps

### 2. Users Page — Enhanced UX
- Add **user avatars** in the table rows
- Add **"Export CSV"** button to download user list
- Add **bulk action** checkboxes with bulk suspend/reactivate
- Add a **user detail drawer** that slides in on row click showing full profile, activity summary, and role management

### 3. Analytics Page — Visual Upgrade
- Add **animated gradient backgrounds** to stat cards (match AdminHome style)
- Add **comparison indicators** (% change vs previous period) to each stat card
- Add a **"Real-time" badge** with pulse animation
- Replace plain `StatCard` with the gradient card style from AdminHome

### 4. Notifications Page — New Features
- Add **notification preview** — show how the notification will look to users before sending
- Add **scheduled notifications** — pick a future date/time to auto-send
- Add **delete** button on history items
- Add character count on message textarea

### 5. Content Page — Image Upload Support
- Add **Supabase Storage upload** for forecast images instead of just URL input
- Add **image preview** thumbnails in the forecast table
- Add **search/filter** for forecasts by currency pair or bias

### 6. Admin Sidebar — Active state improvements
- Add a subtle **glow/highlight** effect on the active nav item
- Add **notification count badges** next to Contact and Notifications nav items

### 7. Admin Header — Enhancements
- Add a **live clock** that ticks every second
- Add **breadcrumbs** showing current page path

### Files to edit:
1. `src/pages/admin/AdminHome.tsx` — sparklines in stat cards, real-time clock, activity feed, improved quick actions
2. `src/pages/admin/Users.tsx` — avatars, export CSV, user detail drawer
3. `src/pages/admin/Analytics.tsx` — gradient stat cards with % change indicators
4. `src/pages/admin/Notifications.tsx` — preview, scheduled send, delete, char count
5. `src/pages/admin/Content.tsx` — image preview in table, search/filter
6. `src/components/admin/AdminSidebar.tsx` — active glow, badge counts
7. `src/components/admin/AdminHeader.tsx` — live clock, breadcrumbs

