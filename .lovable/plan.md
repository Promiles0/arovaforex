

## Plan: Redesign Landing Page Hero Section

The current hero section is functional but visually flat — a text column on the left, a stats card on the right. Here's a complete redesign with stronger visual impact, better animations, and modern design patterns. All data remains real (from `get_platform_stats` RPC). No mock data.

### New Hero Design Concept

**Layout**: Full-width cinematic hero with a centered headline, animated background effects, and a floating stats bar at the bottom of the hero instead of a side card.

```text
┌──────────────────────────────────────────────┐
│  ░░ animated mesh gradient background ░░░░░  │
│                                              │
│      ● Live  ·  X+ Active Traders            │
│                                              │
│        Professional                          │
│      Forex Trading                           │
│        Platform                              │
│     (typewriter subtitle cycling)            │
│                                              │
│   [✓ No CC] [🎯 14-Day Trial] [⚡ Cancel]    │
│                                              │
│   [ ⚡ Start Trading Free → ]  [ ▶ Demo ]   │
│                                              │
│ ┌─────────┬─────────┬─────────┬─────────┐   │
│ │ X+      │ X       │ X       │ X%      │   │
│ │ Traders │ Forecas │ Active  │ WinRate │   │
│ └─────────┴─────────┴─────────┴─────────┘   │
│            (scroll indicator)                │
└──────────────────────────────────────────────┘
```

### Key Design Changes

**1. Centered layout** — headline, subtitle, CTAs all centered for stronger visual hierarchy. No split columns.

**2. Typewriter subtitle** — cycles through 3 real phrases:
- "AI-Powered Market Analysis"
- "Real-Time Trading Signals"  
- "Professional Risk Management"

**3. Animated mesh gradient background** — multiple moving gradient orbs with more vibrant colors and larger scale, creating a living backdrop.

**4. Floating stats bar** — the 4 live stats sit in a glassmorphism bar at the bottom of the hero with animated number counting. Replaces the bulky side card.

**5. Staggered entrance animations** — each element fades in with a cascading delay using spring physics for natural feel.

**6. Particle field** — more refined floating particles with varying sizes and opacities.

**7. Subtle grid pattern** — finer, more subtle background grid.

### File Changes

| File | Action |
|------|--------|
| `src/components/landing/HeroSection.tsx` | Full rewrite — centered layout, typewriter effect, floating stats bar, enhanced animations |

### Animation Details
- **Typewriter**: `framer-motion` AnimatePresence cycling text every 3 seconds with fade+slide transition
- **Stats counter**: Animated count-up on mount using `useEffect` with easing
- **Background orbs**: 3 large gradient circles with slow, offset looping translations
- **CTA button**: Shimmer sweep on hover, scale spring on tap
- **Stats bar**: Slides up from bottom with spring animation, each stat staggered by 0.1s

### What stays the same
- Real data from `get_platform_stats` RPC
- Feature pills (No CC, 14-Day Trial, Cancel Anytime) — these are real product facts
- Navigation to `/auth` or `/dashboard` based on auth state
- All other landing sections unchanged

