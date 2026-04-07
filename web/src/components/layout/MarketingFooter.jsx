import { Link } from 'react-router-dom';

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      style={{ color: '#6B7280', textDecoration: 'none', fontSize: 14, transition: 'color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.color = '#111827'}
      onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
    >
      {children}
    </Link>
  );
}

const columnLabel = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#111827',
  marginBottom: 16,
};

export default function MarketingFooter() {
  return (
    <footer className="font-marketing" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '56px 24px 32px' }}>
        {/* Main row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, marginBottom: 48, flexWrap: 'wrap' }}>
          {/* Brand */}
          <div style={{ maxWidth: 280 }}>
            <Link to="/" style={{ display: 'inline-block', textDecoration: 'none', marginBottom: 12 }}>
              <img src="/wordmark.svg" alt="Continuum" style={{ height: 26 }} />
            </Link>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: '#6B7280', margin: 0, maxWidth: 280 }}>
              Your all-in-one academic and career workspace, built for students who want to stay ahead.
            </p>
          </div>

          {/* Link columns */}
          <div style={{ display: 'flex', gap: 64 }}>
            <div>
              <p style={columnLabel}>Product</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li><FooterLink to="/product">Features</FooterLink></li>
                <li><FooterLink to="/about">About</FooterLink></li>
                <li><FooterLink to="/register">Get started</FooterLink></li>
              </ul>
            </div>

            <div>
              <p style={columnLabel}>Legal</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li><FooterLink to="/privacy">Privacy Policy</FooterLink></li>
                <li><FooterLink to="/terms">Terms of Service</FooterLink></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
            &copy; 2026 Continuum. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link
              to="/privacy"
              style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#111827'}
              onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#111827'}
              onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
