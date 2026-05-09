// Replaces the 11-step feature tour for fresh onboarding.
// Shows one goal-personalized "first action" CTA that sends the user
// directly to the relevant section instead of walking through every feature.
export default function ActivationStep({ headline, body, cta, route, onGo, onSkip }) {
  return (
    <div>
      <h2
        style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontWeight: 700,
          fontSize: 24,
          color: '#111827',
          lineHeight: 1.3,
          marginBottom: 8,
        }}
      >
        {headline}
      </h2>
      <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 32 }}>
        {body}
      </p>

      <button
        onClick={() => onGo(route)}
        style={{
          display: 'block',
          width: '100%',
          padding: '13px 24px',
          background: '#6B21A8',
          color: '#ffffff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 15,
          cursor: 'pointer',
          marginBottom: 12,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#581C87'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#6B21A8'; }}
      >
        {cta}
      </button>

      <button
        onClick={onSkip}
        style={{
          display: 'block',
          width: '100%',
          padding: '10px',
          background: 'none',
          border: 'none',
          color: '#a087b0',
          cursor: 'pointer',
          fontSize: 13,
          textAlign: 'center',
        }}
      >
        Skip to dashboard
      </button>
    </div>
  );
}
