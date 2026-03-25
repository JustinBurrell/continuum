import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-[#6b21a8] text-white font-semibold hover:bg-[#5b18a0] rounded-xl',
  outline:
    'border border-[#ede9fe] bg-white text-[#111827] hover:bg-[#f5f0ff] rounded-xl',
  ghost:
    'bg-transparent text-[#6b21a8] hover:bg-[#f5f0ff] rounded-xl',
  danger:
    'bg-[#dc2626] text-white hover:bg-[#b91c1c] rounded-xl',
  secondary:
    'bg-[#f5f0ff] text-[#6b21a8] hover:bg-[#ede9fe] rounded-xl',
};

const shadowMap = {
  primary: '0 1px 4px rgba(107,33,168,0.25)',
  outline: undefined,
  ghost: undefined,
  danger: undefined,
  secondary: undefined,
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-sm rounded-xl',
  icon: 'p-2 rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  style,
  ...props
}) {
  const shadow = shadowMap[variant];

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={shadow ? { boxShadow: shadow, ...style } : style}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]',
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
