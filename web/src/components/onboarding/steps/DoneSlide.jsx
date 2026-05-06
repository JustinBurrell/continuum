export default function DoneSlide({ isReplay, onFinish }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 10px', lineHeight: 1.25 }}>
        {isReplay ? 'Tour complete!' : "You're all set"}
      </h2>
      <p style={{ color: '#6B7280', fontSize: '0.9375rem', margin: '0 0 28px', lineHeight: 1.6 }}>
        {isReplay
          ? 'You can replay the tour any time from your Profile page.'
          : 'Explore Continuum at your own pace. Everything is in the sidebar whenever you need it.'}
      </p>
      <button
        onClick={onFinish}
        style={{
          width: '100%', padding: '12px 0', background: '#6b21a8', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: '0.9375rem', fontWeight: 600,
          cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#581c87'}
        onMouseLeave={e => e.currentTarget.style.background = '#6b21a8'}
      >
        Go to Dashboard
      </button>
    </div>
  );
}
