import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, RotateCcw } from "lucide-react";

interface SentimentFilterProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  counts: {
    long: number;
    short: number;
    neutral: number;
    total: number;
  };
}

export default function SentimentFilter({ activeFilter, onFilterChange, counts }: SentimentFilterProps) {
  const filters = [
    {
      key: 'long',
      label: 'Long',
      icon: TrendingUp,
      count: counts.long,
      color: 'text-success hover:text-success hover:bg-success/10 border-success/20',
      activeColor: 'bg-success/10 text-success border-success/40'
    },
    {
      key: 'short',
      label: 'Short', 
      icon: TrendingDown,
      count: counts.short,
      color: 'text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20',
      activeColor: 'bg-destructive/10 text-destructive border-destructive/40'
    },
    {
      key: 'neutral',
      label: 'Neutral',
      icon: Minus,
      count: counts.neutral,
      color: 'text-warning hover:text-warning hover:bg-warning/10 border-warning/20',
      activeColor: 'bg-warning/10 text-warning border-warning/40'
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border/30">
      <div className="flex items-center gap-2 mr-4">
        <span className="text-sm font-medium text-foreground">Filter by sentiment:</span>
        <span className="text-xs text-muted-foreground">({counts.total} total)</span>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.key;
          
          return (
            <Button
              key={filter.key}
              variant="outline"
              size="sm"
              onClick={() => onFilterChange(isActive ? null : filter.key)}
              className={`flex items-center gap-1.5 h-8 px-3 text-xs font-medium transition-all duration-200 ${
                isActive 
                  ? filter.activeColor 
                  : `text-muted-foreground hover:border-primary/30 ${filter.color}`
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{filter.label}</span>
              <span className="ml-1 px-1.5 py-0.5 bg-background/50 rounded text-xs font-semibold">
                {filter.count}
              </span>
            </Button>
          );
        })}
        
        {activeFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange(null)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}