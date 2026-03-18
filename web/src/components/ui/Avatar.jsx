import { getInitials, cn } from '@/lib/utils';

const sizeMap = {
  sm: { className: 'w-7 h-7', fontSize: '11px' },
  md: { className: 'w-9 h-9', fontSize: '13px' },
  lg: { className: 'w-12 h-12', fontSize: '16px' },
  xl: { className: 'w-16 h-16', fontSize: '22px' },
};

export default function Avatar({ src, name = '', size = 'md', className, ring = false }) {
  const { className: sizeClass, fontSize } = sizeMap[size] ?? sizeMap.md;
  const ringClass = ring ? 'ring-2 ring-purple-200 ring-offset-1' : '';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          sizeClass,
          ringClass,
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        sizeClass,
        ringClass,
        className
      )}
      style={{
        background: '#f5f0ff',
        color: '#6b21a8',
        fontWeight: 700,
        fontSize,
      }}
    >
      {getInitials(name)}
    </div>
  );
}
