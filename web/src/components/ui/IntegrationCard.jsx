import { cn } from '@/lib/utils';
import { IntegrationLogo } from './IntegrationLogo';
import Badge from './Badge';

const cardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '14px 16px',
  background: '#ffffff',
  border: '1px solid #E5E7EB',
  borderRadius: '1rem',
  marginBottom: 10,
};

const iconWrapStyle = {
  width: 48,
  height: 48,
  borderRadius: 10,
  background: '#f3f4f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const buttonBaseStyle = {
  padding: '6px 14px',
  border: 'none',
  borderRadius: 6,
  fontSize: '0.8125rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  flexShrink: 0,
  transition: 'background 0.15s, opacity 0.15s',
};

const buttonVariants = {
  connect: {
    background: '#6b21a8',
    color: '#fff',
  },
  import: {
    background: '#6b21a8',
    color: '#fff',
  },
  custom: {
    background: 'transparent',
    color: '#dc2626',
    border: '1px solid #E5E7EB',
  },
};

const defaultLabels = {
  connect: 'Connect',
  import: 'Import',
};

export function IntegrationCard({
  icon,
  name,
  description,
  buttonLabel,
  buttonState = 'connect',
  onAction,
  disabled = false,
  badge,
  className,
}) {
  const isConnected = buttonState === 'connected';
  const label = buttonState === 'custom' ? buttonLabel : defaultLabels[buttonState] || buttonLabel;
  const variantStyle = buttonVariants[buttonState] || buttonVariants.custom;

  return (
    <div className={cn(className)} style={cardStyle}>
      <div style={iconWrapStyle}>
        <IntegrationLogo icon={icon} size={32} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#111827' }}>
            {name}
          </p>
          {badge ? <Badge variant="purple">{badge}</Badge> : null}
        </div>
        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6B7280' }}>
          {description}
        </p>
      </div>
      {isConnected ? (
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#059669',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ✓ Connected
        </span>
      ) : (
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          style={{
            ...buttonBaseStyle,
            ...variantStyle,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {label}
        </button>
      )}
    </div>
  );
}
