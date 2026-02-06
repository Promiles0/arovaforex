import { useState } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface NotesEditorProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function NotesEditor({
  label,
  placeholder,
  value,
  onChange,
  className,
}: NotesEditorProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <motion.div
        animate={{
          borderColor: isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
        }}
        className="rounded-lg border overflow-hidden"
      >
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={3}
          className={cn(
            "border-0 resize-none focus-visible:ring-0 bg-muted/30",
            "placeholder:text-muted-foreground/50"
          )}
        />
      </motion.div>
      {value && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground text-right"
        >
          {value.length} characters
        </motion.p>
      )}
    </div>
  );
}
