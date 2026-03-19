import { cn } from '@/lib/utils';

const cardBase = {
  background: '#ffffff',
  border: '1px solid #ede9fe',
  boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
  borderRadius: '1rem',
  padding: '20px',
};

const cardHover = {
  boxShadow: '0 4px 16px rgba(107,33,168,0.1)',
  transform: 'translateY(-1px)',
};

export function Card({ className, children, onClick, style, ...props }) {
  const isClickable = Boolean(onClick);

  return (
    <div
      {...props}
      onClick={onClick}
      className={cn(isClickable && 'cursor-pointer', className)}
      style={{ ...cardBase, transition: 'box-shadow 0.15s, transform 0.15s', ...style }}
      onMouseEnter={
        isClickable
          ? (e) => {
              e.currentTarget.style.boxShadow = cardHover.boxShadow;
              e.currentTarget.style.transform = cardHover.transform;
            }
          : undefined
      }
      onMouseLeave={
        isClickable
          ? (e) => {
              e.currentTarget.style.boxShadow = cardBase.boxShadow;
              e.currentTarget.style.transform = 'translateY(0)';
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return (
    <h3
      className={cn(className)}
      style={{ fontSize: '15px', fontWeight: 700, color: '#111827', fontFamily: 'Georgia, serif' }}
    >
      {children}
    </h3>
  );
}

export function CardContent({ className, children }) {
  return <div className={cn(className)}>{children}</div>;
}
