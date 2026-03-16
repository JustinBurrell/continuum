import { Link } from 'react-router-dom';
import { Linkedin, Globe, FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// TODO: Replace these with actual URLs
const JUSTIN_LINKEDIN = 'https://linkedin.com/in/justinburrell';
const JUSTIN_WEBSITE = 'https://justinburrell.com';
const JUSTIN_RESUME = 'https://justinburrell.com/resume';

function NavBar({ user }) {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-serif font-bold text-xl text-primary tracking-tight">Continuum</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 mr-2">
          <Link to="/product" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors px-3 py-2">Product</Link>
          <Link to="/about" className="text-sm font-medium text-primary border-b-2 border-primary px-3 py-2">About</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors px-4 py-2">Sign in</Link>
              <Link to="/register" className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors">Get started</Link>
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
    <div className="min-h-screen bg-background">
      <NavBar user={user} />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight mb-5">
          About Continuum
        </h1>
        <p className="text-lg text-secondary leading-relaxed">
          Built for students navigating school and career at the same time — because no one should
          have to juggle ten different apps to stay on top of their life.
        </p>
      </section>

      {/* Origin story */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">How it started</h2>
          <div className="space-y-5 text-secondary leading-relaxed">
            <p>
              Continuum was built as part of <span className="font-semibold text-foreground">TEI 2026</span> —
              The Entrepreneurs Initiative — a selective program at Lehigh University that supports
              student founders building real products. TEI pushed us to move fast, validate ideas,
              and ship something students would actually use.
            </p>
            <p>
              The inspiration came from a real problem: students managing notes in one app, tasks
              in another, job applications in a spreadsheet, and flashcards in a fourth tool —
              with none of it connected. Continuum was designed to close that gap.
            </p>
            <p>
              The project was also supported through partnerships with{' '}
              <span className="font-semibold text-foreground">Google Play</span> and{' '}
              <span className="font-semibold text-foreground">All Star Code</span> — an organization
              dedicated to increasing diversity in tech by providing computer science education and
              career development to underrepresented young men. These partnerships grounded
              Continuum in a real mission: building tools that work for the students who need them most.
            </p>
            <p>
              The platform is built on a Node.js + Express backend with MongoDB, a React frontend,
              and a suite of AI features powered by Groq. Every feature — from note summaries to
              resume scoring — was designed to reduce friction, not add it.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-primary">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">The mission</h2>
          <p className="text-white/80 leading-relaxed text-lg max-w-xl mx-auto">
            Give every student — regardless of background — a single, intelligent workspace
            that connects their academic work to their career ambitions.
          </p>
        </div>
      </section>

      {/* Meet the team */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-foreground mb-2">Meet the team</h2>
        <p className="text-secondary mb-10">The people behind Continuum.</p>

        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col sm:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full bg-primary flex items-center justify-center"
              style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: 'serif' }}
            >
              JB
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-foreground">Justin Burrell</h3>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                Founder
              </span>
            </div>
            <p className="text-sm text-secondary mb-1">
              Senior at Lehigh University &mdash; Computer Science
            </p>
            <p className="text-sm text-secondary mb-6 leading-relaxed">
              Built Continuum end-to-end: architecture, backend API (70+ endpoints), frontend,
              AI integrations, and infrastructure. Passionate about building tools that make a
              real difference for students navigating the gap between school and career.
            </p>

            {/* Links */}
            <div className="flex flex-wrap gap-3">
              <a
                href={JUSTIN_LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground border border-border rounded-lg px-4 py-2 hover:bg-accent hover:border-primary/30 transition-colors no-underline"
              >
                <Linkedin size={15} className="text-[#0077b5]" /> LinkedIn
              </a>
              <a
                href={JUSTIN_WEBSITE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground border border-border rounded-lg px-4 py-2 hover:bg-accent hover:border-primary/30 transition-colors no-underline"
              >
                <Globe size={15} className="text-primary" /> Website
              </a>
              <a
                href={JUSTIN_RESUME}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground border border-border rounded-lg px-4 py-2 hover:bg-accent hover:border-primary/30 transition-colors no-underline"
              >
                <FileText size={15} className="text-primary" /> Resume
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Partnerships */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-foreground mb-2">Supported by</h2>
        <p className="text-secondary mb-8">Organizations that made this possible.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              name: 'TEI 2026',
              description: "Lehigh University's Entrepreneurs Initiative — a selective program supporting student founders building real ventures.",
            },
            {
              name: 'Google Play',
              description: 'Partnership providing resources and distribution support for student-built technology products.',
            },
            {
              name: 'All Star Code',
              description: 'A nonprofit expanding access to computer science education and career pathways for underrepresented young men in tech.',
            },
          ].map(org => (
            <div key={org.name} className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-2">{org.name}</h3>
              <p className="text-xs text-secondary leading-relaxed">{org.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-foreground text-sm">Continuum</span>
          </Link>
          <p className="text-xs text-secondary">Your academic &amp; career companion.</p>
        </div>
      </footer>
    </div>
  );
}
