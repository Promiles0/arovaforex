

## Plan: Rebuild Chart Analysis → Backtesting Page

Replace the current "Chart Analysis" replay-based page with a dedicated **Backtesting** page at `/dashboard/backtesting`. The old route `/dashboard/chart-analysis` will redirect to the new one.

### Architecture

```text
Desktop Layout:
┌──────────────────────┬──────────────────────────────┐
│  Strategy Settings   │  Candlestick Chart           │
│  ─────────────────   │  (lightweight-charts)        │
│  Pair selector       │  Entry/SL/TP lines drawn     │
│  Timeframe selector  │  after backtest runs         │
│  Buy / Sell toggle   │                              │
│  Entry Price input   │                              │
│  Stop Loss input     │                              │
│  Take Profit input   │                              │
│  Date Range picker   │                              │
│  [Run Backtest]      │                              │
├──────────────────────┴──────────────────────────────┤
│  Results Panel (cards): Result, Pips, R:R,          │
│  Duration, Entry, Exit                              │
└─────────────────────────────────────────────────────┘
```

### Files to Delete
- `src/pages/ChartAnalysis.tsx`
- `src/components/chart-analysis/TradingChart.tsx`
- `src/components/chart-analysis/TradingPanel.tsx`
- `src/components/chart-analysis/ReplayControls.tsx`
- `src/components/chart-analysis/DrawingToolbar.tsx`
- `src/components/chart-analysis/IndicatorsPanel.tsx`
- `src/hooks/useDrawingTools.ts`

### Files to Create

**1. `src/pages/Backtesting.tsx`** — Main page component
- Strategy settings panel (left sidebar on desktop, stacked on mobile)
- Pair selector (same pairs + more: NZDUSD, USDCHF, GBPJPY, EURJPY)
- Timeframe selector (5m, 15m, 30m, 1H, 4H, 1D)
- Buy/Sell toggle buttons
- Entry price, SL, TP number inputs
- Date range picker (start_date / end_date) using Popover + Calendar
- "Run Backtest" button with loading state
- Calls edge function with `{ symbol, interval, start_date, end_date }`
- Runs simulation logic candle-by-candle after data loads
- Draws entry/SL/TP horizontal price lines on chart
- Results panel with 6 metric cards
- Optional: save backtest to DB

**2. `src/components/backtesting/BacktestChart.tsx`** — Chart component
- lightweight-charts candlestick chart (dark theme, hex colors)
- SMA/EMA optional overlays
- After backtest: draw 3 horizontal price lines (Entry=blue, SL=red, TP=green)
- Mark the exit candle with a marker
- Responsive, 500px+ height, zoom/pan/crosshair

**3. `src/components/backtesting/StrategyPanel.tsx`** — Left sidebar form
- All inputs: pair, timeframe, direction, entry, SL, TP, date range
- Run Backtest button
- Validation (entry required, SL/TP logic based on direction)

**4. `src/components/backtesting/ResultsPanel.tsx`** — Results cards
- Trade Result (WIN/LOSS badge), Profit in pips, Risk/Reward Ratio, Trade Duration, Entry Price, Exit Price
- Hidden until backtest completes

### Files to Edit

**5. `supabase/functions/fetch-chart-data/index.ts`**
- Add support for `start_date` and `end_date` parameters
- When provided, use `&start_date=...&end_date=...` instead of `&outputsize=500`
- Keep backward compatibility (existing usage without dates still works)

**6. `src/App.tsx`**
- Replace `chart-analysis` route with `backtesting` route
- Import new `Backtesting` page

**7. Sidebar navigation** (`src/components/layout/Sidebar.tsx` or `ResponsiveSidebar.tsx`)
- Rename "Chart Analysis" to "Backtesting" and update the route

### Database (Optional — Save Backtests)
- Create `backtests` table: `id, user_id, pair, timeframe, direction, entry, stop_loss, take_profit, result (win/loss), pips, risk_reward, duration_candles, created_at`
- RLS: users can CRUD own rows
- "Save Result" button appears after a completed backtest

### Simulation Logic (in page component)
```
for each candle from entry_candle to last:
  if BUY:
    if candle.low <= stopLoss → LOSS, exit at SL
    if candle.high >= takeProfit → WIN, exit at TP
  if SELL:
    if candle.high >= stopLoss → LOSS, exit at SL  
    if candle.low <= takeProfit → WIN, exit at TP
stop at first hit; if neither hit → "No Result (Open)"
```

### Key Details
- Chart uses hex/rgba colors only (no HSL — lightweight-charts constraint)
- Edge function already has `TWELVE_DATA_API_KEY` configured
- Date range limited to reasonable spans to avoid API credit exhaustion
- Loading skeleton while fetching data
- "Run Backtest" disabled during fetch
- Mobile: settings → button → chart → results (stacked vertically)

