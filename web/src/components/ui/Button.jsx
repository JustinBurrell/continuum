import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
  outline: 'border border-border bg-white text-foreground hover:bg-accent',
  ghost: 'bg-transparent text-primary hover:bg-accent',
  danger: 'bg-destructive text-white hover:bg-red-600',
  secondary: 'bg-secondary/20 text-foreground hover:bg-secondary/30',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-xl',
  icon: 'p-2 rounded-lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
