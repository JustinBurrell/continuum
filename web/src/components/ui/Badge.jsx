import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-600',
  neutral: 'bg-secondary/20 text-foreground/70',
  purple: 'bg-purple-100 text-purple-700',
};

export default function Badge({ children, variant = 'neutral', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
