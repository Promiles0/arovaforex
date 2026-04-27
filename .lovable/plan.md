## AI Expansion — Slice 2: Advisor, Briefs & Playbook

Building on the existing `/dashboard/coach` foundation (streaming Gemini via Lovable AI Gateway + journal context injection). All three features reuse that pattern — no new infra.

---

### 1. AI Calculator Advisor (enhances `/dashboard/calculator`)

**What it does**
- Adds an **"Ask AI Advisor"** panel inside `Calculator.tsx` (collapsible card on the right, sticky on desktop, accordion on mobile).
- Pre-filled context from the active calculator tab (Position Size, R:R, P/L, Margin, Compound).
- AI returns a structured critique:
  - **Risk verdict** (Safe / Aggressive / Dangerous) with a colored badge
  - **SL/TP suggestions** based on instrument volatility heuristics + user's journal win rate per pair
  - **Position-sizing recommendation** ("Your last 10 EURUSD trades had 38% WR — consider risking 0.5% instead of 2%")
  - **One concrete next step**

**Technical**
- New edge function `ai-calc-advisor` (non-streaming, returns JSON via tool calling — `risk_verdict`, `sl_suggestion`, `tp_suggestion`, `position_recommendation`, `reasoning`).
- Pulls last 30 `journal_entries` for the selected instrument to ground advice in real history.
- Hook `useCalcAdvisor()` debounces input changes (1.5s) and caches per-input-hash for 5 min in memory.
- New component: `src/components/calculator/AIAdvisorPanel.tsx`.

---

### 2. AI Event Briefs (enhances `/dashboard/calendar`)

**What it does**
- On every `EventCard`, adds a small **"✨ Why it matters"** button that expands an AI-generated 2–3 sentence brief inline.
- Brief explains: what the event is, which pairs it impacts, typical volatility pattern, and a one-line "watch for" tip.
- For high-impact events, brief auto-loads on first card render (lazy, IntersectionObserver).

**Technical**
- New edge function `ai-event-brief` (non-streaming, plain text response).
- **Caching strategy** — new table `event_ai_briefs`:
  ```
  event_id uuid PK FK calendar_events,
  brief text,
  generated_at timestamptz,
  model text
  ```
  Briefs are shared across all users (events are public) → one generation per event, served from DB after that. Public SELECT, admin-only DELETE for regeneration.
- Admin button in `/admin/calendar-events` to "Regenerate AI brief" per event.
- Frontend: `useEventBrief(eventId)` hook checks DB first → calls function only if missing.

---

### 3. AI Playbook page (`/dashboard/playbook` — NEW)

**What it does**
- Weekly trading plan auto-generated from the user's recent activity. Layout:
  - **Hero**: "Your week in focus" — generated headline + week range
  - **Section 1: Market context** — synthesized from active `trading_signals` and recent `forecasts` (admin Arova picks)
  - **Section 2: Personal patterns** — pulled from journal: best/worst sessions, instruments to avoid this week, emotional triggers spotted
  - **Section 3: This week's gameplan** — 3–5 actionable rules ("Skip Monday Asia session — 0/4 wins", "Stick to EURUSD London opens — your 68% WR setup")
  - **Section 4: Risk budget** — recommended max risk per trade and weekly loss cap based on equity & recent drawdown
- Buttons: **Regenerate**, **Save to journal as note**, **Share with coach** (auto-creates a `coach_threads` entry).
- "Last generated 2h ago" indicator. Manual regen limited to 3/day per user.

**Technical**
- New edge function `ai-playbook-generate` — uses tool calling for structured JSON sections, then frontend renders nicely.
- New table `playbooks`:
  ```
  id uuid PK,
  user_id uuid,
  week_start date,
  content jsonb,    -- { headline, market_context, patterns, gameplan[], risk_budget }
  generated_at timestamptz,
  model text,
  unique (user_id, week_start)
  ```
  RLS: users manage own rows.
- Quota table `ai_usage_log` (user_id, feature, day, count) — checked before regen.
- Page: `src/pages/Playbook.tsx`, hook `usePlaybook()`, components `PlaybookHero`, `PlaybookSection`, `RiskBudgetCard`.
- Sidebar entry "AI Playbook" with `ScrollText` icon, added to `Sidebar.tsx` and `ResponsiveSidebar.tsx` under AI Coach.
- Route `/dashboard/playbook` registered in `App.tsx`.

---

### Shared infrastructure (small additions)

- **`ai_usage_log` table** — global per-user/per-feature/per-day counter to enforce quotas (Advisor: 30/day, Brief: shared cache so unlimited reads, Playbook: 3 regens/day).
- **Reusable `useAITask` hook** — wraps `supabase.functions.invoke` with loading/error/cached state, used by Advisor and Playbook.
- All three functions verify JWT in code (consistent with `coach-chat`).

---

### Other AI features I noticed we should add (suggestions)

Pick any to queue after this slice:

1. **Forecast Market Brief** — "Explain this setup" button on every `ForecastCard` → AI breaks down the chart context, bias rationale, and invalidation level. (Already in the master plan, high value.)
2. **Journal Auto-Tagger & Weekly Recap** — On save, AI auto-suggests tags (`breakout`, `revenge-trade`, `news-driven`) and writes a Sunday email recap of the week's trades.
3. **Live Room AI Moderator** — beyond the existing recap, add an admin-only "Summarize last 30 min" button + auto-flag toxic messages for moderation.
4. **Backtesting Critic** — after a backtest run on `/dashboard/backtesting`, AI critiques the strategy ("R:R is 1.2 but win rate needs >55% to be profitable — your sample shows 48%").
5. **Smart Contact Reply Drafter** — admin-only on `/admin/contact`: AI drafts a reply based on message + user's profile + similar past replies.
6. **AI Signal Caption Writer** — admin-only on `/admin/signals`: when publishing, AI generates a clean Telegram-style caption from SL/TP/entry.
7. **Global ⌘K Command Bar** — natural language navigation + queries ("show my XAUUSD trades from last month", "open new forecast"). Acts as a power-user shortcut layer.
8. **AI News Digest page (`/dashboard/news`)** — daily 5-bullet digest of forex news synthesized from RSS/scraped sources, with pair-impact tags.
9. **Trade Idea Generator** — paired with Playbook: button "Generate 3 trade ideas for tomorrow" using your favorite pairs + current strength heatmap.
10. **Onboarding AI Interview** — replace the static `/onboarding` with a 5-question conversational flow that fills the profile via AI extraction.

---

### Build order (this slice)

1. Shared `ai_usage_log` table + `useAITask` hook
2. AI Calculator Advisor (smallest, fastest user-visible win)
3. AI Event Briefs (cache-heavy, adds value across all users instantly)
4. `/dashboard/playbook` page (biggest, flagship of this slice)

Approve and I'll ship them in this order.