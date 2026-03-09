import { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const PAIR_GROUPS = [
  {
    label: 'Forex Majors',
    pairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'USD/CHF'],
  },
  {
    label: 'Forex Crosses',
    pairs: ['GBP/JPY', 'EUR/JPY', 'EUR/GBP', 'AUD/JPY', 'CAD/JPY', 'EUR/AUD', 'GBP/AUD', 'EUR/CAD', 'GBP/CAD'],
  },
  {
    label: 'Commodities',
    pairs: ['XAU/USD', 'XAG/USD'],
  },
  {
    label: 'Crypto',
    pairs: ['BTC/USD', 'ETH/USD', 'BNB/USD', 'SOL/USD', 'XRP/USD'],
  },
  {
    label: 'Indices',
    pairs: ['SPX', 'IXIC', 'DJI'],
  },
];

interface PairSelectorProps {
  value: string;
  onChange: (pair: string) => void;
}

export function PairSelector({ value, onChange }: PairSelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = PAIR_GROUPS.map(g => ({
    ...g,
    pairs: g.pairs.filter(p => p.toLowerCase().includes(search.toLowerCase())),
  })).filter(g => g.pairs.length > 0);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Trading Pair</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-9 justify-between text-left text-xs font-medium bg-background/50 border-border/60"
          >
            {value}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search pairs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-7 text-xs bg-background/50 border-border/60"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.map(group => (
              <Collapsible key={group.label} defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold hover:text-muted-foreground transition-colors">
                  {group.label}
                  <ChevronDown className="w-3 h-3" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {group.pairs.map(pair => (
                    <button
                      key={pair}
                      onClick={() => { onChange(pair); setOpen(false); setSearch(''); }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors',
                        pair === value
                          ? 'bg-primary/15 text-primary font-medium'
                          : 'text-foreground hover:bg-muted/60'
                      )}
                    >
                      {pair}
                    </button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No pairs found</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
