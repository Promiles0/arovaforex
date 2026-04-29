# Plan: Visitor Tracking + News Digest Enhancements

Six independent features grouped into two areas.

---

## A. Visitor Tracking System

### 1. Database (migration)
New table `visitor_events`:
- `id uuid pk`, `created_at timestamptz default now()`
- `session_id uuid` (client-generated, persisted in `localStorage` for unique-visitor counting)
- `user_id uuid null` (set if logged in)
- `path text`, `full_url text`, `referrer text`, `user_agent text`
- `ip_address inet`, `country text`, `city text` (geo-enriched server-side)
- `device_type text` (mobile/tablet/desktop, parsed from UA)

RLS:
- `INSERT`: anyone (anon + authenticated) — public tracker
- `SELECT/DELETE`: admins only (`has_role(auth.uid(),'admin')`)

Indexes on `created_at desc`, `session_id`, `path`.

### 2. Edge function `track-visit`
- `verify_jwt = false` (public)
- Validates body with zod (path, referrer, userAgent, sessionId)
- Captures `req.headers.get('x-forwarded-for')` for IP
- Calls free `https://ipapi.co/{ip}/json/` (no key needed) for country/city — wrapped in try/catch, never blocks insert
- Inserts row using service-role client
- CORS enabled via SDK

### 3. Frontend tracker
- New hook `src/hooks/useVisitorTracking.ts`:
  - On mount + on every `location.pathname` change, fire `supabase.functions.invoke('track-visit', { body })`
  - Gets/creates `visitor_session_id` in `localStorage`
  - Skips `/admin/*` routes (don't track admin browsing)
  - Skips when `localStorage.tracking_opt_out === 'true'`
- Mounted once inside `App.tsx` via a small `<VisitorTracker />` component placed inside `BrowserRouter`

### 4. Admin Analytics page upgrade
Extend existing `src/pages/admin/Analytics.tsx` with a new **"Visitors"** tab:
- KPI cards: Total visits, Unique sessions, Logged-in vs anonymous, Today's visits
- Real-time: subscribe to `visitor_events` `INSERT` via Supabase Realtime → live counter + toast
- Charts (Recharts): visits per hour (last 24h), visits per day (last 30d), top 10 pages, top 10 referrers, country breakdown (pie)
- Sortable/filterable table of latest 100 visits (path, referrer, country, device, time, user link)
- Date-range filter (today / 7d / 30d)

### 5. Privacy
- Append a one-line disclosure to existing `PrivacyPolicy.tsx` ("We log anonymous visit metadata…") and a small "Do not track me" toggle on the privacy page that flips `localStorage.tracking_opt_out`.

---

## B. News Digest Enhancements

### B1. Admin moderation panel for digest feedback
- New admin page `src/pages/admin/DigestFeedback.tsx` at `/admin/digest-feedback`
- Lists rows from `news_digest_ratings` joined with `profiles` (name, avatar) and `news_digests` (digest_date)
- Filters: rating (up/down/all), with-comment-only, date range
- Actions: **Delete comment** (clears `comment` to null) and **Delete rating** entirely
- Logs each delete via `log_admin_action` RPC
- Add to `AdminSidebar` under "Communication" with `MessageSquare` icon

RLS update (migration): admins can `UPDATE`/`DELETE` on `news_digest_ratings`.

### B2. Auto-suggest pairs in WatchlistEditor
Update `src/components/news/WatchlistEditor.tsx`:
- Compute suggestions from selected currencies × all majors (e.g., user picks `EUR` + `JPY` → suggest `EURUSD`, `EURJPY`, `USDJPY`, `GBPJPY`, `XAUUSD` if `XAU`)
- Also pull existing pairs from the latest `news_digest.currency_impacts[].pairs` to surface "trending" suggestions
- Render below the pair input as clickable `Badge` chips ("+ EURUSD"); clicking adds to `draftPairs`
- Hide pairs already in draft

### B3. Digest notification settings
Migration: add columns to `profiles`:
- `notify_news_digest boolean default true` (new daily digest)
- `notify_news_mention boolean default true` (digest mentions a watched currency/pair)
- `notify_ai_system boolean default true` (general AI system alerts)

Frontend: add a new "AI & News" group inside `src/components/profile/PreferencesTab.tsx` with three switches.

Edge function update: `ai-news-digest` already calls `broadcast_notification`. Replace that single call with two passes:
- Pass 1: notify users with `notify_news_digest = true` (general "New digest available")
- Pass 2: for users with `notify_news_mention = true`, check overlap between their `news_watchlist` and digest currencies/pairs; insert a personalized notification ("Your watched EUR was flagged volatile today")

This is implemented via a new SQL helper `notify_digest_subscribers(p_digest_id uuid)` called from the edge function.

### B4. News page filters
Add a filter bar at the top of `src/pages/News.tsx` (above Market Overview):
- Toggle: **"Watched only"** — filters `currency_impacts` to entries where the currency or any pair is in the user's watchlist; filters `highlights` whose `pairs`/text mentions a watched currency
- Toggle: **"Hide low impact"** — removes `highlights` with `impact === 'low'`
- Reset button when any filter is on
- State stored in `useState`; persisted to `localStorage` as `news_filters`
- Empty-state message when filters yield nothing

### B5. Share button
Add a "Share" button next to "Regenerate" in the News header:
- Uses Web Share API when available (`navigator.share`)
- Fallback: copies a URL of the form `https://<host>/dashboard/news?date=YYYY-MM-DD` to clipboard via `navigator.clipboard.writeText`
- Toast confirmation
- News page reads `?date=` query param; if present, fetches that specific digest by `digest_date` (extends `useNewsDigest` with optional `date` arg)

---

## Files Summary

**New:**
- `supabase/migrations/<ts>_visitor_tracking.sql`
- `supabase/migrations/<ts>_news_enhancements.sql` (profile cols, ratings RLS, helper fn)
- `supabase/functions/track-visit/index.ts`
- `src/hooks/useVisitorTracking.ts`
- `src/components/admin/VisitorTracker.tsx` (mounts the hook)
- `src/pages/admin/DigestFeedback.tsx`

**Edited:**
- `src/App.tsx` (mount tracker, register `/admin/digest-feedback`)
- `src/pages/admin/Analytics.tsx` (Visitors tab)
- `src/components/admin/AdminSidebar.tsx` (Digest Feedback link)
- `src/components/news/WatchlistEditor.tsx` (suggestions)
- `src/components/profile/PreferencesTab.tsx` (3 new toggles)
- `src/pages/News.tsx` (filters, share button, ?date param)
- `src/hooks/useNewsDigest.ts` (optional date arg)
- `src/pages/PrivacyPolicy.tsx` (disclosure + opt-out)
- `supabase/functions/ai-news-digest/index.ts` (granular notifications)
- `supabase/config.toml` (register `track-visit`, `verify_jwt=false`)

## Notes
- No new secrets needed (ipapi.co free tier is keyless; Lovable AI gateway already configured).
- Geolocation enrichment is best-effort — failures don't block tracking.
- Admin analytics realtime uses existing Supabase Realtime; `visitor_events` will be added to the `supabase_realtime` publication in the migration.
