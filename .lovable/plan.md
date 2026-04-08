

## Plan: Enhance Arova AI Assistant Capabilities

The AI integration is already active. This plan upgrades the assistant from a simple Q&A chatbot to a context-aware AI companion across the platform.

### What Already Works
- Draggable floating button with position persistence
- Streaming chat powered by Gemini via Lovable AI Gateway
- Page-specific suggestion carousel on hover
- Chat history saved to Supabase

### What to Add

**1. Context-Aware System Prompt (Edge Function)**

Update `supabase/functions/chat/index.ts` to accept the current page path from the client. Append page-specific context to the system prompt so the AI knows what the user is looking at:
- On `/dashboard`: "The user is viewing their trading dashboard with market overview, today's stats, and performance charts."
- On `/journal`: "The user is in their trade journal. They can log trades, view analytics, and connect brokers."
- On `/forecasts`: "The user is browsing market forecasts with charts and sentiment analysis."
- etc.

This makes AI responses much more relevant without any new infrastructure.

**2. Inline AI Tips (Smart Tooltips on Dashboard Pages)**

Add small AI-powered tip cards that appear contextually on key pages:
- **Dashboard**: A dismissible "AI Insight" card in the SmartInsights section that summarizes the user's recent performance (e.g., "Your win rate improved 5% this week")
- **Journal**: After logging a trade, show an AI-generated reflection prompt ("What was your emotional state during this trade?")
- **Calculator**: Auto-suggest position size based on recent journal entries

These would use the same `chat` edge function with non-streaming single-shot calls.

**3. Quick Action Commands in Chat**

Teach the assistant to recognize commands and link to platform features:
- "Take me to journal" → renders a button linking to `/dashboard/journal`
- "Show my stats" → renders inline stats from `get_platform_stats`
- "Calculate position size for EURUSD" → renders a link to the calculator pre-filled

This requires updating the system prompt and adding a simple command parser in the chat message renderer.

**4. AI-Powered Page Summaries**

When a user lands on a page for the first time (tracked in localStorage), show a brief AI-generated summary bubble explaining what the page does and how to use it — replacing the static onboarding tour with dynamic, conversational guidance.

### Files to Change

| File | Change |
|---|---|
| `supabase/functions/chat/index.ts` | Accept `currentPage` param, add page context to system prompt |
| `src/hooks/useArovaAssistant.ts` | Send `location.pathname` with each message |
| `src/components/assistant/ChatMessage.tsx` | Parse and render action buttons (links to pages) |
| `src/components/dashboard/SmartInsights.tsx` | Add optional AI insight card |
| `src/components/assistant/ArovaAssistant.tsx` | Minor: pass page context |

### Technical Approach
- All AI calls go through the existing `chat` edge function — no new functions needed
- Page context is appended to the system prompt server-side (not exposed to client)
- Inline tips use `supabase.functions.invoke('chat')` with non-streaming for single responses
- No new tables needed — uses existing `assistant_chat_messages` for history

### Priority Order
1. Context-aware system prompt (biggest impact, smallest change)
2. Quick action commands in chat
3. Inline AI tips on dashboard
4. AI-powered page summaries (can replace onboarding tour later)

