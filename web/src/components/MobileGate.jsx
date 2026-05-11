import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  NotebookPen,
  CalendarCheck,
  BrainCircuit,
  TrendingUp,
  CheckCircle,
  Monitor,
} from 'lucide-react';
import api from '@/lib/api';
import posthog from '@/lib/posthog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES = [
  { icon: NotebookPen,   label: 'Notes & AI summaries',  desc: 'Capture anything. Understand it instantly.' },
  { icon: CalendarCheck, label: 'Tasks & deadlines',      desc: 'Stay on top of every due date, everywhere.' },
  { icon: BrainCircuit,  label: 'Smart flashcards',       desc: 'Generate cards from your notes. Study on the go.' },
  { icon: TrendingUp,    label: 'Career pipeline',         desc: 'Track every application without switching apps.' },
];

const SUCCESS_SUBTEXT = {
  ios:     'We\'ll reach out when the iOS app is ready for you.',
  android: 'We\'ll reach out when the Android app is ready for you.',
  both:    'We\'ll reach out when both apps are ready for you.',
};

export default function MobileGate() {
  const [firstName, setFirstName]             = useState('');
  const [email, setEmail]                     = useState('');
  const [platformInterest, setPlatformInterest] = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [submitted, setSubmitted]             = useState(false);
  const [error, setError]                     = useState('');
  const [formStarted, setFormStarted]         = useState(false);

  useEffect(() => {
    posthog.capture('mobile_landing_viewed', { platform: 'web' });
  }, []);

  function handleFieldFocus() {
    if (!formStarted) {
      setFormStarted(true);
      posthog.capture('mobile_waitlist_form_started', { platform: 'web' });
    }
  }

  function scrollToForm() {
    document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
  }

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
        firstName: firstName.trim(),
        source: 'mobile_gate',
        platformInterest,
      });
      posthog.capture('mobile_waitlist_submitted', { platform: 'web', platform_interest: platformInterest });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = firstName.trim().length > 0 && emailRegex.test(email.trim()) && platformInterest !== null;

  return (
    <div
      className="font-marketing w-full min-h-screen overflow-x-hidden"
      style={{ backgroundColor: '#F8F9FA', position: 'relative' }}
    >
      {/* Background: radial gradient + dot pattern */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(107,33,168,0.08) 0%, transparent 65%)' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}>
          <pattern id="dots-mobile" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#a087b0" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dots-mobile)" />
        </svg>
      </div>

      {/* ── Section 1: Hero ── */}
      <section className="relative w-full">
        <div className="max-w-sm mx-auto w-full px-4 pt-16 pb-10 text-center">
          {/* Badge */}
          <div
            className="mb-6"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #E5E7EB', color: '#6B21A8', fontSize: '0.75rem', fontWeight: 500, borderRadius: 999, padding: '6px 14px' }}
          >
            <Sparkles size={12} />
            Mobile app — coming soon
          </div>

          <h1
            className="font-bold tracking-tight"
            style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(2rem, 8vw, 2.5rem)', color: '#111827', lineHeight: 1.1, marginBottom: 16 }}
          >
            Your student workspace, wherever you are.
          </h1>

          <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: 1.65, marginBottom: 28 }}>
            Continuum brings your notes, tasks, flashcards, and career into one place. The mobile app is almost here — join the waitlist to be first.
          </p>

          <Button variant="primary" size="lg" className="w-full" onClick={scrollToForm}>
            Join the waitlist
          </Button>
        </div>
      </section>

      {/* ── Section 2: Device mockup ── */}
      <section className="relative w-full">
        <div className="max-w-sm mx-auto w-full px-4 pb-10">
          <div className="relative w-full" style={{ paddingBottom: '68%' }}>
            {/* Laptop placeholder — 16:10 */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{ background: '#E5E7EB', border: '1px solid #D1D5DB' }}
            />
            {/* Phone placeholder — 9:19.5, bottom-right */}
            <div
              className="absolute rounded-xl drop-shadow-xl"
              style={{
                width: '35%',
                aspectRatio: '9 / 19.5',
                bottom: '-8%',
                right: '-4%',
                background: '#D1D5DB',
                border: '1px solid #9CA3AF',
                transform: 'rotate(6deg)',
              }}
            />
          </div>
          <p style={{ color: '#9B9B9B', fontSize: '0.75rem', textAlign: 'center', marginTop: 20 }}>
            Available now on web · Android launching soon · iOS in development
          </p>
        </div>
      </section>

      {/* ── Section 3: Feature highlights ── */}
      <section className="relative w-full">
        <div className="max-w-sm mx-auto w-full px-4 pb-10">
          <p
            className="font-marketing"
            style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 12 }}
          >
            Everything you need
          </p>
          <Card style={{ padding: 0 }}>
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '16px 20px',
                  borderBottom: i < FEATURES.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}
              >
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <Icon size={20} color="#6B21A8" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827', margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* ── Section 4: Waitlist form ── */}
      <section id="waitlist-form" className="relative w-full">
        <div className="max-w-sm mx-auto w-full px-4 pb-10">
          <p
            className="font-marketing"
            style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 12 }}
          >
            Get early access
          </p>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '32px 24px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 16 }}>
              <CheckCircle size={40} color="#6B21A8" style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>
                You're on the list.
              </h2>
              <p style={{ color: '#6B7280', fontSize: '0.9375rem', margin: 0, lineHeight: 1.6 }}>
                {SUCCESS_SUBTEXT[platformInterest]}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px 20px' }}>
              {/* Platform interest pills */}
              <p style={{ fontWeight: 500, fontSize: '0.875rem', color: '#111827', marginBottom: 10 }}>
                Which platform interests you?
              </p>
              <div className="w-full grid grid-cols-3 gap-2" style={{ marginBottom: 20 }}>
                {[['ios', 'iOS'], ['android', 'Android'], ['both', 'Both']].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPlatformInterest(val)}
                    onFocus={handleFieldFocus}
                    style={{
                      padding: '8px 0',
                      borderRadius: 999,
                      border: `1px solid ${platformInterest === val ? '#6B21A8' : '#E5E7EB'}`,
                      background: platformInterest === val ? '#6B21A8' : 'white',
                      color: platformInterest === val ? 'white' : '#111827',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* First name */}
              <div style={{ marginBottom: 12 }}>
                <Input
                  label="First name"
                  type="text"
                  placeholder="Alex"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  onFocus={handleFieldFocus}
                  disabled={loading}
                  required
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={handleFieldFocus}
                  error={error}
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={!canSubmit || loading}
                className="w-full"
              >
                Join the waitlist
              </Button>

              <p style={{ color: '#9B9B9B', fontSize: '0.75rem', textAlign: 'center', marginTop: 12, marginBottom: 0 }}>
                We'll email you once when the app is ready. That's it.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Section 5: Directional desktop copy ── */}
      <section className="relative w-full" style={{ borderTop: '1px solid #E5E7EB' }}>
        <div className="max-w-sm mx-auto w-full px-4 pt-6 pb-6 text-center">
          <Monitor size={18} color="#6B7280" style={{ margin: '0 auto 8px' }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>
            Best experienced on a laptop — open usecontinuum.dev there to get started today.
          </p>
        </div>
      </section>

      {/* ── Section 6: Mobile footer ── */}
      <footer className="relative w-full">
        <div className="max-w-sm mx-auto w-full px-4 pt-4 pb-8 text-center">
          <p style={{ color: '#9B9B9B', fontSize: '0.75rem', margin: '0 0 8px' }}>
            &copy; 2026 Continuum. All rights reserved.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            <Link to="/privacy" style={{ color: '#6B7280', fontSize: '0.75rem', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
            <Link to="/terms" style={{ color: '#6B7280', fontSize: '0.75rem', textDecoration: 'underline' }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
