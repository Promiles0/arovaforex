## Plan: Expand AI Across the Platform

You already have a strong AI base: the draggable Arova Assistant, context-aware system prompts, action buttons, smart insights on the dashboard, and first-visit page summary bubbles. Below is a prioritized expansion that adds AI to the pages where it will create the most value, plus a few **new AI-first pages** worth adding.

All features reuse the existing `chat` edge function (and a new lightweight `ai-task` edge function for non-conversational, structured outputs) — no new infrastructure beyond that.

---

### 🔥 Tier 1 — High-impact additions to existing pages

**1. Journal → AI Trade Coach**
- After saving a trade entry: AI generates a 3-bullet review (what went well, what to improve, emotional pattern detected).
- "Weekly Recap" card at the top of `/dashboard/journal` summarizing the last 7 days: best/worst trade, most-traded pair, behavioral patterns (e.g. "You revenge-traded twice on Wednesday").
- "Tag this trade" button → AI auto-suggests tags (FOMO, breakout, news, etc.) from the notes.
- Files: `JournalEntryForm.tsx`, new `components/journal/AITradeReview.tsx`, new `components/journal/WeeklyAIRecap.tsx`.

**2. Forecasts → AI Chart Reader & Sentiment Synthesizer**
- On each forecast card: "Explain this setup" button → AI reads the caption + sentiment and produces a beginner-friendly explanation with risk notes.
- Top of `/dashboard/forecasts`: "Today's Market Brief" — AI aggregates all active forecasts into a 2-paragraph macro view.
- Files: `EnhancedForecastCard.tsx`, new `components/forecasts/MarketBriefCard.tsx`.

**3. Calculator → AI Position Sizing Advisor**
- After a calculation: an AI panel that critiques the proposed risk based on the user's recent journal performance ("Your win rate on EURUSD is 38% — consider halving this size").
- Natural-language input: "I want to risk $50 on gold with 30 pip stop" → AI fills the form.
- Files: `pages/Calculator.tsx`, new `components/calculator/AIRiskAdvisor.tsx`.

**4. Calendar → AI Event Impact Brief**
- Click an economic event → AI explains in plain English: what the event is, why it matters, historic market reaction, which pairs to watch.
- "Plan my week" button → AI generates a trading plan based on upcoming high-impact events + user's preferred instruments.
- Files: `pages/Calendar.tsx`, new `components/calendar/AIEventBrief.tsx`.

**5. Backtesting → AI Strategy Critic**
- After a backtest run: AI analyzes results (drawdown, win rate, R:R) and suggests one specific parameter to tweak.
- "Describe your strategy in plain English" → AI converts to backtestable rules.
- Files: `ResultsPanel.tsx`, `StrategyPanel.tsx`.

**6. Live Room → AI Chat Moderator + Recap**
- Real-time toxicity / spam filter for `LiveChat` (already-typed messages get an AI score before send if flagged).
- "What did I miss?" button → AI summarizes the last N messages of the live chat for late joiners.
- Files: `live-room/chat/ChatInput.tsx`, new `live-room/AICatchUp.tsx`.

**7. Profile → AI Trader Personality**
- "Generate my trader profile" — AI analyzes journal data + preferences and produces a personality card (e.g. "Patient swing trader with strong risk discipline, but tends to over-trade on Fridays"). Shareable as an image.
- Files: `pages/Profile.tsx`, new `components/profile/AITraderPersona.tsx`.

---

### ✨ Tier 2 — Brand new AI-first pages

**8. `/dashboard/coach` — Arova Coach (full-page AI mentor)**
- A dedicated full-screen conversational coach (separate from the floating widget) with persistent multi-thread chat history, saved playbooks, and lesson plans tailored to the user's journal data.
- Threaded conversations like ChatGPT, with sidebar of past topics.
- Files: new `pages/Coach.tsx`, new `components/coach/*`, route in `App.tsx`.

**9. `/dashboard/news` — AI News Digest**
- Pulls forex/crypto news (RSS or free API) and an AI generates: 5-bullet daily digest, sentiment per major pair, "what to watch today".
- Files: new `pages/NewsDigest.tsx`, new edge function `news-digest`.

**10. `/dashboard/playbook` — AI Strategy Playbook Builder**
- User describes a setup once; AI converts it into a structured playbook (entry rules, exit rules, invalidation, R:R). Saved playbooks become checklists in the journal entry form.
- Files: new `pages/Playbook.tsx`, new table `trading_playbooks` (RLS scoped to `user_id`).

**11. `/dashboard/learn` — AI-personalized Academy lessons**
- Replace/augment `JoinAcademy` with an AI tutor that picks the next lesson based on what the user struggles with in their journal (e.g. detects high losses around news → recommends "Trading the News" lesson).
- Files: extend `JoinAcademy.tsx` or new `pages/LearnPath.tsx`.

---

### 🛠️ Tier 3 — Admin AI helpers

**12. Admin → AI Reply Drafter for `/admin/contact`**
- One-click "Draft reply" on each contact message — AI proposes a polite, on-brand response the admin can edit before sending.

**13. Admin → AI Insights on `/admin/analytics`**
- "Explain this trend" button on each chart; AI describes anomalies and suggests actions.

**14. Admin → AI Signal Caption Generator on `/admin/signals`**
- When publishing a signal, AI auto-drafts a caption + risk disclaimer from the entry/SL/TP values.

**15. Admin → AI Notification Composer on `/admin/notifications`**
- AI rewrites broadcast messages for tone (urgent / friendly / educational) and target audience.

---

### 🧩 Tier 4 — Cross-cutting AI utilities

- **Global ⌘K AI Command Bar** — type natural language ("show my last 10 EURUSD trades", "go to backtesting", "what's NFP?") → AI routes to action / page / answer.
- **AI image alt-text** for forecast uploads (accessibility + SEO).
- **AI translation toggle** in Settings — translate the entire UI / forecasts to user's language on the fly.

---

### Technical foundation (one-time work)

1. **New edge function `ai-task`** (non-streaming, JSON output) for structured tasks: trade reviews, summaries, tag suggestions, playbook generation. Uses the same Lovable AI Gateway.
2. **Reusable hook `useAITask(taskType, input)`** → returns `{ data, loading, error }`. All Tier 1 features use this.
3. **Token/cost guardrails**: per-user daily AI request quota table + RLS, so heavy users don't blow the AI budget. Surface remaining quota in Settings.
4. **Cache layer**: hash `(taskType + input)` → cache results for 24 h in a `ai_cache` table to avoid repeat costs (e.g. same forecast explained 100 times).

---

### Suggested rollout order

1. **Foundation**: `ai-task` edge function + `useAITask` hook + quota table.
2. **Tier 1.1–1.3** (Journal Coach, Forecast Brief, Calculator Advisor) — biggest user value.
3. **Tier 2.8** (`/dashboard/coach` full page) — flagship feature.
4. **Tier 3** admin helpers (fast wins, low risk).
5. **Tier 4** command bar + remaining items.

---

### What I need from you before building

Pick which slice to build first — recommended starting point:

- **Option A (recommended)**: Foundation + Journal AI Coach + Forecast Market Brief + Calculator Advisor. Ships the most user-visible value in one go.
- **Option B**: Foundation + the new `/dashboard/coach` full-page AI mentor. Flagship single feature.
- **Option C**: Admin AI helpers (reply drafter, signal captions, analytics explainer). Low-risk, internal value.
- **Option D**: Custom — tell me which numbered items above you want first.

Also note: there's a small **build error unrelated to AI** in `supabase/functions/fetch-chart-data/index.ts` and `market-data/index.ts` (`'error' is of type 'unknown'`). I'll fix those in the same pass when implementation starts.
