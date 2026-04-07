import { Link } from 'react-router-dom';
import { Linkedin, Globe, FileText, ArrowRight, Github } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import MarketingNav from '@/components/layout/MarketingNav';
import MarketingFooter from '@/components/layout/MarketingFooter';

const JUSTIN_LINKEDIN = 'https://www.linkedin.com/in/thejustinburrell/';
const JUSTIN_WEBSITE = 'https://www.thejustinburrell.com/';
const JUSTIN_GITHUB = 'https://github.com/JustinBurrell';
const JUSTIN_RESUME =
  'https://prlxghfadjdnxqoqwlla.supabase.co/storage/v1/object/public/assets/assets/documents/Justin%20Burrell%20Resume.pdf';

const frictionStats = [
  {
    stat: '4+',
    label: 'separate tools the average student manages every day',
  },
  {
    stat: '2h',
    label: 'lost weekly just switching between disconnected apps',
  },
  {
    stat: '1',
    label: 'workspace that closes the gap between school and career',
  },
];

const timelineSteps = [
  { label: 'Ideation', detail: 'What if one app replaced all of them?' },
  { label: 'Brainstorming', detail: 'Mapping every student pain point' },
  { label: 'Building', detail: '70 endpoints, 3 AI integrations, full-stack' },
  { label: 'Testing', detail: '130+ integration tests across 12 suites' },
  { label: 'Storytelling', detail: 'Built for the student doing it all' },
];

export default function About() {
  const { user } = useAuth();

  return (
    <div className="font-marketing min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <MarketingNav active="about" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(107,33,168,0.07) 0%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 pt-20 text-center" style={{ paddingBottom: 80 }}>
          <div
            className="inline-flex items-center rounded-full mb-6 border"
            style={{ background: 'white', border: '1px solid #E5E7EB', color: '#6B21A8', fontSize: '0.75rem', fontWeight: 500, borderRadius: 999, padding: '6px 14px' }}
          >
            Our story
          </div>
          <h1
            className="font-bold tracking-tight leading-tight mb-6"
            style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'normal', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: '#111827', textAlign: 'center' }}
          >
            Built for the student who is trying to do it all
          </h1>
          <p className="text-lg leading-relaxed max-w-xl mx-auto" style={{ color: '#6B7280', fontSize: '1.125rem', textAlign: 'center' }}>
            Continuum was built because students deserve a single workspace that connects
            their academic grind to their career ambitions, without juggling ten different apps.
          </p>
        </div>
      </section>

      {/* Two-col story section */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          {/* Left — founder story */}
          <div className="flex-1 min-w-0">
            <div style={{ borderLeft: '3px solid #6B21A8', paddingLeft: 16, marginBottom: 24 }}>
              <h2 className="font-bold" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                How it started
              </h2>
            </div>
            <div style={{ color: '#6B7280', fontSize: '1rem', lineHeight: 1.75 }}>
              <p style={{ marginBottom: 20 }}>
                Continuum started inside{' '}
                <span style={{ fontWeight: 700, color: '#111827' }}>TEI 2026</span>, The Entrepreneurs
                Initiative at Lehigh University. TEI is a selective program that supports student founders
                building real products. The program pushed a fast cadence: validate the idea, ship fast, get feedback.
              </p>
              <p style={{ marginBottom: 20 }}>
                The problem was personal. Students are constantly switching between a notes app, a task manager, a
                spreadsheet for job applications, and a separate flashcard tool. None of it talks to each other.
                Continuum was built to close that gap by putting everything in one place.
              </p>
              <p style={{ marginBottom: 20 }}>
                The project grew beyond the classroom. Continuum gained support from{' '}
                <span style={{ fontWeight: 700, color: '#111827' }}>Google Play</span>, which provided
                resources and distribution support for student-built technology. It also received backing from{' '}
                <span style={{ fontWeight: 700, color: '#111827' }}>All Star Code</span>, a nonprofit
                dedicated to expanding access to computer science education and career pathways for
                underrepresented young men in tech.
              </p>
              <p style={{ marginBottom: 20 }}>
                That backing shaped the mission. Continuum is not just a productivity tool. It is a platform
                built with intention, for the students who need it most.
              </p>
            </div>
            {/* Pull quote */}
            <div style={{ fontSize: '1.0625rem', fontStyle: 'italic', color: '#6B21A8', fontWeight: 500, borderLeft: '2px solid #6B21A8', paddingLeft: 16, marginTop: 24 }}>
              "Every feature in Continuum exists because a student needed it."
            </div>
          </div>

          {/* Right — build timeline card */}
          <div className="flex-1 flex justify-center items-start">
            <div
              style={{
                width: '100%',
                maxWidth: 420,
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                padding: 32,
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              }}
            >
              <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B21A8', marginBottom: 24 }}>
                BUILD TIMELINE
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {timelineSteps.map((step, i) => (
                  <div key={step.label} style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
                    {/* Icon + connector */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: '#F3F0FF',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1,
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B21A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div style={{ width: 1, flex: 1, minHeight: 20, background: '#E5E7EB', margin: '4px 0', marginLeft: 0 }} />
                      )}
                    </div>
                    {/* Text */}
                    <div style={{ paddingBottom: i < timelineSteps.length - 1 ? 20 : 0, paddingTop: 6 }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111827', marginBottom: 2 }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#6B7280', marginTop: 2 }}>
                        {step.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B21A8' }}>
            THE PROBLEM WE SET OUT TO FIX
          </p>
        </div>
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: 48 }}>
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {frictionStats.map((item, i) => (
              <div
                key={item.stat}
                className="text-center"
                style={{ borderRight: i < 2 ? '1px solid #E5E7EB' : 'none', padding: '0 32px' }}
              >
                <div
                  className="font-black mb-3"
                  style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'normal', fontSize: '3.75rem', color: '#6B21A8', lineHeight: 1 }}
                >
                  {item.stat}
                </div>
                <p className="text-sm leading-relaxed mx-auto" style={{ color: '#6B7280', maxWidth: 160 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ background: '#3B0764', padding: '96px 0' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
            THE MISSION
          </p>
          {/* Decorative line before headline */}
          <div style={{ width: 80, height: 1, background: 'rgba(255,255,255,0.20)', margin: '0 auto 20px' }} />
          <h2
            className="font-bold text-white"
            style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'normal', fontWeight: 700, fontSize: '2.75rem', color: 'white', textAlign: 'center' }}
          >
            Give every student a single, intelligent workspace.
          </h2>
          {/* Decorative line after headline */}
          <div style={{ width: 80, height: 1, background: 'rgba(255,255,255,0.20)', margin: '20px auto 0' }} />
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.125rem', textAlign: 'center', maxWidth: 560, margin: '24px auto 0' }}>
            Regardless of background or resources, connecting their academic work to
            their career ambitions, in one place.
          </p>
        </div>
      </section>

      {/* Founder */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B21A8', marginBottom: 12 }}>
            THE FOUNDER
          </p>
          <h2 className="font-bold" style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827' }}>
            Meet Justin
          </h2>
        </div>

        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: 40, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Left — photo + badge */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <img
                src="/justin.jpg"
                alt="Justin Burrell"
                style={{ borderRadius: 12, width: 120, height: 120, objectFit: 'cover', objectPosition: 'top' }}
              />
              <div style={{ background: '#F3F0FF', color: '#6B21A8', fontSize: '0.75rem', fontWeight: 500, borderRadius: 999, padding: '4px 12px', display: 'inline-block', marginTop: 12 }}>
                Founder
              </div>
            </div>

            {/* Right — details */}
            <div className="flex-1">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>Justin Burrell</h3>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: 4 }}>
                Senior at Lehigh University, Computer Science
              </p>
              <p style={{ fontSize: '0.9375rem', color: '#6B7280', lineHeight: 1.75, marginTop: 16, marginBottom: 0 }}>
                Justin built Continuum from the ground up: architecture, a 70-plus endpoint REST API,
                a full React frontend, three AI integrations with Groq, Google OAuth, and cloud infrastructure
                on top of MongoDB and Cloudinary.
              </p>
              <p style={{ fontSize: '0.9375rem', color: '#6B7280', lineHeight: 1.75, marginTop: 12, marginBottom: 24 }}>
                The goal has always been the same: build something that makes a real difference for
                students navigating the gap between school and career.
              </p>

              <div className="flex flex-wrap gap-2">
                {[
                  { href: JUSTIN_LINKEDIN, icon: Linkedin, label: 'LinkedIn' },
                  { href: JUSTIN_GITHUB, icon: Github, label: 'GitHub' },
                  { href: JUSTIN_WEBSITE, icon: Globe, label: 'Website' },
                ].map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 no-underline transition-all"
                    style={{ border: '1px solid #E5E7EB', background: 'white', color: '#111827', borderRadius: 8, padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#6B21A8'; e.currentTarget.style.color = '#6B21A8'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#111827'; }}
                  >
                    <Icon size={14} /> {label}
                  </a>
                ))}
                <a
                  href={JUSTIN_RESUME}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 no-underline"
                  style={{ background: '#6B21A8', color: 'white', borderRadius: 8, padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500 }}
                >
                  <FileText size={14} /> Resume
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Backers */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B21A8', marginBottom: 12 }}>
            BACKED BY
          </p>
          <h2 className="font-bold" style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827' }}>
            Organizations that made this possible
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              monogram: 'G',
              name: 'Google Play',
              badge: 'Partnership',
              description: 'Resources and distribution support for student-built technology products.',
              contribution: 'Provided mobile distribution support and resources for student-built technology',
            },
            {
              monogram: 'A',
              name: 'All Star Code',
              badge: 'Nonprofit',
              description: 'Expanding access to CS education and career pathways for underrepresented young men in tech.',
              contribution: 'Provided mentorship and expanded CS access for underrepresented young men in tech',
            },
          ].map(org => (
            <div
              key={org.name}
              style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: 32, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
            >
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#6B21A8', lineHeight: 1, marginBottom: 8 }}>{org.monogram}</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: 6 }}>{org.name}</div>
              <span style={{ background: '#F3F0FF', color: '#6B21A8', fontSize: '0.75rem', fontWeight: 500, borderRadius: 999, padding: '4px 12px', display: 'inline-block', marginBottom: 16 }}>
                {org.badge}
              </span>
              <div style={{ height: 1, background: '#E5E7EB', margin: '0 0 16px' }} />
              <p style={{ color: '#6B7280', fontSize: '0.9375rem', lineHeight: 1.625, marginBottom: 8 }}>{org.description}</p>
              <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6B21A8', marginTop: 8 }}>{org.contribution}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#6B21A8', padding: '96px 0' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="font-bold mb-4"
            style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'normal', fontSize: '2.5rem', color: 'white' }}
          >
            Ready to get started?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.125rem', marginBottom: 40 }}>
            Join Continuum. Free to use, built for students.
          </p>
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 font-semibold px-7 py-3 rounded-lg"
              style={{ background: 'white', color: '#6B21A8', fontSize: '0.9375rem', borderRadius: 8 }}
            >
              Go to Dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 font-semibold px-7 py-3 rounded-lg"
              style={{ background: 'white', color: '#6B21A8', fontSize: '0.9375rem', borderRadius: 8 }}
            >
              Start for free <ArrowRight size={15} />
            </Link>
          )}
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginTop: 12 }}>
            Free forever. No credit card required.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
