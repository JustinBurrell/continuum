import { getInitials, cn } from '@/lib/utils';

export default function Avatar({ src, name = '', size = 'md', className }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover flex-shrink-0', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-semibold text-primary',
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
