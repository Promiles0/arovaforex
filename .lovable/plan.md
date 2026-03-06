

## Plan: Replace Rule-Based Chatbot with Real AI (Gemini via Lovable AI Gateway)

The current Arova Assistant uses a keyword-matching algorithm against an `ai_knowledge_base` table. We'll replace it with real AI conversations powered by Google Gemini through the Lovable AI Gateway (which is already available -- `LOVABLE_API_KEY` secret exists).

### What Changes

**1. Create Edge Function `supabase/functions/chat/index.ts`**
- Accepts `{ messages }` array (conversation history)
- Includes a system prompt tailored to Arova (


<lov-tool-use id="thinking-7531c5b8-78f5-46e7-a423-8c1d4d9a39ab" name="lov-think" data="The user wants to replace the current keyword-matching assistant with a real AI-powered one using Google&apos;s Gemini models. They mention &quot;Google AI Studio Gemini API key&quot; - but looking at the context, we already have LOVABLE_API_KEY configured which provides access to Gemini models through the Lovable AI Gateway. This is the recommended approach.

Let me check the current assistant implementation files to understand what needs to change." duration="2.524752">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_017pokGRpuax9W7NoC9LcbkS" name="code--view" data="{\"file_path\": \"src/components/assistant/ArovaAssistant.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_012VsMEmbBYJ9zwqsyT4fZFv" name="code--view" data="{\"file_path\": \"src/components/assistant/ChatInput.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01KGnAsvWGu28K1dbHs5M4Ry" name="code--view" data="{\"file_path\": \"src/hooks/useArovaAssistant.ts\"}">
</lov-tool-use>

<lov-tool-use id="thinking-366fd2ec-8378-4574-af4e-e3894f83bfcf" name="lov-think" data="The user wants real AI using Gemini. LOVABLE_API_KEY is already available, so I should use the Lovable AI Gateway approach - create a chat edge function and rewrite the hook for streaming." duration="1.730885">
</lov-tool-use>
<lov-plan>

## Plan: Replace Keyword-Matching Assistant with Real AI (Gemini)

The current Arova Assistant uses a keyword-matching engine (`aiAssistant.ts`). We'll replace it with real AI conversations using Google Gemini via the Lovable AI Gateway (`LOVABLE_API_KEY` is already configured).

### Changes

**1. Create Edge Function `supabase/functions/chat/index.ts`**
- Accepts `{ messages }` (conversation history)
- System prompt: Arova trading platform assistant personality, knowledgeable about platform features (wallet, journal, forecasts, live room, calculator, etc.)
- Calls Lovable AI Gateway with `google/gemini-3-flash-preview`, streaming enabled
- Returns SSE stream; handles 429/402 errors
- Add to `supabase/config.toml` with `verify_jwt = false`

**2. Rewrite `src/hooks/useArovaAssistant.ts`**
- Replace `getAssistantResponse()` with streaming fetch to the chat edge function
- Send conversation history for context
- Stream tokens into UI (progressively update last assistant message)
- Keep chat history persistence for Professional users
- Remove `matchedIntent` / `isUnmatched` fields

**3. Update `src/components/assistant/ChatMessage.tsx`**
- Enhanced markdown rendering: bold, italic, lists, code blocks, line breaks

**4. Remove keyword engine import**
- Stop importing from `src/lib/aiAssistant.ts` (file can remain for admin reference but is no longer used)

### Files
- **Create** `supabase/functions/chat/index.ts`
- **Edit** `supabase/config.toml`
- **Edit** `src/hooks/useArovaAssistant.ts`
- **Edit** `src/components/assistant/ChatMessage.tsx`

No database changes needed.

