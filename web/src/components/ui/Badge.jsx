import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-[rgba(107,33,168,0.08)] text-[#6b21a8] border border-[rgba(107,33,168,0.12)]',
  success:
    'bg-[rgba(5,150,105,0.08)] text-[#059669] border border-[rgba(5,150,105,0.2)]',
  warning:
    'bg-[rgba(217,119,6,0.08)] text-[#d97706] border border-[rgba(217,119,6,0.2)]',
  danger:
    'bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]',
  neutral:
    'bg-[#f3f4f6] text-[#6b7280] border border-[#e5e7eb]',
  purple:
    'bg-[rgba(107,33,168,0.08)] text-[#6b21a8] border border-[rgba(107,33,168,0.12)]',
};

export default function Badge({ children, variant = 'neutral', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
