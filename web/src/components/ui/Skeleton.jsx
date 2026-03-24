import { cn } from '@/lib/utils';

/**
 * Shimmer skeleton placeholder.
 *
 * Props:
 *   className  — Tailwind classes for sizing (e.g. "h-4 w-32")
 *   circle     — true → borderRadius 50% (for avatars)
 *   style      — inline style overrides
 */
export default function Skeleton({ className, circle = false, style }) {
  return (
    <div
      className={cn('skeleton-shimmer', className)}
      style={{
        borderRadius: circle ? '50%' : 8,
        minHeight: 12,
        ...style,
      }}
    />
  );
}
