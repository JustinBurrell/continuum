import { Link } from 'react-router-dom';

const linkStyle = { color: '#6B7280', textDecoration: 'none', fontSize: 14 };

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      style={linkStyle}
      onMouseEnter={e => e.currentTarget.style.color = '#111827'}
      onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
    >
      {children}
    </Link>
  );
}

export default function MarketingFooter() {
  return (
    <footer style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          <div className="max-w-xs">
            <Link to="/" className="inline-block no-underline mb-3">
              <img src="/wordmark.svg" alt="Continuum" style={{ height: 28 }} />
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
              Your all-in-one academic and career workspace, built for students.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#111827', fontWeight: 600, letterSpacing: '0.1em' }}>
                Product
              </p>
              <ul className="space-y-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li><FooterLink to="/product">Features</FooterLink></li>
                <li><FooterLink to="/about">About</FooterLink></li>
                <li><FooterLink to="/register">Get started</FooterLink></li>
              </ul>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#111827', fontWeight: 600, letterSpacing: '0.1em' }}>
                Legal
              </p>
              <ul className="space-y-3" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li><FooterLink to="/privacy">Privacy Policy</FooterLink></li>
                <li><FooterLink to="/terms">Terms of Service</FooterLink></li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid #E5E7EB' }}
        >
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            2026 Continuum. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link
              to="/privacy"
              style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#111827'}
              onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none' }}
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
