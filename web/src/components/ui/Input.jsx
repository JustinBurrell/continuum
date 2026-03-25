import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Input = forwardRef(function Input({ className, label, error, required, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        {...props}
        className={cn(
          'w-full px-3 py-2 rounded-lg border border-border bg-white text-foreground text-sm placeholder:text-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-150',
          error && 'border-red-400 focus:border-red-400 focus:ring-red-200',
          className
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Input;
