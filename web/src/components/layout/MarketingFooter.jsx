import { Link } from 'react-router-dom';

export default function MarketingFooter() {
  return (
    <footer style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#fef7ff' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
          <div className="max-w-xs">
            <Link to="/" className="flex items-center gap-2.5 no-underline mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6b21a8, #a087b0)' }}
              >
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span
                className="font-bold text-lg tracking-tight"
                style={{ fontFamily: 'Georgia, serif', color: '#6b21a8' }}
              >
                Continuum
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
              Your all-in-one academic and career workspace, built for students.
            </p>
          </div>

          <div className="flex gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#a087b0', letterSpacing: '0.12em' }}>
                Product
              </p>
              <ul className="space-y-3">
                <li>
                  <Link to="/product" className="text-sm no-underline" style={{ color: '#6b7280' }}>
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-sm no-underline" style={{ color: '#6b7280' }}>
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-sm no-underline" style={{ color: '#6b7280' }}>
                    Get started
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#a087b0', letterSpacing: '0.12em' }}>
                Legal
              </p>
              <ul className="space-y-3">
                <li>
                  <Link to="/privacy" className="text-sm no-underline" style={{ color: '#6b7280' }}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm no-underline" style={{ color: '#6b7280' }}>
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid #e5e7eb' }}
        >
          <p className="text-xs" style={{ color: '#9ca3af' }}>
            2026 Continuum. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="text-xs no-underline" style={{ color: '#9ca3af' }}>
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs no-underline" style={{ color: '#9ca3af' }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
