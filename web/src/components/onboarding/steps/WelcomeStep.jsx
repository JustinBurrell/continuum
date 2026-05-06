const heading = {
  fontFamily: 'Fraunces, Georgia, serif',
  fontSize: '1.5rem',
  fontWeight: 600,
  color: '#1a1a2e',
  margin: '0 0 10px',
  lineHeight: 1.25,
};

export default function WelcomeStep({ onContinue }) {
  return (
    <div>
      <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
      <h2 style={heading}>Welcome to Continuum</h2>
      <p style={{ color: '#6B7280', fontSize: '0.9375rem', margin: '0 0 28px', lineHeight: 1.6 }}>
        Let's spend 2 minutes setting up your account and showing you around. You can skip anything.
      </p>
      <button
        onClick={onContinue}
        style={{
          width: '100%',
          padding: '11px 0',
          background: '#6b21a8',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.9375rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#581c87'}
        onMouseLeave={e => e.currentTarget.style.background = '#6b21a8'}
      >
        Let's go
      </button>
    </div>
  );
}
