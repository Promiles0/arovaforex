export default function ForecastSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Image skeleton */}
      <div className="relative h-48 overflow-hidden bg-muted/30 animate-pulse" />
      
      {/* Content section */}
      <div className="relative p-6 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="h-7 w-32 bg-muted/50 rounded animate-pulse" />
          <div className="h-7 w-20 bg-muted/50 rounded-full animate-pulse" />
        </div>
        
        {/* Text skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted/50 rounded w-full animate-pulse" />
          <div className="h-4 bg-muted/50 rounded w-3/4 animate-pulse" />
        </div>
        
        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted/50 rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted/50 rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-muted/50 rounded animate-pulse" />
            <div className="w-8 h-8 bg-muted/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
