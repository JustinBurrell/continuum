import { Link } from 'react-router-dom';
import { Linkedin, Globe, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const JUSTIN_LINKEDIN = 'https://www.linkedin.com/in/thejustinburrell/';
const JUSTIN_WEBSITE = 'https://www.thejustinburrell.com/';
const JUSTIN_RESUME =
  'https://prlxghfadjdnxqoqwlla.supabase.co/storage/v1/object/public/assets/assets/documents/Justin%20Burrell%20Resume.pdf';

function NavBar({ user }) {
  return (
    <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: 'rgba(254,247,255,0.9)', backdropFilter: 'blur(12px)', borderColor: '#ede9fe' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6b21a8, #a087b0)' }}>
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#6b21a8' }}>Continuum</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 mr-2">
          <Link to="/product" className="text-sm font-medium px-3 py-2" style={{ color: 'rgba(17,24,39,0.6)' }}>Product</Link>
          <Link to="/about" className="text-sm font-semibold px-3 py-2 border-b-2" style={{ color: '#6b21a8', borderColor: '#6b21a8' }}>About</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="text-sm font-semibold text-white px-4 py-2 rounded-lg" style={{ background: '#6b21a8' }}>Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium px-4 py-2" style={{ color: 'rgba(17,24,39,0.6)' }}>Sign in</Link>
              <Link to="/register" className="text-sm font-semibold text-white px-4 py-2 rounded-lg" style={{ background: '#6b21a8', boxShadow: '0 1px 8px rgba(107,33,168,0.25)' }}>Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default function About() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fef7ff' }}>
      <NavBar user={user} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 800, height: 600, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(107,33,168,0.07) 0%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border" style={{ background: '#f5f0ff', borderColor: 'rgba(107,33,168,0.2)' }}>
            <Sparkles size={12} style={{ color: '#6b21a8' }} />
            <span className="text-xs font-semibold" style={{ color: '#6b21a8' }}>Our story</span>
          </div>
          <h1 className="font-bold tracking-tight leading-tight mb-6" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', color: '#111827' }}>
            Built for the student who is trying to do it all
          </h1>
          <p className="text-lg leading-relaxed max-w-xl mx-auto" style={{ color: '#6B7280' }}>
            Continuum was built because students deserve a single workspace that connects
            their academic grind to their career ambitions, without juggling ten different apps.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <div className="rounded-2xl border p-10" style={{ background: 'white', borderColor: '#ede9fe', boxShadow: '0 4px 30px rgba(107,33,168,0.07)' }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-7 rounded-full" style={{ background: 'linear-gradient(180deg, #6b21a8, #a087b0)' }} />
            <h2 className="font-bold" style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: '#111827' }}>How it started</h2>
          </div>
          <div className="space-y-5 leading-relaxed" style={{ color: '#6B7280', fontSize: '1rem' }}>
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
      </section>

      {/* Mission */}
      <section style={{ background: 'linear-gradient(135deg, #6b21a8 0%, #4c1671 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.18em' }}>The mission</p>
          <h2 className="font-bold text-white mb-6" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', lineHeight: 1.3 }}>
            Give every student a single,<br />intelligent workspace.
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
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#a087b0', letterSpacing: '0.15em' }}>The founder</p>
          <h2 className="font-bold" style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: '#111827' }}>Meet Justin</h2>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: '#ede9fe', boxShadow: '0 4px 30px rgba(107,33,168,0.07)' }}>
          {/* Top accent bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #6b21a8, #a087b0)' }} />

          <div className="p-10">
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6b21a8, #a087b0)', fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'Georgia, serif', letterSpacing: 1 }}
                >
                  JB
                </div>
                <div className="mt-3 text-center">
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b21a8', background: 'rgba(107,33,168,0.08)', borderRadius: 8, padding: '3px 10px', display: 'inline-block' }}>Founder</div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-bold mb-1" style={{ fontSize: '1.3rem', color: '#111827' }}>Justin Burrell</h3>
                <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
                  Senior at Lehigh University, Computer Science
                </p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B7280' }}>
                  Justin built Continuum from the ground up: architecture, a 70-plus endpoint REST API,
                  a full React frontend, three AI integrations with Groq, Google OAuth, and cloud infrastructure
                  on top of MongoDB and Cloudinary.
                </p>
                <p className="text-sm leading-relaxed mb-8" style={{ color: '#6B7280' }}>
                  The goal has always been the same: build something that makes a real difference for
                  students navigating the gap between school and career.
                </p>

                {/* Links */}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={JUSTIN_LINKEDIN}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 border no-underline transition-all"
                    style={{ color: '#111827', borderColor: '#e5e7eb', background: 'white' }}
                  >
                    <Linkedin size={15} style={{ color: '#0077b5' }} /> LinkedIn
                  </a>
                  <a
                    href={JUSTIN_WEBSITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 border no-underline transition-all"
                    style={{ color: '#111827', borderColor: '#e5e7eb', background: 'white' }}
                  >
                    <Globe size={15} style={{ color: '#6b21a8' }} /> Website
                  </a>
                  <a
                    href={JUSTIN_RESUME}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-2.5 no-underline transition-all"
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
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#a087b0', letterSpacing: '0.15em' }}>Backed by</p>
          <h2 className="font-bold" style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: '#111827' }}>Organizations that made this possible</h2>
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
              <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{org.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border px-8 py-14 text-center" style={{ background: '#f5f0ff', borderColor: '#ede9fe' }}>
          <h2 className="font-bold mb-3" style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', color: '#111827' }}>
            Ready to get started?
          </h2>
          <p className="mb-8 text-sm" style={{ color: '#6B7280' }}>
            Join Continuum. Free to use, built for students.
          </p>
          {user ? (
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl" style={{ background: '#6b21a8', boxShadow: '0 4px 20px rgba(107,33,168,0.3)' }}>
              Go to Dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 text-white font-semibold px-6 py-3 rounded-xl" style={{ background: '#6b21a8', boxShadow: '0 4px 20px rgba(107,33,168,0.3)' }}>
                Create your account <ArrowRight size={15} />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl border" style={{ background: 'white', borderColor: '#d1d5db', color: '#374151' }}>
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E5E7EB' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: '#6b21a8' }}>
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: '#111827' }}>Continuum</span>
          </Link>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Your academic and career companion.</p>
        </div>
      </footer>
    </div>
  );
}
