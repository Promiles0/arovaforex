## Goal

Turn the existing admin **Visitors** tab into a full "see everything that happens on my site" dashboard:

1. A list of every visitor (sessions), sortable/searchable.
2. Click any visitor → modal showing their full journey: pages visited, clicks, time on each page, total time on site, visit count, device, location, and (if logged in) profile info.
3. Top metrics with charts: unique visitors, pageviews per route, referrers, devices, browsers.

All data stays anonymous unless the visitor is a logged-in user, in which case we link to their profile. Existing tracking opt-out is respected.

---

## What we'll capture (extension of current tracking)

Today `visitor_events` only records pageviews. We'll extend tracking to also record:

- **Click events** — element tag, text (truncated), href, and path where it happened
- **Page exit / time-on-page** — how long the user stayed on each page
- **Browser** — parsed from user-agent (Chrome, Safari, Firefox, Edge, etc.)

This gives us a true activity timeline per session.

### Database changes (one migration)

Add to `visitor_events`:
- `event_type text not null default 'pageview'` — `pageview` | `click` | `pageleave`
- `element_tag text` — e.g. `BUTTON`, `A`
- `element_text text` — truncated visible text
- `element_href text` — for link clicks
- `duration_ms integer` — time spent on the page (set by `pageleave`)
- `browser text` — parsed browser name

Indexes: `(session_id, created_at)`, `(user_id)`, `(event_type)`.

A SQL view `visitor_sessions_summary` aggregates per session:
- `session_id`, `user_id`, `first_seen`, `last_seen`, `pageviews`, `clicks`, `total_duration_ms`, `country`, `city`, `device_type`, `browser`, `referrer`, `last_path`.

This view powers the visitor list efficiently without scanning all events client-side.

RLS: only admins can `select` from `visitor_events` (already true) and the new view.

---

## Frontend changes

### 1. Extend `useVisitorTracking.ts`
- Keep current pageview tracking.
- Add a global `click` listener (capture phase) — debounced, ignores form inputs, sends `{ event_type:'click', element_tag, element_text (≤80 chars), element_href, path }`.
- On route change & `visibilitychange='hidden'` & `beforeunload`, send a `pageleave` event with `duration_ms` for the previous page (uses `navigator.sendBeacon` for reliability).
- Continues to skip `/admin/*` and respect `tracking_opt_out`.

### 2. Update `track-visit` edge function
- Accept the new fields (`event_type`, `element_*`, `duration_ms`).
- Parse `browser` from user-agent server-side (Chrome / Safari / Firefox / Edge / Opera / Other).
- Validate and clamp string lengths.

### 3. Rebuild `VisitorsTab.tsx`

**Top row — KPI cards** (range: Today / 7d / 30d):
- Unique visitors (distinct sessions)
- Logged-in vs anonymous
- Total pageviews
- Total clicks
- Avg session duration
- Live count (realtime, already wired)

**Charts grid:**
- Pageviews per route (horizontal bar, top 10)
- Top referrers (horizontal bar)
- Devices (donut: desktop / mobile / tablet)
- Browsers (donut)
- Countries (donut, already exists)
- Visitors over time (area chart by day/hour)

**Visitors list** (replaces the raw events table):
- One row per session via `visitor_sessions_summary`.
- Columns: User (avatar+name if logged-in, else "Anonymous • short session id"), Country/City, Device · Browser, Pageviews, Clicks, Duration, Last seen, Referrer.
- Search by user name/email/session id, filter by Logged-in / Anonymous, sort by last_seen / duration / pageviews.
- Pagination (50/page).
- Click a row → opens `VisitorDetailModal`.

### 4. New `VisitorDetailModal.tsx`

Shows one visitor's complete picture:

- **Header**: avatar + name + email + role badge (if logged-in) OR "Anonymous visitor"; session id; first seen / last seen.
- **Stats strip**: total visits (count of distinct sessions for this user_id, if logged-in), pageviews, clicks, total time on site, avg time per page, country/city, device · browser, IP (admin-only).
- **Activity timeline** (scrollable): chronological list of events for this session — pageview / click / pageleave with relative time and duration. Each pageview shows path, time spent, referrer if first.
- **Top pages** mini-bar: most visited paths in this session.
- **Other sessions** (if logged-in user): collapsible list of their previous sessions with quick stats; clicking switches the modal to that session.
- **Quick actions**: "Open user profile" (admin route) when logged-in.

Built with the existing `Dialog` primitive (with `VisuallyHidden` `DialogTitle`/`DialogDescription` per project rule).

### 5. Realtime
Keep the existing realtime channel; new event types just appear with appropriate icons in the live feed strip at the top of the tab.

---

## Privacy & safety

- Click tracking ignores `<input>`, `<textarea>`, elements with `[data-no-track]`, and anything inside `[data-sensitive]`.
- Element text is truncated to 80 chars; never captures values from inputs.
- Existing `/admin/*` skip and `tracking_opt_out` localStorage flag both honored.
- Privacy policy page already discloses tracking — we'll add one line about anonymous click tracking.

---

## File plan

**New**
- `supabase/migrations/<ts>_visitor_events_activity.sql` — columns, indexes, view, RLS for view.
- `src/components/admin/VisitorDetailModal.tsx`
- `src/components/admin/visitors/MetricCards.tsx`
- `src/components/admin/visitors/VisitorList.tsx`
- `src/components/admin/visitors/ActivityTimeline.tsx`
- `src/hooks/useVisitorSessions.ts` — fetches summary view + filters/pagination.
- `src/hooks/useVisitorSessionDetail.ts` — fetches all events for a session + sibling sessions for the user.

**Edited**
- `src/hooks/useVisitorTracking.ts` — add click + pageleave tracking.
- `supabase/functions/track-visit/index.ts` — accept new fields, parse browser.
- `src/components/admin/VisitorsTab.tsx` — refactor to use new components.
- `src/pages/PrivacyPolicy.tsx` — one-line disclosure update.

---

## Out of scope (can do later if you want)

- Heatmaps / scroll depth tracking
- Funnel analytics
- Exporting visitor data to CSV
- Bot filtering beyond user-agent heuristics

Approve and I'll implement it end-to-end.