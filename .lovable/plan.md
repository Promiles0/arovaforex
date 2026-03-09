

## Plan: Remove Watch Demo Button

Remove the non-functional "Watch Demo" button from the hero section since there's no demo video to link to.

### Change

**`src/components/landing/HeroSection.tsx`**
- Remove the Watch Demo `<Button>` and its wrapping `motion.div`
- Remove the `Play` icon import from lucide-react (if unused elsewhere)

One small edit, no other files affected.

