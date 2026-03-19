import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-[#f5f0ff] text-[#6b21a8] border border-[#ede9fe]',
  success:
    'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]',
  warning:
    'bg-[#fffbeb] text-[#d97706] border border-[#fde68a]',
  danger:
    'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]',
  neutral:
    'bg-[#f9fafb] text-[#6b7280] border border-[#e5e7eb]',
  purple:
    'bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe]',
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
