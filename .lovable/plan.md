

## Audit: What to Remove, Fix, and Add

I've reviewed the full codebase. Here's a prioritized breakdown across three categories.

---

### REMOVE -- Mock/Fake Data (Make Everything Real)

1. **Premium Signals page uses hardcoded mock signals** (`src/pages/PremiumSignals.tsx`)
   - `mockSignals` array with fake trades (EUR/USD, GBP/JPY, USD/CAD) and `isPremiumUser = false` hardcoded
   - Replace with real signals from a `signals` Supabase table (admin publishes signals, users see them based on subscription)

2. **Wallet: RecentTransactions falls back to fake sample data** (`src/components/wallet/RecentTransactions.tsx`)
   - On error, generates fake transactions ("Bank Transfer Deposit", "Referral Bonus")
   - Fix: show empty state or error message instead of fabricated data

3. **Wallet: BalanceChart generates random chart data** (`src/components/wallet/BalanceChart.tsx`)
   - Falls back to `Math.random() * 2000 + 3000` fake balance history
   - Fix: show "No data yet" empty state when no real data exists

4. **Wallet: PaymentMethods shows fake card** (`src/components/wallet/PaymentMethods.tsx`)
   - Falls back to a fake Visa ending in 4242 belonging to "John Doe"
   - Fix: show empty state ("No payment methods added")

5. **Signals: PerformanceMetrics generates random stats** (`src/components/signals/PerformanceMetrics.tsx`)
   - Creates fake monthly win rates and trade counts
   - Fix: either pull from real data or show placeholder until real signals exist

6. **Signals: SignalsTestimonials has fake reviews** (`src/components/signals/SignalsTestimonials.tsx`)
   - "John Smith", "Sarah Johnson", "Mike Chen" with fake profit numbers
   - Remove entirely or replace with real testimonials from a database table

---

### FIX -- Things That Need Updating

7. **Subscription plans are not connected to payments** (`src/components/wallet/SubscriptionPlans.tsx`)
   - Buttons say "Upgrade" but do nothing -- integrate Stripe for real payments or at minimum redirect to WhatsApp like Academy does

8. **Currency Strength Heatmap shows "Demo Mode" toast** (`src/components/calendar/CurrencyStrengthHeatmap.tsx`)
   - Shows demo data toast when API fails -- should either work with real data or have a cleaner fallback

9. **Landing page "14-Day Free Trial" pill is misleading** (`src/components/landing/HeroSection.tsx`)
   - There's no trial system implemented -- either remove this claim or implement actual trial logic

10. **ForecastPreview on landing page is a static mockup** (`src/components/landing/ForecastPreview.tsx`)
    - Shows a fake "platform mockup" with decorative bars -- replace with a real screenshot or live preview of actual forecasts

---

### ADD -- Modern Features

11. **Real Premium Signals system**
    - Create a `signals` table in Supabase
    - Admin publishes signals (pair, direction, entry, SL, TP, confidence, analysis)
    - Premium users see live signals; free users see blurred previews
    - Real-time updates via Supabase subscriptions

12. **Stripe payment integration for subscriptions**
    - Connect Stripe to handle Free/Premium/Professional tiers
    - Track subscription status in database
    - Gate premium features (signals, academy) behind active subscription

13. **Push notifications / Email digests**
    - Send email when new forecast is published or signal is triggered
    - Use Supabase Edge Functions + Resend for delivery

14. **User onboarding tour**
    - First-time users get a guided walkthrough of key features (journal, forecasts, calculator)
    - Track completion in user profile

15. **Social proof: Real-time activity feed on landing page**
    - "Trader X just joined" / "New forecast posted" live ticker
    - Pulls from real Supabase data instead of fake testimonials

---

### Suggested Priority Order

| Priority | Task | Impact |
|----------|------|--------|
| 1 | Remove all mock/fake data fallbacks (items 2-6) | Trust / integrity |
| 2 | Fix misleading claims (items 9-10) | Credibility |
| 3 | Build real Signals system (item 11) | Core feature |
| 4 | Integrate Stripe payments (item 12) | Revenue |
| 5 | Add modern UX features (items 13-15) | Polish |

### Files affected for mock data removal:
- `src/components/wallet/RecentTransactions.tsx`
- `src/components/wallet/BalanceChart.tsx`
- `src/components/wallet/PaymentMethods.tsx`
- `src/components/signals/PerformanceMetrics.tsx`
- `src/components/signals/SignalsTestimonials.tsx`
- `src/pages/PremiumSignals.tsx`
- `src/components/calendar/CurrencyStrengthHeatmap.tsx`
- `src/components/landing/HeroSection.tsx` (remove "14-Day Free Trial" pill)
- `src/components/landing/ForecastPreview.tsx`

Which items would you like to tackle first?

