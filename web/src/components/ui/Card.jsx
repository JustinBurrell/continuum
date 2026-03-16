import { cn } from '@/lib/utils';

export function Card({ className, children, onClick, ...props }) {
  return (
    <div
      {...props}
      onClick={onClick}
      className={cn(
        'bg-card rounded-xl border border-border shadow-card p-5',
        onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow duration-150',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn('mb-4', className)}>{children}</div>
  );
}

export function CardTitle({ className, children }) {
  return (
    <h3 className={cn('font-semibold text-foreground text-base', className)}>{children}</h3>
  );
}

export function CardContent({ className, children }) {
  return <div className={cn(className)}>{children}</div>;
}
