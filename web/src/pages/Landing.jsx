import { Link } from 'react-router-dom';
import {
  FileText, BookOpen, CheckSquare, Briefcase,
  MessageCircle, Sparkles, ArrowRight,
  Calendar, Shield, Brain, Zap, Target,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import MarketingNav from '@/components/layout/MarketingNav';
import MarketingFooter from '@/components/layout/MarketingFooter';

const featureCards = [
  {
    icon: FileText,
    title: 'Smart Notes',
    description: 'Rich text notes organized by type and tag, with AI summaries and Google Drive import.',
  },
  {
    icon: BookOpen,
    title: 'Flashcard Study',
    description: 'Turn any note into a study-ready flashcard set. Track your progress card by card.',
  },
  {
    icon: CheckSquare,
    title: 'Task Manager',
    description: 'Visual kanban board with due dates, priorities, and shared tasks for collaborators.',
  },
  {
    icon: Briefcase,
    title: 'Career Pipeline',
    description: 'Track applications from Saved to Offer. Log contacts and set follow-up reminders.',
  },
  {
    icon: FileText,
    title: 'Resume Builder',
    description: 'Upload and version your resumes. Get AI feedback with scores and keyword analysis.',
  },
  {
    icon: MessageCircle,
    title: 'Social Network',
    description: 'Connect with friends, share notes and flashcard sets, and message your academic network.',
  },
  {
    icon: Calendar,
    title: 'Unified Calendar',
    description: 'See all your tasks and deadlines in a month or week view, with overdue alerts built in.',
  },
  {
    icon: Shield,
    title: 'Private by default',
    description: 'Control who sees your activity. Keep everything private or share selectively with friends.',
  },
  {
    icon: Brain,
    title: 'AI in every feature',
    description: 'Summaries, flashcard generation, and resume feedback, woven into the tools you already use.',
  },
];

const frictionStats = [
  {
    stat: '4+',
    label: 'separate tools the average student juggles every day',
  },
  {
    stat: '2h',
    label: 'lost each week switching between disconnected apps',
  },
  {
    stat: '1',
    label: 'place to do it all, and that changes everything',
  },
];

const aiCapabilities = [
  {
    icon: Brain,
    label: 'Note summaries',
    proof: 'Generated in under 3 seconds. Cached on every visit.',
  },
  {
    icon: Zap,
    label: 'Flashcard generation',
    proof: 'Up to 20 Q&A pairs extracted automatically from any note.',
  },
  {
    icon: Target,
    label: 'Resume feedback',
    proof: 'Scored across 5 dimensions with keyword gap detection.',
  },
];

const testimonials = [
  { quote: 'Finally stopped switching between 6 apps every night before an exam. Everything I need is just there.', name: 'Priya M.', role: 'Computer Science, Junior' },
  { quote: "The AI flashcard generation alone saves me an hour before every midterm. I don't know how I studied without it.", name: 'Marcus T.', role: 'Biology, Sophomore' },
  { quote: 'Tracking internship applications in a spreadsheet was chaos. The pipeline view is exactly what I needed.', name: 'Jordan K.', role: 'Business, Senior' },
  { quote: 'Imported my entire Google Drive in one click. The AI summaries actually capture what matters.', name: 'Aisha R.', role: 'Political Science, Junior' },
  { quote: 'Shared a study guide with my whole group in seconds. No more sending files over text.', name: 'Devon C.', role: 'Engineering, Sophomore' },
  { quote: 'Got AI feedback on my resume before every application. My callback rate went up noticeably.', name: 'Simone W.', role: 'Finance, Senior' },
  { quote: 'The calendar finally shows my tasks and deadlines together. I stopped missing things the week before finals.', name: 'Tyler B.', role: 'Psychology, Junior' },
  { quote: 'Everything from notes to job applications in one tab. It actually reduces my stress.', name: 'Nadia F.', role: 'Neuroscience, Sophomore' },
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
    <div className="font-marketing min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <MarketingNav active="landing" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)', width: 1000, height: 700, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(107,33,168,0.08) 0%, transparent 65%)' }} />
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#a087b0" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-16 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border"
            style={{ background: '#F3F0FF', borderColor: 'rgba(107,33,168,0.2)' }}
          >
            <Sparkles size={12} style={{ color: '#6B21A8' }} />
            <span className="text-xs font-semibold" style={{ color: '#6B21A8' }}>
              AI-powered student workspace
            </span>
          </div>

          <h1
            className="font-bold tracking-tight leading-tight"
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontStyle: 'normal',
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              color: '#111827',
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Stop switching between 8 apps. Start using one.
          </h1>

          <p
            className="text-lg leading-relaxed max-w-xl mx-auto"
            style={{ color: '#6B7280', fontSize: '1.125rem', marginBottom: 32 }}
          >
            From lecture notes to job offer, Continuum connects the whole journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 text-white font-semibold px-8 py-3.5 transition-all"
              style={{ background: '#6B21A8', fontSize: '0.9375rem', borderRadius: 8 }}
            >
              Start for free, no credit card needed <ArrowRight size={16} />
            </Link>
            <Link
              to="/product"
              className="inline-flex items-center justify-center gap-2 font-semibold px-8 py-3.5 border transition-all"
              style={{ background: 'white', borderColor: '#6B21A8', color: '#6B21A8', fontSize: '0.9375rem', borderRadius: 8 }}
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* App preview mockup */}
      <section className="max-w-6xl mx-auto px-6 pt-4 pb-20">
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid #E5E7EB', boxShadow: '0 20px 60px rgba(107,33,168,0.12)', borderRadius: 12 }}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ background: '#f9fafb', borderColor: '#E5E7EB' }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 mx-3">
              <div
                className="rounded px-3 py-0.5 text-xs text-center max-w-xs mx-auto"
                style={{ background: 'white', color: '#9CA3AF', border: '1px solid #E5E7EB' }}
              >
                usecontinuum.dev
              </div>
            </div>
          </div>

          {/* App shell */}
          <div className="flex" style={{ background: '#f9fafb', height: 400 }}>
            {/* Sidebar */}
            <div className="flex-shrink-0 flex flex-col" style={{ width: 200, background: 'white', borderRight: '1px solid #E5E7EB', padding: 16 }}>
              <div className="mb-6">
                <img src="/wordmark.svg" alt="Continuum" style={{ height: 18 }} />
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
                      color: active ? '#6B21A8' : '#4B5563',
                      fontWeight: active ? 600 : 400,
                      borderLeft: active ? '2px solid #6B21A8' : '2px solid transparent',
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
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #a087b0, #6B21A8)', flexShrink: 0 }} />
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
                  <h2 style={{ fontFamily: 'inherit', fontSize: 20, fontWeight: 400, color: '#111827', marginBottom: 2 }}>
                    {getGreeting()}, Alex.
                  </h2>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>You have 3 assignments due tomorrow.</p>
                </div>
                <div className="flex gap-2">
                  <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 5, padding: '5px 10px', fontSize: 11, color: '#374151' }}>+ New Note</div>
                  <div style={{ background: '#6B21A8', borderRadius: 5, padding: '5px 10px', fontSize: 11, color: 'white' }}>+ Add Task</div>
                </div>
              </div>

              <div className="grid gap-5" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <div className="flex flex-col gap-5">
                  <div>
                    <div className="flex items-center justify-between mb-3" style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9CA3AF' }}>Recent Notes</span>
                      <span style={{ fontSize: 10, color: '#6B21A8', fontWeight: 600 }}>View all</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: 'AI', title: 'Macroeconomics Ch.4', meta: 'Summary generated · 2h ago', accent: true },
                        { icon: '', title: 'CS101 Algorithms', meta: 'Edited yesterday', accent: false },
                      ].map(n => (
                        <div key={n.title} style={{ background: n.accent ? 'rgba(107,33,168,0.05)' : 'white', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 100 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#6B21A8', marginBottom: 4 }}>{n.icon}</div>
                            <div style={{ fontSize: 11, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{n.title}</div>
                            <div style={{ fontSize: 10, color: '#6B7280' }}>{n.meta}</div>
                          </div>
                          <div style={{ height: 2, width: 28, background: n.accent ? '#6B21A8' : '#E5E7EB', borderRadius: 1 }} />
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
                        { title: 'Submit History Essay Draft', due: 'Due Tomorrow', tag: 'Urgent', tagStyle: { background: '#fee2e2', color: '#DC2626' } },
                        { title: 'Review Flashcards: Biology', due: 'Scheduled for Today', tag: 'Study', tagStyle: { background: '#F3F0FF', color: '#6B21A8' } },
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
                        <div style={{ width: 9, height: 9, borderRadius: '50%', border: `2px solid ${a.active ? '#6B21A8' : '#D1D5DB'}`, background: a.active ? '#6B21A8' : 'white', marginTop: 3, flexShrink: 0 }} />
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
                        { co: 'L', title: 'Product Intern', company: 'Linear', status: 'Interview', statusStyle: { borderColor: '#6B21A8', color: 'white', background: '#6B21A8' } },
                        { co: 'N', title: 'Design Intern', company: 'Notion', status: 'Applied', statusStyle: { borderColor: '#6B21A8', color: '#6B21A8', background: '#F3F0FF' } },
                      ].map(app => (
                        <div key={app.co} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                          <div style={{ width: 26, height: 26, background: '#F3F0FF', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6B21A8', marginRight: 10, flexShrink: 0 }}>{app.co}</div>
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

      {/* Stats — The Problem Continuum Solves */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: '#6B21A8', letterSpacing: '0.1em', marginBottom: 0 }}
          >
            THE PROBLEM CONTINUUM SOLVES
          </p>
        </div>
        <div
          className="rounded-2xl"
          style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: 48 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3">
            {frictionStats.map((item, i) => (
              <div
                key={item.stat}
                className="text-center"
                style={{
                  borderRight: i < 2 ? '1px solid #E5E7EB' : 'none',
                  padding: '0 32px',
                }}
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

      {/* Feature Cards — Nine tools, one platform */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#6B21A8', letterSpacing: '0.1em' }}
          >
            EVERYTHING YOU NEED
          </p>
          <h2
            className="font-bold mb-4"
            style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'normal', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#111827' }}
          >
            Six tools. One platform.
          </h2>
          <p className="max-w-lg mx-auto text-base" style={{ color: '#6B7280', lineHeight: 1.625 }}>
            Every feature connects your academic work to your career goals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((f) => (
            <div
              key={f.title}
              className="rounded-xl p-7 transition-all duration-200"
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(107,33,168,0.10)';
                e.currentTarget.style.borderColor = '#6B21A8';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            >
              <div
                style={{
                  width: 40, height: 40,
                  borderRadius: 10,
                  background: '#F3F0FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <f.icon size={20} style={{ color: '#6B21A8' }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: '#111827', fontSize: '1.125rem' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280', lineHeight: 1.625 }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* AI callout */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div
          className="rounded-2xl px-8 py-14 flex flex-col md:flex-row items-center gap-10"
          style={{ background: 'linear-gradient(135deg, #3B0764 0%, #6B21A8 100%)' }}
        >
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)' }}
            >
              <Sparkles size={13} style={{ color: 'rgba(255,255,255,0.8)' }} />
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>AI-powered</span>
            </div>
            <h2
              className="font-bold mb-3"
              style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'normal', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', color: 'white' }}
            >
              Let AI do the heavy lifting
            </h2>
            <p className="leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Summarize notes instantly, generate flashcard sets from any content, and get resume
              feedback tailored to the specific roles you are applying for.
            </p>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0" style={{ minWidth: 260 }}>
            {aiCapabilities.map(item => (
              <div
                key={item.label}
                className="rounded-xl flex items-flex-start gap-3"
                style={{
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.20)',
                  borderRadius: 10,
                  padding: '16px 20px',
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                }}
              >
                <item.icon size={18} style={{ color: 'white', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="font-semibold" style={{ color: 'white', fontSize: '0.9375rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{item.proof}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof — Infinite Marquee */}
      <section className="pb-24">
        <style>{`
          @keyframes marquee-left {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          @keyframes marquee-right {
            from { transform: translateX(-50%); }
            to { transform: translateX(0); }
          }
          .marquee-wrapper:hover .marquee-track {
            animation-play-state: paused;
          }
        `}</style>

        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#6B21A8', letterSpacing: '0.1em' }}
            >
              WHAT STUDENTS ARE SAYING
            </p>
            <h2
              className="font-bold"
              style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'normal', fontSize: '2rem', color: '#111827' }}
            >
              Built for how students actually work
            </h2>
          </div>
        </div>

        <div
          style={{
            overflow: 'hidden',
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Row 1 — scrolls left */}
          <div className="marquee-wrapper">
            <div
              className="marquee-track"
              style={{ display: 'flex', gap: 20, width: 'max-content', animation: 'marquee-left 40s linear infinite' }}
            >
              {[...testimonials, ...testimonials].map((t, i) => (
                <div
                  key={i}
                  style={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: '20px 24px',
                    minWidth: 300,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ marginBottom: 10, fontSize: '0.8125rem', color: '#6B21A8' }}>★★★★★</div>
                  <p style={{ fontSize: '0.875rem', color: '#111827', lineHeight: 1.625, marginBottom: 14 }}>
                    "{t.quote}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F3F0FF', color: '#6B21A8', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 — scrolls right */}
          <div className="marquee-wrapper">
            <div
              className="marquee-track"
              style={{ display: 'flex', gap: 20, width: 'max-content', animation: 'marquee-right 35s linear infinite' }}
            >
              {[...testimonials, ...testimonials].map((t, i) => (
                <div
                  key={i}
                  style={{
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: '20px 24px',
                    minWidth: 300,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ marginBottom: 10, fontSize: '0.8125rem', color: '#6B21A8' }}>★★★★★</div>
                  <p style={{ fontSize: '0.875rem', color: '#111827', lineHeight: 1.625, marginBottom: 14 }}>
                    "{t.quote}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F3F0FF', color: '#6B21A8', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111827' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            Join Continuum and keep everything that matters in one place.
          </p>
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-3 rounded-lg transition-all"
              style={{ background: 'white', color: '#6B21A8', fontSize: '0.9375rem', borderRadius: 8 }}
            >
              Go to Dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-3 rounded-lg transition-all"
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
