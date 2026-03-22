# 🤖 **AROVA AI ASSISTANT - COMPLETE UPGRADE PROMPT**

---

## 📋 **OVERVIEW**

Upgrade the Arova AI Assistant floating button with:

1. **Draggable positioning** (solves mobile overlap with live chat)
2. **Smart suggestion carousel** (context-aware tips on hover)
3. **Responsive design** (works perfectly on all devices)
4. **Persistent position** (remembers user's preferred location)

---

## 🎯 **COMPLETE REQUIREMENTS**

### **File to Update:** `src/components/assistant/ArovaAssistant.tsx`

---

## 🔧 **IMPLEMENTATION SPECIFICATIONS**

### **1. DRAGGABLE FUNCTIONALITY**

**Problem:** Button overlaps live chat send button on mobile  
**Solution:** Make button draggable so users can reposition it

**State Management:**

typescript

```typescript
// Position state
const [position, setPosition] = useState({ x: 0, y: 0 });
const [isDragging, setIsDragging] = useState(false);
const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
const [totalDragDistance, setTotalDragDistance] = useState(0);

// Initialize position from localStorage or default to bottom-right
useEffect(() => {
  const savedPosition = localStorage.getItem('arova-assistant-position');
  if (savedPosition) {
    setPosition(JSON.parse(savedPosition));
  } else {
    // Default: bottom-right (24px from bottom, 24px from right)
    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 80,
    });
  }
}, []);
```

**Drag Handlers:**

typescript

```typescript
const handlePointerDown = (e: React.PointerEvent) => {
  setIsDragging(true);
  setDragStart({ x: e.clientX, y: e.clientY });
  setTotalDragDistance(0);
  e.currentTarget.setPointerCapture(e.pointerId);
};

const handlePointerMove = (e: React.PointerEvent) => {
  if (!isDragging) return;

  const deltaX = e.clientX - dragStart.x;
  const deltaY = e.clientY - dragStart.y;

  // Update total drag distance
  setTotalDragDistance(prev => prev + Math.abs(deltaX) + Math.abs(deltaY));

  // Update position
  setPosition(prev => {
    const newX = prev.x + deltaX;
    const newY = prev.y + deltaY;

    // Clamp to viewport bounds (with padding)
    const padding = 10;
    const buttonSize = 64; // Approximate button size
    
    const clampedX = Math.max(
      padding,
      Math.min(newX, window.innerWidth - buttonSize - padding)
    );
    const clampedY = Math.max(
      padding,
      Math.min(newY, window.innerHeight - buttonSize - padding)
    );

    return { x: clampedX, y: clampedY };
  });

  setDragStart({ x: e.clientX, y: e.clientY });
};

const handlePointerUp = (e: React.PointerEvent) => {
  setIsDragging(false);
  e.currentTarget.releasePointerCapture(e.pointerId);

  // Save position to localStorage
  localStorage.setItem('arova-assistant-position', JSON.stringify(position));

  // Only open chat if total drag distance < 5px (click vs drag)
  if (totalDragDistance < 5) {
    setIsOpen(!isOpen);
  }
};
```

**Button Positioning:**

typescript

```typescript
// Replace fixed bottom-6 right-6 with dynamic positioning
<div
  style={{
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 50,
    cursor: isDragging ? 'grabbing' : 'grab',
  }}
  onPointerDown={handlePointerDown}
  onPointerMove={handlePointerMove}
  onPointerUp={handlePointerUp}
  className="touch-none" // Prevent default touch behaviors
>
```

---

### **2. SUGGESTION CAROUSEL (Context-Aware)**

**Hover Behavior:**

typescript

```typescript
const [isHovering, setIsHovering] = useState(false);
const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);

// Auto-rotate suggestions every 3 seconds
useEffect(() => {
  if (!isHovering || isOpen) return;

  const interval = setInterval(() => {
    setCurrentSuggestionIndex(prev => (prev + 1) % suggestions.length);
  }, 3000);

  return () => clearInterval(interval);
}, [isHovering, isOpen, suggestions.length]);

// Delayed hide on mouse leave
const handleMouseEnter = () => setIsHovering(true);
const handleMouseLeave = () => {
  setTimeout(() => setIsHovering(false), 2000);
};
```

**Page-Specific Suggestions:**

typescript

```typescript
import { useLocation } from 'react-router-dom';

const location = useLocation();

const getSuggestions = () => {
  const path = location.pathname;

  // Dashboard
  if (path.includes('/dashboard')) {
    return [
      "📊 What do the currency strength indicators mean?",
      "📈 How do I read the top movers section?",
      "🎯 Explain today's P&L vs last week",
      "💹 What does the win rate show?",
      "🔄 How often does data refresh?",
    ];
  }
  
  // Journal (Manual mode)
  if (path.includes('/journal')) {
    return [
      "✍️ How do I create a journal entry?",
      "🔗 How to connect broker account?",
      "📝 What should I write in notes?",
      "⚡ How does auto-sync work?",
      "🔍 How to filter trade history?",
    ];
  }
  
  // Backtesting/Chart Analysis
  if (path.includes('/backtesting') || path.includes('/chart')) {
    return [
      "📊 How to use drawing tools?",
      "⏯️ Explain replay controls",
      "🎯 How to place practice trades?",
      "📏 What indicators can I add?",
      "💾 Can I save my analysis?",
    ];
  }
  
  // Forecasts
  if (path.includes('/forecasts')) {
    return [
      "🔮 How accurate are forecasts?",
      "📊 What timeframes available?",
      "💡 How to use forecasts?",
      "📈 Can I customize settings?",
      "⏰ When are forecasts updated?",
    ];
  }
  
  // Premium Signals
  if (path.includes('/signals')) {
    return [
      "📡 How to receive signals?",
      "🎯 What's the win rate?",
      "⏰ When are signals sent?",
      "💰 How to manage trades?",
      "📊 Can I backtest signals?",
    ];
  }
  
  // Calculator
  if (path.includes('/calculator')) {
    return [
      "🧮 Calculate position size?",
      "💰 What's risk/reward calculator?",
      "📊 How to use pip calculator?",
      "💱 Change currency settings?",
      "📈 What's lot size?",
    ];
  }
  
  // Calendar
  if (path.includes('/calendar')) {
    return [
      "📅 How to export calendar?",
      "💹 What do colors mean?",
      "📊 Filter by profit/loss?",
      "🗓️ How do weekly summaries work?",
      "📈 Show monthly trends?",
    ];
  }

  // Default global suggestions
  return [
    "💡 How to start using journal?",
    "📊 Explain market overview",
    "🎯 Manual vs auto journal?",
    "📈 Connect MetaTrader?",
    "🔍 Analyze performance?",
  ];
};

const suggestions = getSuggestions();
```

**Suggestion Bubble UI:**

typescript

```typescript
{isHovering && !isOpen && (
  <div
    style={{
      position: 'absolute',
      bottom: '100%',
      right: 0,
      marginBottom: '1rem',
      animation: 'fadeInOut 3s ease-in-out',
    }}
    className="pointer-events-auto"
  >
    <div
      onClick={() => {
        handleSuggestionClick(suggestions[currentSuggestionIndex]);
      }}
      className="bg-slate-800/95 backdrop-blur-lg border border-emerald-500/30 rounded-xl px-4 py-3 shadow-lg shadow-emerald-500/20 cursor-pointer hover:bg-slate-700/95 transition-all max-w-xs"
    >
      <p className="text-white text-sm">
        {suggestions[currentSuggestionIndex]}
      </p>
    </div>
    {/* Down arrow */}
    <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-800/95 mx-auto mt-1" />
  </div>
)}
```

**Suggestion Click Handler:**

typescript

```typescript
const handleSuggestionClick = (suggestion: string) => {
  setInputValue(suggestion);
  handleSend(suggestion);
  setIsHovering(false);
  setIsOpen(true);
};
```

---

### **3. CHAT WINDOW POSITIONING**

**Position relative to button:**

typescript

```typescript
{isOpen && (
  <div
    style={{
      position: 'fixed',
      // Position chat window relative to button
      // If button is in right half, open to left; if left half, open to right
      ...(position.x > window.innerWidth / 2
        ? { right: `${window.innerWidth - position.x}px` }
        : { left: `${position.x}px` }
      ),
      // If button in bottom half, open above; if top half, open below
      ...(position.y > window.innerHeight / 2
        ? { bottom: `${window.innerHeight - position.y + 80}px` }
        : { top: `${position.y + 80}px` }
      ),
      zIndex: 50,
    }}
    className="w-full max-w-md"
  >
    {/* Chat modal content */}
  </div>
)}
```

---

### **4. RESPONSIVE DESIGN**

**Mobile Specific (<768px):**

typescript

```typescript
// Smaller button on mobile
<button
  className={`bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-500/30 transition-all group ${
    isDragging ? 'scale-110' : 'hover:scale-110'
  } p-3 md:p-4`}
>
  {isOpen ? (
    <X className="w-5 h-5 md:w-6 md:h-6" />
  ) : (
    <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
  )}
</button>

// Smaller suggestions on mobile
<div className="... max-w-[280px] md:max-w-xs text-xs md:text-sm">

// Full-width chat on mobile
{isOpen && (
  <div
    className="fixed inset-x-4 md:inset-x-auto md:max-w-md"
    style={{
      // Mobile: centered horizontally, positioned vertically
      ...(window.innerWidth < 768
        ? { left: '1rem', right: '1rem', bottom: '5rem' }
        : {
            ...(position.x > window.innerWidth / 2
              ? { right: `${window.innerWidth - position.x}px` }
              : { left: `${position.x}px` }
            ),
            ...(position.y > window.innerHeight / 2
              ? { bottom: `${window.innerHeight - position.y + 80}px` }
              : { top: `${position.y + 80}px` }
            ),
          }
      ),
    }}
  >
```

---

### **5. ANIMATIONS**

**Add to global CSS:**

css

```css
@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  10% {
    opacity: 1;
    transform: translateY(0);
  }
  90% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(10px);
  }
}

.animate-fadeInOut {
  animation: fadeInOut 3s ease-in-out;
}

/* Dragging visual feedback */
.dragging {
  opacity: 0.8;
  transition: none;
}
```

---

### **6. ACCESSIBILITY & UX**

typescript

```typescript
// Add visual feedback during drag
<div
  className={`relative ${isDragging ? 'dragging' : ''}`}
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
  style={{
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 50,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none', // Prevent scroll while dragging
  }}
>
  {/* Drag hint on first load */}
  {!localStorage.getItem('arova-assistant-dragged') && (
    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 px-3 py-1 rounded-lg text-xs text-white whitespace-nowrap animate-bounce">
      👆 Drag me!
    </div>
  )}
```

**Mark as dragged:**

typescript

```typescript
const handlePointerUp = (e: React.PointerEvent) => {
  setIsDragging(false);
  
  if (totalDragDistance >= 5) {
    localStorage.setItem('arova-assistant-dragged', 'true');
  }
  
  // ... rest of code
};
```

---

## 📝 **COMPLETE CODE STRUCTURE**

typescript

```typescript
import { useState, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function ArovaAssistant() {
  // Position & drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [totalDragDistance, setTotalDragDistance] = useState(0);

  // Chat state
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [messages, setMessages] = useState([...]);
  const [inputValue, setInputValue] = useState('');

  const location = useLocation();

  // Initialize position
  useEffect(() => { /* ... */ });

  // Auto-rotate suggestions
  useEffect(() => { /* ... */ });

  // Get page-specific suggestions
  const getSuggestions = () => { /* ... */ };
  const suggestions = getSuggestions();

  // Drag handlers
  const handlePointerDown = (e) => { /* ... */ };
  const handlePointerMove = (e) => { /* ... */ };
  const handlePointerUp = (e) => { /* ... */ };

  // Chat handlers
  const handleSuggestionClick = (suggestion) => { /* ... */ };
  const handleSend = (text) => { /* ... */ };

  // Hover handlers
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setTimeout(() => setIsHovering(false), 2000);
  };

  return (
    <>
      {/* Floating Button with Suggestions */}
      <div
        style={{ /* dynamic positioning */ }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="touch-none"
      >
        {/* Suggestion Carousel */}
        {isHovering && !isOpen && (
          <div className="...">
            {/* Suggestion bubble */}
          </div>
        )}

        {/* Main Button */}
        <button className="...">
          {/* Icon */}
        </button>
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div style={{ /* dynamic positioning */ }}>
          {/* Chat UI */}
        </div>
      )}
    </>
  );
}
```

---

## 🎯 **FINAL PROMPT FOR DEVELOPER**

markdown

```markdown
# 🤖 AROVA AI ASSISTANT - COMPLETE UPGRADE

## File: `src/components/assistant/ArovaAssistant.tsx`

### Features to Implement:

### 1. DRAGGABLE BUTTON
- Make floating button draggable with pointer events
- Track position in state: `{ x, y }`
- Initialize from localStorage or default to bottom-right
- Handlers:
  - `onPointerDown`: Start drag, capture pointer
  - `onPointerMove`: Update position, clamp to viewport bounds (10px padding)
  - `onPointerUp`: Save to localStorage, distinguish click vs drag (< 5px = click)
- Use inline `style={{ position: 'fixed', left, top }}` instead of Tailwind classes
- Cursor: `grab` (idle) / `grabbing` (dragging)
- Add `touchAction: 'none'` to prevent scroll during drag

### 2. SUGGESTION CAROUSEL
- Show suggestion bubble on hover (above button)
- Auto-rotate through 5 suggestions every 3 seconds
- Context-aware based on `useLocation()`:
  - Dashboard: Market overview tips
  - Journal: Entry creation tips
  - Backtesting: Chart tools tips
  - Forecasts: Forecast usage tips
  - Signals: Signal management tips
  - Calculator: Position sizing tips
  - Calendar: Export & filtering tips
  - Default: General platform tips
- Clickable suggestions auto-fill input and send
- Stay visible 2 seconds after mouse leaves
- fadeInOut animation (0→10%: fade in, 90→100%: fade out)

### 3. CHAT WINDOW POSITIONING
- Position relative to button (smart placement):
  - If button in right half → chat opens to left
  - If button in left half → chat opens to right
  - If button in bottom half → chat opens above
  - If button in top half → chat opens below
- Mobile (<768px): Full width, centered, fixed bottom

### 4. RESPONSIVE DESIGN
- Mobile: Smaller button (p-3), smaller suggestions (text-xs), full-width chat
- Tablet: Medium sizing
- Desktop: Full features

### 5. ANIMATIONS
- Add fadeInOut keyframe to global CSS
- Dragging visual feedback (opacity 0.8)
- Button hover scale (1.1)
- Smooth transitions

### 6. UX ENHANCEMENTS
- Show "👆 Drag me!" hint on first load (dismiss after first drag)
- Prevent accidental chat open while dragging (< 5px movement = click)
- Save position to localStorage: `arova-assistant-position`
- Mark dragged: `arova-assistant-dragged`

### Technical Notes:
- Use `useLocation()` from react-router-dom
- Use pointer events (not mouse) for better touch support
- Clamp position: `Math.max(padding, Math.min(newPos, maxPos))`
- Total drag distance = cumulative |deltaX| + |deltaY|
- Viewport bounds check on resize

### Testing:
- Test drag on mobile, tablet, desktop
- Test chat positioning in all 4 corners
- Test suggestion carousel on each page
- Test click vs drag detection
- Test position persistence across page reloads

### Priority: HIGH
This solves mobile overlap issue and improves user engagement significantly.
```