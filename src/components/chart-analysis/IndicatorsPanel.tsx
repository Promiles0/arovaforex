import { useState } from 'react';
import { Activity, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface IndicatorsPanelProps {
  activeIndicators: string[];
  onToggleIndicator: (id: string) => void;
}

const indicators = [
  { id: 'SMA', name: 'SMA (20)', icon: TrendingUp, color: '#2962FF' },
  { id: 'EMA', name: 'EMA (20)', icon: TrendingUp, color: '#FF6D00' },
  { id: 'RSI', name: 'RSI (14)', icon: Activity, color: '#9C27B0' },
  { id: 'BB', name: 'Bollinger Bands', icon: BarChart3, color: '#4CAF50' },
];

export function IndicatorsPanel({ activeIndicators, onToggleIndicator }: IndicatorsPanelProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          Indicators {activeIndicators.length > 0 && `(${activeIndicators.length})`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-0.5">
          {indicators.map((ind) => {
            const Icon = ind.icon;
            const isActive = activeIndicators.includes(ind.id);
            return (
              <button
                key={ind.id}
                onClick={() => onToggleIndicator(ind.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                }`}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ind.color }} />
                <span className="flex-1 text-left">{ind.name}</span>
                {isActive && <span className="text-xs text-primary">✓</span>}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
