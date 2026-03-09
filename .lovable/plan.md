

## Plan: Remove All Fake/Mock Data from Landing Page

I found several places across the landing page with hardcoded fake data. Here is what needs to change:

### Problems Found (Fake Data)

| Location | Fake Data |
|---|---|
| **HeroSection** | Mini chart bars `[40,65,50...]`, "+$1,234.56 ↑", "🎯 New Signal", "+24% this month" |
| **HeroSection** | Avatar circles with letters A/B/C/D pretending to be real users |
| **TestimonialsCarousel** | 4 entirely fabricated people with fake names, roles, and profit percentages |
| **ForecastPreview** | "📈 85% Win Rate" hardcoded badge |
| **FinalCTA** | "127 traders joined in the last 24 hours", fake avatar initials |
| **TrustBadges** | "Award Winning" claim |

### What stays (already real)
- Platform stats in Hero + StatsCounter (from `get_platform_stats` RPC) — real DB data
- Feature descriptions in InteractiveFeatures — these describe actual product features, not claims

### Changes

**1. `src/components/landing/HeroSection.tsx`**
- Remove the fake mini chart bars and "+24% this month" text
- Remove "+$1,234.56 ↑" and "🎯 New Signal" floating badges
- Remove fake avatar circles (A/B/C/D)
- Keep the real stats grid (users_count, forecasts_count, etc. from DB)
- Replace mini chart with a simple "Powered by real market data" note or remove entirely

**2. `src/components/landing/TestimonialsCarousel.tsx`**
- Remove all 4 fake testimonials
- Replace with a section that fetches real user count from `get_platform_stats` and shows a community stat instead (e.g., "Join X+ traders on ArovaForex")
- OR remove the testimonials section entirely until real reviews exist
- Alternative: convert to a "What You Get" value proposition section with no fake quotes

**3. `src/components/landing/ForecastPreview.tsx`**
- Replace hardcoded "85% Win Rate" with the real `avg_win_rate` from `get_platform_stats`
- Keep "Clear Entry/Exit" and "Real-time Updates" badges (these describe features, not stats)

**4. `src/components/landing/FinalCTA.tsx`**
- Remove "127 traders joined in the last 24 hours" — replace with real `users_count` from DB: "Join X+ traders"
- Remove fake avatar initials (JM, SC, MB, EW)

**5. `src/components/landing/TrustBadges.tsx`**
- Remove "Award Winning" badge (unless there's a real award)
- Keep SSL Encrypted, GDPR Compliant, Bank-Level Security (these are factual platform features)

**6. `src/pages/Index.tsx`**
- If testimonials section is removed, remove import and component usage

### Approach
- Every number shown to visitors will come from the database via `get_platform_stats`
- No fabricated people, names, profit claims, or stats
- Feature descriptions (what the product does) are kept since they describe real functionality
- The page will be honest and data-driven

