import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

interface TimePeriodFilterProps {
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  startDate?: Date;
  endDate?: Date;
  onDateChange: (start?: Date, end?: Date) => void;
}

export default function TimePeriodFilter({
  period,
  onPeriodChange,
  startDate,
  endDate,
  onDateChange
}: TimePeriodFilterProps) {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom' }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {periods.map((p) => (
        <Button
          key={p.value}
          variant={period === p.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPeriodChange(p.value)}
          className={cn(
            "transition-all duration-200",
            period === p.value && "shadow-lg"
          )}
        >
          {p.label}
        </Button>
      ))}

      {period === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              {startDate && endDate ? (
                `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
              ) : (
                'Select dates'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-2">
              <div>
                <p className="text-sm font-medium mb-2">Start Date</p>
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => onDateChange(date, endDate)}
                  disabled={(date) => endDate ? date > endDate : false}
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">End Date</p>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => onDateChange(startDate, date)}
                  disabled={(date) => startDate ? date < startDate : false}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
