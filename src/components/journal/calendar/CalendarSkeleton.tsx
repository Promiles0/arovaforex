import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export const CalendarSkeleton = () => {
  const days = Array.from({ length: 35 }, (_, i) => i);
  
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="calendar-header-glass rounded-xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-[180px]" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-14 w-28 rounded-lg" />
            <Skeleton className="h-14 w-28 rounded-lg" />
            <Skeleton className="h-14 w-28 rounded-lg" />
          </div>
        </div>
      </div>
      
      {/* Calendar Grid Skeleton */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center py-2">
            <Skeleton className="h-4 w-8 mx-auto" />
          </div>
        ))}
        
        {/* Day Cells */}
        {days.map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.02 }}
          >
            <Skeleton 
              className="min-h-[80px] sm:min-h-[100px] rounded-xl relative overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </Skeleton>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
