

## Plan: Extract Under-Development Notice into a Shared Component

### Create shared component
**File**: `src/components/common/UnderDevelopmentNotice.tsx`

A self-contained component that manages its own `open` state (defaults to `true`), reads the user's display name via `useAuth`, and navigates to `/dashboard/contact` on "Contact Us" click. Each page just renders `<UnderDevelopmentNotice />` with zero props needed.

### Update three pages
Remove duplicated dialog code, imports (`Construction`, `MessageCircle`, `Dialog*`, `useAuth`, `useNavigate`, `useState` for `showNotice`, `displayName`) from:

1. **`src/pages/Wallet.tsx`** -- replace dialog block with `<UnderDevelopmentNotice />`; clean up unused imports
2. **`src/pages/ChartAnalysis.tsx`** -- same cleanup
3. **`src/pages/Calculator.tsx`** -- same cleanup

No behavior or styling changes -- purely a refactor to eliminate ~30 lines of duplicated code per page.

