import { Link } from 'react-router-dom';
import { Linkedin, Globe, FileText, ArrowRight, Sparkles, Github } from 'lucide-react';
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

export default function About() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <MarketingNav active="about" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(107,33,168,0.07) 0%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-20 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border"
            style={{ background: '#f5f0ff', borderColor: 'rgba(107,33,168,0.2)' }}
          >
            <Sparkles size={12} style={{ color: '#6b21a8' }} />
            <span className="text-xs font-semibold" style={{ color: '#6b21a8' }}>Our story</span>
          </div>
          <h1
            className="font-bold tracking-tight leading-tight mb-6"
            style={{ fontFamily: 'inherit', fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', color: '#111827' }}
          >
            Built for the student who is trying to do it all
          </h1>
          <p className="text-lg leading-relaxed max-w-xl mx-auto" style={{ color: '#6b7280' }}>
            Continuum was built because students deserve a single workspace that connects
            their academic grind to their career ambitions, without juggling ten different apps.
          </p>
        </div>
      </section>

      {/* Two-col story section */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-7 rounded-full" style={{ background: 'linear-gradient(180deg, #6b21a8, #a087b0)' }} />
              <h2
                className="font-bold"
                style={{ fontFamily: 'inherit', fontSize: '1.6rem', color: '#111827' }}
              >
                How it started
              </h2>
            </div>
            <div className="space-y-5 leading-relaxed" style={{ color: '#6b7280', fontSize: '1rem' }}>
              <p>
                Continuum started inside{' '}
                <span className="font-semibold" style={{ color: '#111827' }}>TEI 2026</span>, The Entrepreneurs
                Initiative at Lehigh University. TEI is a selective program that supports student founders
                building real products. The program pushed a fast cadence: validate the idea, ship fast, get feedback.
              </p>
              <p>
                The problem was personal. Students are constantly switching between a notes app, a task manager, a
                spreadsheet for job applications, and a separate flashcard tool. None of it talks to each other.
                Continuum was built to close that gap by putting everything in one place.
              </p>
              <p>
                The project grew beyond the classroom. Continuum gained support from{' '}
                <span className="font-semibold" style={{ color: '#111827' }}>Google Play</span>, which provided
                resources and distribution support for student-built technology. It also received backing from{' '}
                <span className="font-semibold" style={{ color: '#111827' }}>All Star Code</span>, a nonprofit
                dedicated to expanding access to computer science education and career pathways for
                underrepresented young men in tech.
              </p>
              <p>
                That backing shaped the mission. Continuum is not just a productivity tool. It is a platform
                built with intention, for the students who need it most.
              </p>
            </div>
          </div>

          {/* Visual accent — journey timeline */}
          <div className="flex-1 flex justify-center items-center">
            <div
              className="w-full rounded-2xl p-8"
              style={{ maxWidth: 420, background: 'white', border: '1px solid #ede9fe', boxShadow: '0 8px 40px rgba(107,33,168,0.08)' }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: '#a087b0', marginBottom: 28 }}>
                How Continuum was built
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  {
                    label: 'Ideation',
                    detail: 'What if one app replaced all of them?',
                    icon: '💡',
                    accent: '#F3F0FF',
                    border: 'rgba(107,33,168,0.15)',
                    done: true,
                  },
                  {
                    label: 'Brainstorming',
                    detail: 'Mapping every student pain point',
                    icon: '🧠',
                    accent: '#f5f0ff',
                    border: 'rgba(107,33,168,0.2)',
                    done: true,
                  },
                  {
                    label: 'Building',
                    detail: '70 endpoints, 3 AI integrations, full-stack',
                    icon: '⚙️',
                    accent: '#ede9fe',
                    border: 'rgba(107,33,168,0.25)',
                    done: true,
                  },
                  {
                    label: 'Testing',
                    detail: '130+ integration tests across 12 suites',
                    icon: '✅',
                    accent: '#ecfdf5',
                    border: 'rgba(5,150,105,0.2)',
                    done: true,
                  },
                  {
                    label: 'Storytelling',
                    detail: 'Built for the student doing it all',
                    icon: '📖',
                    accent: 'linear-gradient(135deg, #6b21a8, #a087b0)',
                    border: 'transparent',
                    done: false,
                    highlight: true,
                  },
                ].map((step, i, arr) => (
                  <div key={step.label} style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
                    {/* Left — dot + line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: step.highlight ? 'linear-gradient(135deg, #6b21a8, #a087b0)' : step.accent,
                        border: `1.5px solid ${step.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13,
                        zIndex: 1,
                      }}>
                        {step.icon}
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 16, background: 'linear-gradient(180deg, rgba(107,33,168,0.2), rgba(107,33,168,0.06))', margin: '4px 0' }} />
                      )}
                    </div>

                    {/* Right — content */}
                    <div style={{ paddingBottom: i < arr.length - 1 ? 20 : 0, paddingTop: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: step.highlight ? '#6b21a8' : '#111827', marginBottom: 2 }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
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

      {/* Friction callout */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div
          className="rounded-2xl px-8 py-14"
          style={{ background: '#F8F9FA', border: '1px solid #E5E7EB' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest text-center mb-10"
            style={{ color: '#a087b0', letterSpacing: '0.15em' }}
          >
            The problem we set out to fix
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {frictionStats.map((item) => (
              <div key={item.stat} className="text-center">
                <div
                  className="font-bold mb-3"
                  style={{ fontFamily: 'inherit', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: '#6b21a8', lineHeight: 1 }}
                >
                  {item.stat}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ background: 'linear-gradient(135deg, #6b21a8 0%, #4c1671 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.18em' }}
          >
            The mission
          </p>
          <h2
            className="font-bold text-white mb-6"
            style={{ fontFamily: 'inherit', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', lineHeight: 1.3 }}
          >
            Give every student a single,
            <br />
            intelligent workspace.
          </h2>
          <p className="text-lg leading-relaxed max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Regardless of background or resources, connecting their academic work to
            their career ambitions, in one place.
          </p>
        </div>
      </section>

      {/* Founder */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-10">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: '#a087b0', letterSpacing: '0.15em' }}
          >
            The founder
          </p>
          <h2
            className="font-bold"
            style={{ fontFamily: 'inherit', fontSize: '1.6rem', color: '#111827' }}
          >
            Meet Justin
          </h2>
        </div>

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'white', borderColor: '#ede9fe', boxShadow: '0 4px 30px rgba(107,33,168,0.07)' }}
        >
          <div style={{ height: 4, background: 'linear-gradient(90deg, #6b21a8, #a087b0)' }} />

          <div className="p-10">
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {/* Founder photo */}
              <div className="flex-shrink-0 flex flex-col items-center gap-3">
                <img
                  src="/justin.jpg"
                  alt="Justin Burrell"
                  className="rounded-2xl object-cover object-top"
                  style={{ width: 160, height: 200, border: '2px solid #ede9fe' }}
                />
                <div
                  style={{ fontSize: 11, fontWeight: 600, color: '#6b21a8', background: 'rgba(107,33,168,0.08)', borderRadius: 8, padding: '3px 12px' }}
                >
                  Founder
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-bold mb-1" style={{ fontSize: '1.3rem', color: '#111827' }}>Justin Burrell</h3>
                <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
                  Senior at Lehigh University, Computer Science
                </p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#6b7280' }}>
                  Justin built Continuum from the ground up: architecture, a 70-plus endpoint REST API,
                  a full React frontend, three AI integrations with Groq, Google OAuth, and cloud infrastructure
                  on top of MongoDB and Cloudinary.
                </p>
                <p className="text-sm leading-relaxed mb-8" style={{ color: '#6b7280' }}>
                  The goal has always been the same: build something that makes a real difference for
                  students navigating the gap between school and career.
                </p>

                <div className="flex gap-2">
                  <a
                    href={JUSTIN_LINKEDIN}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 border no-underline"
                    style={{ color: '#111827', borderColor: '#e5e7eb', background: 'white' }}
                  >
                    <Linkedin size={15} style={{ color: '#0077b5' }} /> LinkedIn
                  </a>
                  <a
                    href={JUSTIN_GITHUB}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 border no-underline"
                    style={{ color: '#111827', borderColor: '#e5e7eb', background: 'white' }}
                  >
                    <Github size={15} style={{ color: '#111827' }} /> GitHub
                  </a>
                  <a
                    href={JUSTIN_WEBSITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 border no-underline"
                    style={{ color: '#111827', borderColor: '#e5e7eb', background: 'white' }}
                  >
                    <Globe size={15} style={{ color: '#6b21a8' }} /> Website
                  </a>
                  <a
                    href={JUSTIN_RESUME}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 no-underline"
                    style={{ color: 'white', background: '#6b21a8', boxShadow: '0 2px 10px rgba(107,33,168,0.25)' }}
                  >
                    <FileText size={15} /> Resume
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partnerships */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="mb-8">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: '#a087b0', letterSpacing: '0.15em' }}
          >
            Backed by
          </p>
          <h2
            className="font-bold"
            style={{ fontFamily: 'inherit', fontSize: '1.6rem', color: '#111827' }}
          >
            Organizations that made this possible
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              name: 'Google Play',
              sub: 'Partnership',
              description: 'Resources and distribution support for student-built technology products.',
              accent: true,
            },
            {
              name: 'All Star Code',
              sub: 'Nonprofit',
              description: 'Expanding access to CS education and career pathways for underrepresented young men in tech.',
              accent: false,
            },
          ].map(org => (
            <div
              key={org.name}
              className="rounded-xl p-5 border"
              style={{
                background: org.accent ? 'rgba(107,33,168,0.04)' : 'white',
                borderColor: org.accent ? 'rgba(107,33,168,0.2)' : '#e5e7eb',
                boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              }}
            >
              <div className="mb-3">
                <h3 className="font-bold" style={{ fontSize: 14, color: '#111827' }}>{org.name}</h3>
                <p style={{ fontSize: 11, color: '#a087b0', fontWeight: 500 }}>{org.sub}</p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{org.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div
          className="rounded-2xl border px-8 py-14 text-center"
          style={{ background: '#f5f0ff', borderColor: '#ede9fe' }}
        >
          <h2
            className="font-bold mb-3"
            style={{ fontFamily: 'inherit', fontSize: '1.75rem', color: '#111827' }}
          >
            Ready to get started?
          </h2>
          <p className="mb-8 text-sm" style={{ color: '#6b7280' }}>
            Join Continuum. Free to use, built for students.
          </p>
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl"
              style={{ background: '#6b21a8', boxShadow: '0 4px 20px rgba(107,33,168,0.3)' }}
            >
              Go to Dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 text-white font-semibold px-6 py-3 rounded-xl"
                style={{ background: '#6b21a8', boxShadow: '0 4px 20px rgba(107,33,168,0.3)' }}
              >
                Create your account <ArrowRight size={15} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl border"
                style={{ background: 'white', borderColor: '#d1d5db', color: '#374151' }}
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
