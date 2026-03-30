import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function MarketingNav({ active }) {
  const { user, isLoading } = useAuth();

  const linkStyle = (page) => ({
    color: active === page ? '#6b21a8' : 'rgba(17,24,39,0.55)',
    borderBottom: active === page ? '2px solid #6b21a8' : '2px solid transparent',
    fontWeight: active === page ? 600 : 500,
  });

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        backgroundColor: 'rgba(254,247,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderColor: '#ede9fe',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6b21a8, #a087b0)' }}
          >
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span
            className="font-bold text-xl tracking-tight"
            style={{ fontFamily: 'Georgia, serif', color: '#6b21a8' }}
          >
            Continuum
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/product"
            className="text-sm px-3 py-2"
            style={linkStyle('product')}
          >
            Product
          </Link>
          <Link
            to="/about"
            className="text-sm px-3 py-2"
            style={linkStyle('about')}
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3" style={{ minWidth: 160, justifyContent: 'flex-end' }}>
          {isLoading ? null : user ? (
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-white px-4 py-2 rounded-lg"
              style={{ background: '#6b21a8' }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium px-4 py-2"
                style={{ color: 'rgba(17,24,39,0.6)' }}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white px-4 py-2 rounded-lg"
                style={{ background: '#6b21a8', boxShadow: '0 1px 8px rgba(107,33,168,0.25)' }}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
