import { Link } from 'react-router-dom';
import {
  FileText, BookOpen, CheckSquare, Briefcase,
  MessageCircle, Sparkles, CloudUpload, ArrowRight,
  Calendar, Shield, Brain, Zap, Target,
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
      'Manage your job applications in one place. Move them through stages from Applied to Offer.',
  },
  {
    icon: FileText,
    title: 'Resume Tracking',
    description:
      'Upload your resumes, get AI feedback on every version, and export polished copies to Google Drive.',
  },
  {
    icon: MessageCircle,
    title: 'Social and Messaging',
    description:
      'Connect with friends, share activity, and message each other, all within your academic network.',
  },
];

const aiCapabilities = [
  { icon: Brain, label: 'Note summaries' },
  { icon: Zap, label: 'Flashcard gen' },
  { icon: Target, label: 'Resume review' },
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
    <div className="min-h-screen" style={{ backgroundColor: '#fef7ff' }}>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: 'rgba(254,247,255,0.9)', backdropFilter: 'blur(12px)', borderColor: '#ede9fe' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6b21a8, #a087b0)' }}>
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#6b21a8' }}>
              Continuum
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1 mr-2">
            <Link to="/product" className="text-sm font-medium px-3 py-2" style={{ color: 'rgba(17,24,39,0.6)' }}>Product</Link>
            <Link to="/about" className="text-sm font-medium px-3 py-2" style={{ color: 'rgba(17,24,39,0.6)' }}>About</Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="text-sm font-semibold text-white px-4 py-2 rounded-lg" style={{ background: '#6b21a8' }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium px-4 py-2" style={{ color: 'rgba(17,24,39,0.6)' }}>Sign in</Link>
                <Link to="/register" className="text-sm font-semibold text-white px-4 py-2 rounded-lg" style={{ background: '#6b21a8', boxShadow: '0 1px 8px rgba(107,33,168,0.25)' }}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 1000, height: 700, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(107,33,168,0.09) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', bottom: 0, right: -80, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,250,222,0.8) 0%, transparent 70%)' }} />
          {/* Subtle dot grid */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#a087b0" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border" style={{ background: '#f5f0ff', borderColor: 'rgba(107,33,168,0.2)' }}>
            <Sparkles size={12} style={{ color: '#6b21a8' }} />
            <span className="text-xs font-semibold" style={{ color: '#6b21a8' }}>AI-powered academic and career platform</span>
          </div>

          <h1 className="font-bold tracking-tight leading-tight mb-6" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2.75rem, 7vw, 4.5rem)', color: '#111827', lineHeight: 1.1 }}>
            Everything you need to{' '}
            <span style={{ color: '#6b21a8' }}>succeed,</span>
            <br />
            in one place.
          </h1>

          <p className="text-xl leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: '#6B7280' }}>
            Continuum is your all-in-one platform for notes, flashcards, tasks, job
            applications, and more, powered by AI and built for students.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-3.5 rounded-xl transition-all"
              style={{ background: '#6b21a8', boxShadow: '0 4px 24px rgba(107,33,168,0.35)', fontSize: '0.95rem' }}
            >
              Start for free <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-3.5 rounded-xl border transition-all"
              style={{ background: 'white', borderColor: '#e5e7eb', color: '#374151', fontSize: '0.95rem' }}
            >
              Sign in to your account
            </Link>
          </div>

        </div>
      </section>

      {/* App preview mockup */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#a087b0', letterSpacing: '0.15em' }}>The platform</p>
          <h2 className="font-bold" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#111827' }}>See it in action</h2>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid #ede9fe', boxShadow: '0 12px 60px rgba(107,33,168,0.12), 0 2px 12px rgba(0,0,0,0.05)' }}
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
          <div className="flex" style={{ background: '#F9FAFB', height: 400 }}>
            {/* Sidebar */}
            <div className="flex-shrink-0 flex flex-col" style={{ width: 200, background: 'white', borderRight: '1px solid #E5E7EB', padding: 16 }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6b21a8, #a087b0)' }} />
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#111827', letterSpacing: '0.3px' }}>Continuum</span>
              </div>

              <div className="mb-5">
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', marginBottom: 6, paddingLeft: 6 }}>Workspace</div>
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
                      padding: '6px 8px', borderRadius: 5, marginBottom: 1,
                      fontSize: 12,
                      background: active ? 'rgba(107,33,168,0.08)' : 'transparent',
                      color: active ? '#6b21a8' : '#4B5563',
                      fontWeight: active ? 600 : 400,
                      borderLeft: active ? '2px solid #6b21a8' : '2px solid transparent',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', marginBottom: 6, paddingLeft: 6 }}>Career</div>
                {['Applications', 'Resumes'].map(label => (
                  <div key={label} style={{ padding: '6px 8px', borderRadius: 5, fontSize: 12, color: '#4B5563', marginBottom: 1 }}>{label}</div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF', marginBottom: 6, paddingLeft: 6 }}>Social</div>
                {['Messages', 'Friends'].map(label => (
                  <div key={label} style={{ padding: '6px 8px', borderRadius: 5, fontSize: 12, color: '#4B5563', marginBottom: 1 }}>{label}</div>
                ))}
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid #E5E7EB' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #a087b0, #6b21a8)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>Alex Chen</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>Student</div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden" style={{ padding: '24px 28px' }}>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 400, color: '#111827', marginBottom: 2 }}>
                    {getGreeting()}, Alex.
                  </h2>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>You have 3 assignments due tomorrow.</p>
                </div>
                <div className="flex gap-2">
                  <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 5, padding: '5px 10px', fontSize: 11, color: '#374151' }}>+ New Note</div>
                  <div style={{ background: '#6b21a8', borderRadius: 5, padding: '5px 10px', fontSize: 11, color: 'white' }}>+ Add Task</div>
                </div>
              </div>

              <div className="grid gap-5" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <div className="flex flex-col gap-5">
                  <div>
                    <div className="flex items-center justify-between mb-3" style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF' }}>Recent Notes</span>
                      <span style={{ fontSize: 10, color: '#6b21a8', fontWeight: 600 }}>View all</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: 'AI', title: 'Macroeconomics Ch.4', meta: 'Summary generated · 2h ago', accent: true },
                        { icon: '✎', title: 'CS101 Algorithms', meta: 'Edited yesterday', accent: false },
                      ].map(n => (
                        <div key={n.title} style={{ background: n.accent ? 'rgba(107,33,168,0.05)' : 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 100 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#6b21a8', marginBottom: 4 }}>{n.icon}</div>
                            <div style={{ fontSize: 11, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{n.title}</div>
                            <div style={{ fontSize: 10, color: '#6B7280' }}>{n.meta}</div>
                          </div>
                          <div style={{ height: 2, width: 28, background: n.accent ? '#6b21a8' : '#E5E7EB', borderRadius: 1 }} />
                        </div>
                      ))}
                      <div style={{ border: '1px dashed #D1D5DB', borderRadius: 8, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 18 }}>+</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF' }}>Priority Tasks</span>
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

                <div className="flex flex-col gap-5">
                  <div>
                    <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF' }}>Activity Feed</span>
                    </div>
                    {[
                      { who: 'Sarah', text: ' shared "Calc II Midterm Prep" with you.', time: '10 min ago', active: true },
                      { who: 'System', text: ' imported 3 docs from Google Drive.', time: '1h ago', active: false },
                      { who: 'You', text: ' completed "Read Chapter 5".', time: '4h ago', active: false },
                    ].map((a, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0' }}>
                        <div style={{ width: 9, height: 9, borderRadius: '50%', border: `2px solid ${a.active ? '#6b21a8' : '#D1D5DB'}`, background: a.active ? '#6b21a8' : 'white', marginTop: 3, flexShrink: 0 }} />
                        <div style={{ fontSize: 11, color: '#6B7280' }}>
                          <strong style={{ color: '#111827', fontWeight: 600 }}>{a.who}</strong>{a.text}
                          <span style={{ display: 'block', fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>{a.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF' }}>Applications</span>
                    </div>
                    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: '4px 12px' }}>
                      {[
                        { co: 'L', title: 'Product Intern', company: 'Linear', status: 'Interview', statusStyle: { borderColor: '#6b21a8', color: '#6b21a8', background: 'rgba(107,33,168,0.08)' } },
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
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#a087b0', letterSpacing: '0.15em' }}>Features</p>
          <h2 className="font-bold mb-4" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#111827' }}>
            Built for how you actually work
          </h2>
          <p className="max-w-lg mx-auto" style={{ color: '#6B7280', lineHeight: 1.7 }}>
            Every feature connects your academic life to your career goals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 border"
              style={{ background: 'white', borderColor: '#ede9fe', boxShadow: '0 1px 6px rgba(107,33,168,0.05)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(107,33,168,0.08)' }}>
                <f.icon size={18} style={{ color: '#6b21a8' }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: '#111827', fontSize: 15 }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI callout */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rounded-2xl px-8 py-14 flex flex-col md:flex-row items-center gap-10" style={{ background: 'linear-gradient(135deg, #6b21a8 0%, #4c1671 100%)', boxShadow: '0 8px 40px rgba(107,33,168,0.35)' }}>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <Sparkles size={13} style={{ color: 'rgba(255,255,255,0.8)' }} />
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>AI-powered</span>
            </div>
            <h2 className="font-bold mb-3" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', color: 'white' }}>
              Let AI do the heavy lifting
            </h2>
            <p className="leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Summarize notes instantly, generate flashcard sets from any content, and get resume
              feedback tailored to the specific roles you are applying for.
            </p>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            {aiCapabilities.map(item => (
              <div key={item.label} className="rounded-xl px-5 py-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <item.icon size={16} style={{ color: 'rgba(255,255,255,0.8)' }} />
                <span className="text-sm font-medium" style={{ color: 'white' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              description: 'Control who sees your activity. Keep it private or share with friends.',
            },
          ].map(f => (
            <div key={f.title} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(107,33,168,0.08)' }}>
                <f.icon size={17} style={{ color: '#6b21a8' }} />
              </div>
              <div>
                <h3 className="font-semibold mb-1.5" style={{ color: '#111827' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="text-center rounded-2xl border px-8 py-20" style={{ background: '#f5f0ff', borderColor: '#ede9fe' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#a087b0', letterSpacing: '0.15em' }}>Get started today</p>
          <h2 className="font-bold mb-4" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#111827' }}>
            Ready to get started?
          </h2>
          <p className="mb-10 max-w-md mx-auto" style={{ color: '#6B7280', lineHeight: 1.7 }}>
            Join Continuum and keep everything that matters, your notes, your goals, your
            career, in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl"
              style={{ background: '#6b21a8', boxShadow: '0 4px 20px rgba(107,33,168,0.3)', fontSize: '0.95rem' }}
            >
              Create your account <ArrowRight size={15} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-xl border"
              style={{ background: 'white', borderColor: '#d1d5db', color: '#374151', fontSize: '0.95rem' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E5E7EB' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: '#6b21a8' }}>
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: '#111827' }}>Continuum</span>
          </div>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            Your academic and career companion.
          </p>
        </div>
      </footer>
    </div>
  );
}
