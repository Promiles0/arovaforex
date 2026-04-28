# News Digest Enhancements + System Cleanup

## Part 1 — System audit (quick fixes)

A full sweep of pages, routes, and components surfaced only one real loose end:

- **`src/pages/Support.tsx`** exists but is not routed anywhere and not linked from any sidebar. It's dead code left from an earlier iteration of the contact flow (which is now `Contact.tsx`).
  - **Fix:** delete `src/pages/Support.tsx`.
- **Duplicate `/terms` route** declared twice in `src/App.tsx` (lines 68–69).
  - **Fix:** remove the duplicate line.
- Two "coming soon" labels in `SignalsTestimonials.tsx` and `PerformanceMetrics.tsx` are intentional empty-state copy on the public Signals landing page (no real testimonials yet) — leaving as-is per the real-data-only rule. Not a bug.

Everything else (Coach, Playbook, News, Calculator AI Advisor, Calendar Briefs, all admin pages, all dashboard pages) is wired, routed, and functional.

## Part 2 — News Digest feature work

### 1. Watchlist on `/dashboard/news`

Let users pick the currencies/pairs they care about and visually highlight them in the Currency Impact Map.

- New table `news_watchlist`:
  - `user_id uuid`, `currencies text[]`, `pairs text[]`, `updated_at timestamptz`
  - Unique on `user_id`; RLS = owner-only.
- New hook `useNewsWatchlist` (load / upsert).
- New component `WatchlistEditor.tsx` — popover with checkboxes for the 8 majors (USD, EUR, GBP, JPY, CHF, CAD, AUD, NZD) + XAU, plus an input to add custom pair tags (e.g. `EURUSD`).
- In `News.tsx`:
  - Sort `currency_impacts` so watchlisted currencies render first.
  - Watchlisted cards get a primary border + small "★ Watching" badge.
  - Pairs in `c.pairs` that are watchlisted render as filled primary badges instead of secondary.
  - Header gets an "Edit watchlist" button opening the editor.

### 2. Reading time + last-updated timestamp

At the top of `News.tsx`, just under the title:

- **Reading time:** computed from `summary` + each `highlight.detail` + each `currency_impact.note` at ~225 wpm, rounded up. Display: `📖 ~3 min read`.
- **Last updated:** formatted from `digest.updated_at` using a small `timeAgo()` helper (`Updated 2h ago · Apr 28, 2026 14:32`). Tooltip shows full local timestamp.
- Place both as a subtle muted-foreground row alongside the existing date/event-count line.

### 3. Notification when a new digest is generated

Use the existing `notifications` table (already wired to `NotificationsBell` + realtime).

- In `supabase/functions/ai-news-digest/index.ts`, after a successful upsert **only when `cached === false` AND the digest_date row was newly inserted** (detect by comparing `created_at === updated_at` on the upserted row), broadcast to all users who opted in:
  ```sql
  INSERT INTO notifications (user_id, type, content, link)
  SELECT user_id, 'system',
         '🗞️ Today's AI News Digest is ready — ' || event_count || ' events analyzed',
         '/dashboard/news'
  FROM profiles WHERE notify_system = true;
  ```
- Done via the existing `broadcast_notification` RPC for consistency.
- No schema change needed — type `'system'` is already supported by the bell, RLS, and notification preferences.

### 4. Ratings + optional comment per digest

Let users thumbs-up / thumbs-down each daily digest with an optional comment. This data feeds future prompt tuning.

- New table `news_digest_ratings`:
  - `id uuid pk`, `digest_id uuid`, `user_id uuid`, `rating text check in ('up','down')`, `comment text`, `created_at`, `updated_at`
  - Unique `(digest_id, user_id)` so each user has one rating per digest (upsert to change).
  - RLS: users insert/update/select/delete their own row; admins can `SELECT` all (for analytics).
- New hook `useDigestRating(digestId)` — returns `{ myRating, counts: {up, down}, rate(value, comment), clear() }`.
  - Aggregate counts via a lightweight `select rating` query (digests are ~1 row/day, low volume).
- New component `DigestRatingPanel.tsx` rendered at the bottom of `News.tsx`:
  - Two large thumbs buttons showing total counts.
  - When a thumb is clicked, a textarea appears (`What could be better?` / `What did you like?`) with a Save button.
  - "Thanks for your feedback" confirmation toast on save.
  - If the user already rated, show their existing selection highlighted with an "Update feedback" affordance.

## Files to add / change

**New**
- `supabase/migrations/<ts>_news_watchlist_and_ratings.sql`
- `src/hooks/useNewsWatchlist.ts`
- `src/hooks/useDigestRating.ts`
- `src/components/news/WatchlistEditor.tsx`
- `src/components/news/DigestRatingPanel.tsx`

**Edit**
- `src/pages/News.tsx` — reading time, updated timestamp, watchlist integration, rating panel
- `supabase/functions/ai-news-digest/index.ts` — broadcast notification on first generation of the day
- `src/App.tsx` — remove duplicate `/terms` route

**Delete**
- `src/pages/Support.tsx` (orphan)

## Notes
- All three new tables/queries are user-scoped with RLS — no admin-only data leaks.
- No mock data. Empty states: "No watchlist set — track your favourite currencies" and "Be the first to rate today's digest".
- Rating component uses existing shadcn `Button`, `Textarea`, and Lucide `ThumbsUp`/`ThumbsDown` icons.
