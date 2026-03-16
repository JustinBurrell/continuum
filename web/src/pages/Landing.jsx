import { Link } from 'react-router-dom';
import {
  FileText, BookOpen, CheckSquare, Briefcase,
  MessageCircle, Sparkles, CloudUpload, ArrowRight,
  Users, Calendar, Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const features = [
  {
    icon: FileText,
    title: 'Smart Notes',
    description:
      'Write rich notes, organize by type and tag, and get instant AI-powered summaries. Export directly to Google Drive.',
  },
  {
    icon: BookOpen,
    title: 'Flashcard Study',
    description:
      'Turn your notes into flashcard sets. Study with a flip-card interface, track what you know, and generate cards with AI.',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description:
      'Track everything on a visual kanban board. Share tasks with collaborators and never miss a due date.',
  },
  {
    icon: Briefcase,
    title: 'Career Pipeline',
    description:
      'Manage your job applications in one place. Move them through stages from Applied to Offer, and get AI coaching on each role.',
  },
  {
    icon: FileText,
    title: 'Resume Tracking',
    description:
      'Upload your resumes, get AI feedback on every version, and export polished copies to Google Drive.',
  },
  {
    icon: MessageCircle,
    title: 'Social & Messaging',
    description:
      'Connect with friends, share activity, and message each other — all within your academic network.',
  },
];

const stats = [
  { value: '70+', label: 'API endpoints' },
  { value: '4', label: 'AI-powered features' },
  { value: '1', label: 'Platform for everything' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-serif font-bold text-xl text-primary tracking-tight">
              Continuum
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1 mr-2">
            <Link to="/product" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors px-3 py-2">
              Product
            </Link>
            <Link to="/about" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors px-3 py-2">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors px-4 py-2"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-accent border border-primary/20 rounded-full px-4 py-1.5 mb-8">
            <Sparkles size={13} className="text-primary" />
            <span className="text-xs font-medium text-primary">
              AI-powered academic + career platform
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-foreground tracking-tight leading-tight mb-6">
            Everything you need to{' '}
            <span className="text-primary">succeed,</span>
            <br />
            in one place.
          </h1>

          <p className="text-lg text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Continuum is your all-in-one platform for notes, flashcards, tasks, job
            applications, and more — powered by AI, designed for students and early-career
            professionals.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
            >
              Start for free <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border border-border bg-white text-foreground font-semibold px-6 py-3 rounded-xl hover:bg-accent transition-colors"
            >
              Sign in to your account
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-12 mt-16 pt-12 border-t border-border">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-primary">{s.value}</p>
                <p className="text-sm text-secondary mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App preview mockup — based on variant_ai_mockup */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div
          className="rounded-2xl overflow-hidden shadow-2xl border"
          style={{ borderColor: '#E5E7EB' }}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ background: '#F9FAFB', borderColor: '#E5E7EB' }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-3">
              <div className="rounded px-3 py-0.5 text-xs text-center max-w-xs mx-auto" style={{ background: 'white', color: '#9CA3AF', border: '1px solid #E5E7EB' }}>
                app.continuum.io/dashboard
              </div>
            </div>
          </div>

          {/* App shell */}
          <div className="flex" style={{ background: '#F9FAFB', height: 380 }}>

            {/* Sidebar */}
            <div className="flex-shrink-0 flex flex-col" style={{ width: 200, background: 'white', borderRight: '1px solid #E5E7EB', padding: 16 }}>
              {/* Brand */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6b21a8, #a087b0)' }} />
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#111827', letterSpacing: '0.3px' }}>Continuum</span>
              </div>

              {/* Workspace group */}
              <div className="mb-5">
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', marginBottom: 6, paddingLeft: 6 }}>Workspace</div>
                {[
                  { label: 'Dashboard', active: true },
                  { label: 'Notes' },
                  { label: 'Flashcards' },
                  { label: 'Tasks' },
                ].map(({ label, active }) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 8px', borderRadius: 4, marginBottom: 1,
                      fontSize: 12,
                      background: active ? '#EDE9FE' : 'transparent',
                      color: active ? '#6b21a8' : '#4B5563',
                      fontWeight: active ? 500 : 400,
                      borderLeft: active ? '2px solid #6b21a8' : '2px solid transparent',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Career group */}
              <div className="mb-5">
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', marginBottom: 6, paddingLeft: 6 }}>Career</div>
                {['Applications', 'Resumes'].map(label => (
                  <div key={label} style={{ padding: '6px 8px', borderRadius: 4, fontSize: 12, color: '#4B5563', marginBottom: 1 }}>{label}</div>
                ))}
              </div>

              {/* Social group */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', marginBottom: 6, paddingLeft: 6 }}>Social</div>
                {['Messages', 'Friends'].map(label => (
                  <div key={label} style={{ padding: '6px 8px', borderRadius: 4, fontSize: 12, color: '#4B5563', marginBottom: 1 }}>{label}</div>
                ))}
              </div>

              {/* User */}
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #a087b0, #6b21a8)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#111827' }}>Alex Chen</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>Student</div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden" style={{ padding: '24px 28px' }}>
              {/* Header */}
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 400, color: '#111827', marginBottom: 2 }}>
                    {getGreeting()}, Alex.
                  </h2>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>You have 3 assignments due tomorrow.</p>
                </div>
                <div className="flex gap-2">
                  <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 4, padding: '5px 10px', fontSize: 11, color: '#374151' }}>+ New Note</div>
                  <div style={{ background: '#6b21a8', border: '1px solid #6b21a8', borderRadius: 4, padding: '5px 10px', fontSize: 11, color: 'white' }}>+ Add Task</div>
                </div>
              </div>

              {/* 2-col grid */}
              <div className="grid gap-5" style={{ gridTemplateColumns: '2fr 1fr' }}>
                {/* Left col */}
                <div className="flex flex-col gap-5">
                  {/* Recent Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-3" style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF' }}>Recent Notes</span>
                      <span style={{ fontSize: 10, color: '#6b21a8', fontWeight: 500 }}>View all</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: 'AI', title: 'Macroeconomics Ch.4', meta: 'Summary generated · 2h ago', accent: true },
                        { icon: '✎', title: 'CS101 Algorithms', meta: 'Edited yesterday', accent: false },
                      ].map(n => (
                        <div key={n.title} style={{ background: n.accent ? 'rgba(237,233,254,0.5)' : 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 100 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#6b21a8', marginBottom: 4 }}>{n.icon}</div>
                            <div style={{ fontSize: 11, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{n.title}</div>
                            <div style={{ fontSize: 10, color: '#6B7280' }}>{n.meta}</div>
                          </div>
                          <div style={{ height: 2, width: 28, background: n.accent ? '#6b21a8' : '#E5E7EB', borderRadius: 1 }} />
                        </div>
                      ))}
                      <div style={{ border: '1px dashed #D1D5DB', borderRadius: 8, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 18 }}>+</div>
                    </div>
                  </div>

                  {/* Priority Tasks */}
                  <div>
                    <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF' }}>Priority Tasks</span>
                    </div>
                    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: 4 }}>
                      {[
                        { title: 'Submit History Essay Draft', due: 'Due Tomorrow at 11:59 PM', tag: 'Urgent', tagStyle: { background: '#FEE2E2', color: '#DC2626' } },
                        { title: 'Review Flashcards: Biology', due: 'Scheduled for Today', tag: 'Study', tagStyle: { background: '#CFFAFE', color: '#0891B2' } },
                        { title: 'Group Meeting Prep', due: 'Wed, Oct 24', tag: 'Social', tagStyle: { background: '#F3F4F6', color: '#6B7280' } },
                      ].map(t => (
                        <div key={t.title} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 4 }}>
                          <div style={{ width: 13, height: 13, border: '1px solid #D1D5DB', borderRadius: 3, flexShrink: 0, background: 'white' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#111827' }}>{t.title}</div>
                            <div style={{ fontSize: 10, color: '#6B7280' }}>{t.due}</div>
                          </div>
                          <div style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, ...t.tagStyle }}>{t.tag}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right col */}
                <div className="flex flex-col gap-5">
                  {/* Activity */}
                  <div>
                    <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF' }}>Activity Feed</span>
                    </div>
                    {[
                      { who: 'Sarah', text: ' shared "Calc II Midterm Prep" with you.', time: '10 min ago', active: true },
                      { who: 'System', text: ' imported 3 docs from Google Drive.', time: '1h ago', active: false },
                      { who: 'You', text: ' completed "Read Chapter 5".', time: '4h ago', active: false },
                    ].map((a, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', position: 'relative' }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', border: `2px solid ${a.active ? '#6b21a8' : '#D1D5DB'}`, background: a.active ? '#6b21a8' : 'white', marginTop: 3, flexShrink: 0, zIndex: 1 }} />
                        <div style={{ fontSize: 11, color: '#6B7280' }}>
                          <strong style={{ color: '#111827', fontWeight: 500 }}>{a.who}</strong>{a.text}
                          <span style={{ display: 'block', fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{a.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Applications */}
                  <div>
                    <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF' }}>Applications</span>
                    </div>
                    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '4px 12px' }}>
                      {[
                        { co: 'L', title: 'Product Intern', company: 'Linear', status: 'Interview', statusStyle: { borderColor: '#6b21a8', color: '#6b21a8', background: '#EDE9FE' } },
                        { co: 'N', title: 'Design Intern', company: 'Notion', status: 'Applied', statusStyle: { borderColor: '#D1D5DB', color: '#6B7280', background: '#F9FAFB' } },
                      ].map(app => (
                        <div key={app.co} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                          <div style={{ width: 26, height: 26, background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6B7280', marginRight: 10, flexShrink: 0 }}>{app.co}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#111827' }}>{app.title}</div>
                            <div style={{ fontSize: 10, color: '#6B7280' }}>{app.company}</div>
                          </div>
                          <div style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, border: '1px solid', ...app.statusStyle }}>{app.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Built for how you actually work
          </h2>
          <p className="text-secondary max-w-xl mx-auto">
            Every feature is designed to connect your academic life with your career goals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div
              key={f.title}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-card-hover transition-shadow"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI callout */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-primary rounded-2xl px-8 py-12 text-white flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} />
              <span className="text-sm font-semibold text-white/80">AI-powered</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">
              Let AI do the heavy lifting
            </h2>
            <p className="text-white/80 leading-relaxed max-w-md">
              Summarize notes instantly, generate flashcard sets from any content, get resume
              feedback tailored to specific roles, and receive coaching on your job applications.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-shrink-0">
            {[
              { icon: FileText, label: 'Note summaries' },
              { icon: BookOpen, label: 'Flashcard gen' },
              { icon: Briefcase, label: 'Job coaching' },
              { icon: FileText, label: 'Resume review' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
                <item.icon size={15} className="text-white/80" />
                <span className="text-xs text-white font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary features row */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Calendar,
              title: 'Unified Calendar',
              description: 'See all your tasks and deadlines in a month or week view, with overdue alerts.',
            },
            {
              icon: CloudUpload,
              title: 'Google Drive Sync',
              description: 'Export notes and resumes directly to your Drive. One click, done.',
            },
            {
              icon: Shield,
              title: 'Private by default',
              description:
                'Control who sees your activity — keep it private, share with friends, or go public.',
            },
          ].map(f => (
            <div key={f.title} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <f.icon size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-secondary">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center bg-accent rounded-2xl border border-border px-8 py-16">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Ready to get started?
          </h2>
          <p className="text-secondary mb-8 max-w-md mx-auto">
            Join Continuum and keep everything that matters — your notes, your goals, your
            career — in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-hover transition-colors"
            >
              Create your account <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border border-border bg-white text-foreground font-semibold px-6 py-3 rounded-xl hover:bg-white/80 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-foreground text-sm">Continuum</span>
          </div>
          <p className="text-xs text-secondary">
            Your academic &amp; career companion.
          </p>
        </div>
      </footer>
    </div>
  );
}
