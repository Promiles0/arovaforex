

## Plan: Add Secondary CTA That Scrolls to Features

Add a "See Features" outline button next to the main CTA in the hero section. Clicking it smooth-scrolls to the Interactive Features (bento grid) section.

### Changes

**`src/components/landing/HeroSection.tsx`**
- Add a second `<Button variant="outline">` with a `ChevronDown` icon and text "See Features"
- `onClick` scrolls to `#features` using `document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })`

**`src/components/landing/InteractiveFeatures.tsx`**
- Add `id="features"` to the root `<section>` element so the scroll target exists

Two small edits, no new files.

