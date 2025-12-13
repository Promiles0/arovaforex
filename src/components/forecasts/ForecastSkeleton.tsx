export default function ForecastSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Image skeleton with shimmer */}
      <div className="relative h-48 overflow-hidden bg-muted/30">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      
      {/* Content section */}
      <div className="relative p-6 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="relative h-7 w-32 bg-muted/50 rounded overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="relative h-7 w-20 bg-muted/50 rounded-full overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
        
        {/* Text skeleton */}
        <div className="space-y-2">
          <div className="relative h-4 bg-muted/50 rounded w-full overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="relative h-4 bg-muted/50 rounded w-3/4 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
        
        {/* Tags skeleton */}
        <div className="flex gap-2">
          <div className="relative h-6 w-16 bg-muted/50 rounded-full overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
          <div className="relative h-6 w-20 bg-muted/50 rounded-full overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        </div>
        
        {/* Footer skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 bg-muted/50 rounded-full overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="space-y-2">
              <div className="relative h-3 w-20 bg-muted/50 rounded overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="relative h-3 w-16 bg-muted/50 rounded overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative w-8 h-8 bg-muted/50 rounded overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="relative w-8 h-8 bg-muted/50 rounded overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
