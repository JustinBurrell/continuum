import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  NotebookPen,
  CalendarCheck,
  BrainCircuit,
  TrendingUp,
  Users,
  Puzzle,
  CheckCircle,
  Monitor,
} from 'lucide-react';
import { DeviceFrameset } from 'react-device-frameset';
import 'react-device-frameset/styles/marvel-devices.min.css';
import api from '@/lib/api';
import { posthog } from '@/lib/posthog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// iPhone X native dims: 375 x 812
const IPHONE_W = 375;

const FEATURES = [
  { icon: NotebookPen,   label: 'Notes & AI summaries',  desc: 'Capture anything. Understand it instantly.' },
  { icon: CalendarCheck, label: 'Tasks & deadlines',      desc: 'Stay on top of every due date, everywhere.' },
  { icon: BrainCircuit,  label: 'Smart flashcards',       desc: 'Generate cards from your notes. Study on the go.' },
  { icon: TrendingUp,    label: 'Career pipeline',         desc: 'Track every application without switching apps.' },
  { icon: Users,         label: 'Social & collaboration', desc: 'Connect with classmates, share notes, and study together.' },
  { icon: Puzzle,        label: 'Tool integrations',       desc: 'Connect Google Docs and more tools as we grow.' },
];

const SUCCESS_SUBTEXT = {
  ios:     "We'll reach out when the iOS app is ready for you.",
  android: "We'll reach out when the Android app is ready for you.",
  both:    "We'll reach out when both apps are ready for you.",
};

// iPhone X native height: 812px. At scale(0.17) → 138px tall, 64px wide — fully visible.
function MiniPhone({ bg = '#E5E7EB' }) {
  const scale = 64 / IPHONE_W;
  const scaledH = Math.ceil(812 * scale);
  return (
    <div style={{ position: 'relative', width: 64, height: scaledH, flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: IPHONE_W, transform: `scale(${scale})`, transformOrigin: 'top left', pointerEvents: 'none' }}>
        <DeviceFrameset device="iPhone X">
          <div style={{ width: '100%', height: '100%', background: bg }} />
        </DeviceFrameset>
      </div>
    </div>
  );
}

export default function MobileGate() {
  const [firstName, setFirstName]               = useState('');
  const [email, setEmail]                       = useState('');
  const [platformInterest, setPlatformInterest] = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [submitted, setSubmitted]               = useState(false);
  const [error, setError]                       = useState('');
  const [formStarted, setFormStarted]           = useState(false);

  const location = useLocation();

  useEffect(() => {
    posthog.capture('mobile_landing_viewed', { platform: 'web' });
  }, []);

  useEffect(() => {
    if (location.state?.scrollToForm) {
      setTimeout(() => {
        document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    }
  }, [location.state?.scrollToForm]);

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

  // Hero phone scale: fills 42% of the usable viewport width.
  // clamp(320,430) → phone col ~130–168px. Scale 0.40 is the midpoint sweet spot.
  const heroPhoneScale = 0.40;

  return (
    <div
      className="font-marketing w-full min-h-screen overflow-x-hidden"
      style={{ backgroundColor: '#F8F9FA', position: 'relative' }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(107,33,168,0.08) 0%, transparent 65%)' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}>
          <pattern id="dots-mobile" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#a087b0" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dots-mobile)" />
        </svg>
      </div>

      {/* ── Nav ── */}
      <nav
        className="relative w-full"
        style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="w-full px-4 py-3 flex items-center justify-between">
          <img src="/logo-lockup.svg" alt="Continuum" style={{ height: 28 }} />
          <button
            onClick={scrollToForm}
            style={{ background: 'none', border: 'none', color: '#6B21A8', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            Join the waitlist
          </button>
        </div>
      </nav>

      {/* ── Section 1: Hero — text left, phone right ── */}
      <section className="relative w-full overflow-hidden">
        <div className="w-full px-4" style={{ display: 'flex', alignItems: 'flex-start', gap: 0, paddingTop: 32, paddingBottom: 32 }}>

          {/* Left: text + CTA */}
          <div style={{ flex: '0 0 58%', paddingRight: 12, paddingTop: 8 }}>
            <h1
              className="font-bold tracking-tight"
              style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(1.5rem, 6vw, 2rem)', color: '#111827', lineHeight: 1.15, marginBottom: 12 }}
            >
              Your student workspace, wherever you are.
            </h1>
            <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: 20 }}>
              Continuum brings your notes, tasks, flashcards, and career into one place. Collaborate with classmates, connect Google Docs and your favorite tools, and manage your academic life from one app.
            </p>
            <Button variant="primary" size="md" className="w-full" onClick={scrollToForm}>
              Join the waitlist
            </Button>
          </div>

          {/* Right: iPhone frame (42%), height matches text column via alignSelf stretch */}
          <div style={{ flex: '0 0 42%', position: 'relative', overflow: 'hidden', alignSelf: 'stretch' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              right: -8,
              width: IPHONE_W,
              transform: `scale(${heroPhoneScale})`,
              transformOrigin: 'top right',
              pointerEvents: 'none',
            }}>
              <DeviceFrameset device="iPhone X">
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #F3F0FF 0%, #E5E7EB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo.svg" alt="" style={{ height: 28, opacity: 0.3 }} />
                </div>
              </DeviceFrameset>
            </div>
          </div>

        </div>
        {/* Caption */}
        <p style={{ color: '#9B9B9B', fontSize: '0.6875rem', textAlign: 'center', paddingBottom: 16 }}>
          Available now on web · Android launching soon · iOS in development
        </p>
      </section>

      {/* ── Section 2: Feature highlights with mini phone per feature ── */}
      <section className="relative w-full">
        <div className="w-full px-4 pb-10">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 16, letterSpacing: '-0.01em', textAlign: 'center' }}>
            Everything you need
          </h2>
          <Card style={{ padding: 0 }}>
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: i < FEATURES.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}
              >
                {/* Icon */}
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <Icon size={18} color="#6B21A8" />
                </div>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#111827', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</p>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{desc}</p>
                </div>
                {/* Mini iPhone placeholder */}
                <MiniPhone bg="linear-gradient(160deg, #F3F0FF 0%, #E5E7EB 100%)" />
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* ── Section 3: Waitlist form ── */}
      <section id="waitlist-form" className="relative w-full">
        <div className="w-full px-4 pb-10">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 16, letterSpacing: '-0.01em', textAlign: 'center' }}>
            Get early access
          </h2>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '32px 24px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 16 }}>
              <CheckCircle size={40} color="#6B21A8" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.5rem', fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>
                You're on the list.
              </h3>
              <p style={{ color: '#6B7280', fontSize: '0.9375rem', margin: 0, lineHeight: 1.6 }}>
                {SUCCESS_SUBTEXT[platformInterest]}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px 20px' }}>
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

      {/* ── Section 4: Directional copy ── */}
      <section className="relative w-full" style={{ borderTop: '1px solid #E5E7EB' }}>
        <div className="w-full px-4 pt-6 pb-6 text-center">
          <Monitor size={18} color="#6B7280" style={{ margin: '0 auto 8px' }} />
          <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>
            Best experienced on a laptop. Open usecontinuum.dev there to get started today.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative w-full">
        <div className="w-full px-4 pt-4 pb-8 text-center">
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
