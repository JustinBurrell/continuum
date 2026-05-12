import { useState, useEffect, useRef } from 'react';
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
import api from '@/lib/api';
import { posthog } from '@/lib/posthog';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IPHONE_W = 375;

// Accent colors per feature for screen preview backgrounds
const FEATURES = [
  { icon: NotebookPen,   label: 'Notes & AI summaries',  desc: 'Capture anything. Understand it instantly.',            bg: 'linear-gradient(135deg, #F3F0FF 0%, #DDD6FE 100%)', screenshot: '/screenshots/android/notes.png' },
  { icon: CalendarCheck, label: 'Tasks & deadlines',      desc: 'Stay on top of every due date, everywhere.',            bg: 'linear-gradient(135deg, #EFF6FF 0%, #BFDBFE 100%)', screenshot: '/screenshots/android/tasks.png' },
  { icon: BrainCircuit,  label: 'Smart flashcards',       desc: 'Generate cards from your notes. Study on the go.',      bg: 'linear-gradient(135deg, #F0FDF4 0%, #BBF7D0 100%)', screenshot: '/screenshots/android/flashcards.png' },
  { icon: TrendingUp,    label: 'Career pipeline',        desc: 'Track every application without switching apps.',        bg: 'linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%)', screenshot: '/screenshots/android/career.png' },
  { icon: Users,         label: 'Social & collaboration', desc: 'Connect with classmates, share notes, study together.', bg: 'linear-gradient(135deg, #FDF4FF 0%, #F5D0FE 100%)', screenshot: '/screenshots/android/social.png' },
  { icon: Puzzle,        label: 'Tool integrations',      desc: 'Connect Google Docs and more tools as we grow.',        bg: 'linear-gradient(135deg, #F0F9FF 0%, #BAE6FD 100%)', screenshot: '/screenshots/android/integrations.png' },
];

const SUCCESS_SUBTEXT = {
  ios:     "We'll reach out when the iOS app is ready for you.",
  android: "We'll reach out when the Android app is ready for you.",
  both:    "We'll reach out when both apps are ready for you.",
};

export default function MobileGate() {
  const [firstName, setFirstName]               = useState('');
  const [email, setEmail]                       = useState('');
  const [platformInterest, setPlatformInterest] = useState(null);
  const [loading, setLoading]                   = useState(false);
  const [submitted, setSubmitted]               = useState(false);
  const [error, setError]                       = useState('');
  const [formStarted, setFormStarted]           = useState(false);
  const [activeFeature, setActiveFeature]       = useState(0);

  const carouselRef = useRef(null);
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

  // Track which feature card is visible in the carousel
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const handler = () => {
      const cardWidth = el.scrollWidth / FEATURES.length;
      setActiveFeature(Math.round(el.scrollLeft / cardWidth));
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
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

  const canSubmit = firstName.trim().length > 0 && email.trim().length > 0 && platformInterest !== null;
  const heroPhoneScale = 0.40;

  return (
    <div
      className="font-marketing w-full min-h-screen"
      style={{ backgroundColor: '#F8F9FA', position: 'relative', overflowX: 'clip' }}
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

      {/* ── Section 1: Hero — Mogul pattern: left-aligned text, phone centered below ── */}
      {/* Phone sits in normal flow below the CTA; its height naturally bleeds off   */}
      {/* the viewport bottom on smaller devices, revealing more as the user scrolls. */}
      <section className="relative w-full">

        {/* Text — centered, full width */}
        <div className="w-full px-4 text-center" style={{ paddingTop: 40, paddingBottom: 28 }}>
          <h1
            className="font-bold tracking-tight"
            style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 'clamp(1.875rem, 8vw, 2.5rem)', color: '#111827', lineHeight: 1.1, marginBottom: 16 }}
          >
            Stop switching between 8 apps. Start using one.
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.9375rem', lineHeight: 1.75, marginBottom: 28 }}>
            Continuum brings your notes, tasks, flashcards, and career into one place. Collaborate with classmates, connect Google Docs and your favorite tools, and manage your academic life from one app.
          </p>
          <Button variant="primary" size="lg" className="w-full" onClick={scrollToForm}>
            Join the waitlist
          </Button>
          <p style={{ color: '#9B9B9B', fontSize: '0.6875rem', marginTop: 10, marginBottom: 0 }}>
            Web · Android soon · iOS in development
          </p>
        </div>

        {/* Phone — centered, smaller scale, bleeds off viewport on small screens */}
        {(() => {
          const phoneW = Math.min(Math.round(window.innerWidth * 0.62), 250);
          const scale  = phoneW / IPHONE_W;
          const phoneH = Math.ceil(830 * scale);
          return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: phoneW, height: phoneH, position: 'relative', flexShrink: 0 }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: IPHONE_W,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                }}>
                  {/* Pixel 9 frame */}
                  <div style={{
                    position: 'relative',
                    background: 'linear-gradient(160deg, #252525 0%, #1a1a1a 100%)',
                    borderRadius: 44,
                    padding: '15px 13px 20px',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 80px rgba(0,0,0,0.4)',
                  }}>
                    {/* Power button */}
                    <div style={{ position: 'absolute', right: -2.5, top: 148, width: 3, height: 56, background: '#222', borderRadius: '0 3px 3px 0' }} />
                    {/* Volume up */}
                    <div style={{ position: 'absolute', left: -2.5, top: 108, width: 3, height: 42, background: '#222', borderRadius: '3px 0 0 3px' }} />
                    {/* Volume down */}
                    <div style={{ position: 'absolute', left: -2.5, top: 162, width: 3, height: 42, background: '#222', borderRadius: '3px 0 0 3px' }} />
                    {/* Screen */}
                    <div style={{ borderRadius: 30, overflow: 'hidden', lineHeight: 0 }}>
                      <img src="/screenshots/android/dashboard.png" alt="Continuum dashboard" style={{ width: '100%', display: 'block' }} />
                    </div>
                    {/* Home indicator */}
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
                      <div style={{ width: 100, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── Section 2: Feature carousel ── */}
      <section className="relative w-full" style={{ paddingTop: 48, paddingBottom: 8 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 16, textAlign: 'center' }}>
          Everything you need
        </h2>

        {/* Horizontal scroll carousel — one feature per card */}
        <div
          ref={carouselRef}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            gap: 12,
            padding: '0 16px 4px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {FEATURES.map(({ icon: Icon, label, desc, bg, screenshot }) => (
            <div
              key={label}
              style={{
                flex: '0 0 min(80vw, 300px)',
                scrollSnapAlign: 'start',
                background: 'white',
                borderRadius: 16,
                border: '1px solid #E5E7EB',
                overflow: 'hidden',
              }}
            >
              {/* Screen preview — portrait 9:16, clips Android status bar */}
              <div style={{ width: '100%', aspectRatio: '9 / 16', background: bg, overflow: 'hidden' }}>
                <div style={{ margin: '10px 8px 0', borderRadius: '10px 10px 0 0', overflow: 'hidden' }}>
                  <img src={screenshot} alt={label} style={{ width: '100%', display: 'block', marginTop: -36 }} />
                </div>
              </div>

              {/* Feature text */}
              <div style={{ padding: '16px' }}>
                <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111827', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, lineHeight: 1.55 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dots indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 14 }}>
          {FEATURES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeFeature ? 20 : 6,
                height: 6,
                borderRadius: 999,
                background: i === activeFeature ? '#6B21A8' : '#D1D5DB',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      </section>

      {/* ── Section 3: Waitlist form ── */}
      <section id="waitlist-form" className="relative w-full" style={{ paddingTop: 28 }}>
        <div className="w-full px-4 pb-10">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 16, textAlign: 'center' }}>
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

      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
