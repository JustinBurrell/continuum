import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Modal({ open, onClose, title, children, className }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto',
          className
        )}
        style={{
          border: '1px solid #E5E7EB',
          boxShadow:
            '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(107,33,168,0.04)',
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <h2
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '16px',
              fontWeight: 700,
              color: '#111827',
              margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center transition-colors duration-150"
            style={{
              width: 32,
              height: 32,
              borderRadius: '0.75rem',
              color: '#a087b0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(107,33,168,0.08)';
              e.currentTarget.style.color = '#6b21a8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#a087b0';
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
