import { useState } from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MobileGate() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/waitlist', {
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        source: 'mobile_gate',
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="font-marketing min-h-screen" style={{ backgroundColor: '#F8F9FA', width: '100%', overflowX: 'hidden' }}>
      {/* Background gradient + dot pattern — matches Landing.jsx */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 1000, height: 700, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(107,33,168,0.08) 0%, transparent 65%)' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}>
          <pattern id="dots-mobile" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#a087b0" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dots-mobile)" />
        </svg>
      </div>

      <div className="relative max-w-sm mx-auto px-6 pt-16 pb-16 text-center">
        {/* Badge */}
        <div
          className="mb-6"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #E5E7EB', color: '#6B21A8', fontSize: '0.75rem', fontWeight: 500, borderRadius: 999, padding: '6px 14px' }}
        >
          <Sparkles size={12} />
          AI-powered student workspace
        </div>

        {/* H1 */}
        <h1
          className="font-bold tracking-tight"
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontStyle: 'normal',
            fontSize: 'clamp(2rem, 8vw, 2.75rem)',
            color: '#111827',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Stop switching between 8 apps. Start using one.
        </h1>

        {/* Subtext */}
        <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: 1.6, marginBottom: 24 }}>
          From lecture notes to job offer, Continuum connects the whole journey.
        </p>

        {/* Mobile notice */}
        <div style={{ background: '#fef7ff', border: '1px solid #e9d5ff', borderRadius: 10, padding: '14px 18px', marginBottom: 28, color: '#6b21a8', fontSize: '0.875rem', lineHeight: 1.6, textAlign: 'left' }}>
          The full Continuum experience is built for desktop. Mobile apps are in development, sign up below to be first to know when they launch.
        </div>

        {/* Email capture */}
        {submitted ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', color: '#15803d', fontSize: '0.875rem', marginBottom: 20 }}>
            You're on the list. We'll notify you when the mobile app launches.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 10 }}>
              <Input
                type="text"
                placeholder="First name (optional)"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                disabled={loading}
                aria-label="First name"
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                error={error}
                disabled={loading}
                aria-label="Email address"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Notify me when it's ready
            </Button>
          </form>
        )}

        {/* Desktop CTA */}
        <a
          href="https://usecontinuum.dev"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b21a8', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}
        >
          Explore the full experience on web at usecontinuum.dev
          <ExternalLink size={14} />
        </a>

        {/* Placeholder for mobile screenshots + demo */}
        <div
          style={{ border: '2px dashed #d8b4fe', borderRadius: 12, padding: '40px 24px', textAlign: 'center', color: '#a87fd1', marginTop: 36, background: 'rgba(240,232,255,0.3)' }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📱</div>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#6b21a8' }}>Screenshots and demo coming soon</div>
          <div style={{ fontSize: '0.8125rem', color: '#a087b0' }}>
            Mobile app screenshots and a walkthrough video will appear here after Android development is complete.
          </div>
        </div>
      </div>
    </div>
  );
}
