import { Link } from 'react-router-dom';
import {
  FileText, BookOpen, CheckSquare, Briefcase, MessageCircle,
  Sparkles, ArrowRight, Brain, Target, Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const sections = [
  {
    icon: FileText,
    title: 'Smart Notes',
    tag: 'Workspace',
    description:
      'Write rich-text notes organized by type and tag. Import directly from Google Drive, then let AI generate an instant summary. Your knowledge, structured and searchable.',
    bullets: [
      'Rich text editor with full formatting',
      'Tag and type-based organization',
      'AI-powered summaries saved to the note',
      'Google Drive import integration',
      'Share notes with friends or keep them private',
    ],
    mockup: (
      <div style={{ width: '100%', maxWidth: 460, background: 'white', borderRadius: 16, border: '1px solid #ede9fe', overflow: 'hidden', boxShadow: '0 8px 40px rgba(107,33,168,0.1)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f0ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: '#6b21a8' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Macroeconomics Ch.4</span>
          </div>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: 'rgba(107,33,168,0.1)', color: '#6b21a8', fontWeight: 600 }}>Lecture</span>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 18 }}>
            GDP is the total monetary value of all finished goods and services produced within a country's borders in a specific time period. Key components include consumer spending, investment, government expenditure...
          </div>
          <div style={{ background: 'rgba(107,33,168,0.04)', border: '1px solid rgba(107,33,168,0.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>AI</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b21a8' }}>AI Summary</span>
              <span style={{ fontSize: 10, color: '#a087b0', marginLeft: 'auto' }}>Generated just now</span>
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>GDP measures economic output via C + I + G + NX. Growth above 2% signals expansion. Key terms: inflation, fiscal policy, monetary policy, trade deficit.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['#economics', '#macro', '#exam-prep', '#ch4'].map(tag => (
              <span key={tag} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: '#f3f4f6', color: '#6B7280' }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: BookOpen,
    title: 'Flashcard Study',
    tag: 'Workspace',
    description:
      'Turn any note into a study-ready flashcard set. Use the flip-card interface, track your progress, or let AI generate a full set from your note content in seconds.',
    bullets: [
      'Create sets manually or with AI generation',
      'Flip-card study interface',
      'Progress tracking per card',
      'Share sets with the community',
      'Study streaks and session history',
    ],
    mockup: (
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #ede9fe', padding: '28px 32px', boxShadow: '0 8px 40px rgba(107,33,168,0.1)', marginBottom: 14, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Economics Set</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Card 3 of 14</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 24, lineHeight: 1.4 }}>What is opportunity cost?</div>
          <div style={{ height: 1, background: 'rgba(107,33,168,0.15)', marginBottom: 20 }} />
          <div style={{ fontSize: 14, color: '#6b21a8', fontStyle: 'italic', lineHeight: 1.6 }}>The value of the next best alternative forgone when a decision is made between two or more options.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #FCA5A5', background: '#FEF2F2', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}>Again</div>
          <div style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #6EE7B7', background: '#ECFDF5', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#059669', cursor: 'pointer' }}>Got it</div>
        </div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{ width: 22, height: 5, borderRadius: 3, background: i < 3 ? '#6b21a8' : i < 6 ? '#a087b0' : '#e5e7eb', transition: 'background 0.2s' }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    tag: 'Workspace',
    description:
      'A visual kanban board for everything on your plate. Create tasks, set due dates, assign priorities, and share with collaborators. The calendar view keeps deadlines front and center.',
    bullets: [
      'Kanban columns: To Do, In Progress, Completed',
      'Due dates and priority levels',
      'Shared tasks with collaborators',
      'Integrated calendar with overdue alerts',
      'Month and week view',
    ],
    mockup: (
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', gap: 10 }}>
        {[
          {
            label: 'To Do', color: '#6b21a8', bg: 'rgba(107,33,168,0.06)',
            tasks: [
              { title: 'Submit Essay Draft', due: 'Tomorrow', urgent: true },
              { title: 'Read Chapter 7', due: 'Wed, Oct 25', urgent: false },
              { title: 'Email Professor Kim', due: 'This week', urgent: false },
            ],
          },
          {
            label: 'In Progress', color: '#0891B2', bg: 'rgba(8,145,178,0.06)',
            tasks: [
              { title: 'Group Project Slides', due: 'Fri, Oct 27', urgent: false },
              { title: 'Biology Lab Report', due: 'Thu, Oct 26', urgent: true },
            ],
          },
          {
            label: 'Done', color: '#059669', bg: 'rgba(5,150,105,0.06)',
            tasks: [
              { title: 'Midterm Review', due: 'Completed', urgent: false },
              { title: 'Read Syllabus', due: 'Completed', urgent: false },
            ],
          },
        ].map(col => (
          <div key={col.label} style={{ flex: 1, background: col.bg, borderRadius: 12, padding: '12px 10px', border: `1px solid ${col.color}22` }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: col.color, marginBottom: 10, paddingLeft: 2 }}>{col.label}</div>
            {col.tasks.map(t => (
              <div key={t.title} style={{ background: 'white', borderRadius: 8, padding: '9px 10px', marginBottom: 6, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 11, color: '#111827', fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 10, color: t.urgent ? '#DC2626' : '#9CA3AF' }}>{t.due}</div>
              </div>
            ))}
            <div style={{ border: '1px dashed #D1D5DB', borderRadius: 8, padding: '8px 0', fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>+ Add task</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Briefcase,
    title: 'Career Pipeline',
    tag: 'Career',
    description:
      'Track every job application from first search to offer. Move roles through your pipeline, log contacts, set reminders, and get AI coaching on how to position yourself for each role.',
    bullets: [
      'Pipeline stages: Saved, Applied, Interview, Offer',
      'Contact log per application',
      'Follow-up reminders',
      'AI coaching tailored to each role',
      'Application history and notes',
    ],
    mockup: (
      <div style={{ width: '100%', maxWidth: 460, background: 'white', borderRadius: 16, border: '1px solid #ede9fe', overflow: 'hidden', boxShadow: '0 8px 40px rgba(107,33,168,0.1)' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f0ff', display: 'flex', gap: 8, background: '#fafafa' }}>
          {[
            { label: 'Saved', active: false },
            { label: 'Applied', active: false },
            { label: 'Interview', active: true },
            { label: 'Offer', active: false },
          ].map(s => (
            <span key={s.label} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600, background: s.active ? '#6b21a8' : '#F3F4F6', color: s.active ? 'white' : '#6B7280', transition: 'all 0.2s' }}>{s.label}</span>
          ))}
        </div>
        {[
          { co: 'L', title: 'Product Intern', company: 'Linear', stage: 'Interview', badge: { bg: 'rgba(107,33,168,0.08)', color: '#6b21a8', border: '#c4b5fd' } },
          { co: 'S', title: 'SWE Intern', company: 'Stripe', stage: 'Applied', badge: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' } },
          { co: 'V', title: 'Data Analyst', company: 'Vercel', stage: 'Applied', badge: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' } },
          { co: 'N', title: 'Design Intern', company: 'Notion', stage: 'Saved', badge: { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' } },
        ].map(app => (
          <div key={app.co} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #F9FAFB', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#6B7280', flexShrink: 0 }}>{app.co}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{app.title}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{app.company}</div>
            </div>
            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, fontWeight: 600, background: app.badge.bg, color: app.badge.color, border: `1px solid ${app.badge.border}` }}>{app.stage}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: FileText,
    title: 'Resume Tracking',
    tag: 'Career',
    description:
      'Upload multiple resume versions for different roles. Get structured AI feedback with an overall score, strengths, section analysis, and keyword optimization, every time.',
    bullets: [
      'Upload and version your resumes',
      'AI feedback: score, strengths, improvements',
      'Section-by-section analysis',
      'Keyword gap detection',
      'Cloudinary-hosted secure storage',
    ],
    mockup: (
      <div style={{ width: '100%', maxWidth: 460, background: 'white', borderRadius: 16, border: '1px solid #ede9fe', padding: '24px 28px', boxShadow: '0 8px 40px rgba(107,33,168,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>SWE_Resume_v3.pdf</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>Uploaded Mar 12 · Software Engineering</div>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(107,33,168,0.06)', borderRadius: 12, padding: '10px 16px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#6b21a8', lineHeight: 1 }}>84</div>
            <div style={{ fontSize: 10, color: '#a087b0', fontWeight: 500 }}>/ 100</div>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: '#f3f0ff', marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ width: '84%', height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #6b21a8, #a087b0)', transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Experience', score: 90, color: '#059669' },
            { label: 'Education', score: 88, color: '#0891B2' },
            { label: 'Skills', score: 78, color: '#7C3AED' },
            { label: 'Keywords', score: 72, color: '#D97706' },
            { label: 'Formatting', score: 85, color: '#DB2777' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 12, color: '#6B7280', width: 80, fontWeight: 500 }}>{s.label}</div>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#f3f4f6', overflow: 'hidden' }}>
                <div style={{ width: `${s.score}%`, height: '100%', borderRadius: 3, background: s.color }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color, width: 28, textAlign: 'right' }}>{s.score}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: MessageCircle,
    title: 'Social and Messaging',
    tag: 'Social',
    description:
      'Build your academic network. Send friend requests, message connections, share notes and flashcard sets, and follow activity from people you care about.',
    bullets: [
      'Friend requests and connections',
      'Direct messaging',
      'Activity feed from your network',
      'Share notes and flashcard sets',
      'Configurable privacy controls',
    ],
    mockup: (
      <div style={{ width: '100%', maxWidth: 460, background: 'white', borderRadius: 16, border: '1px solid #ede9fe', overflow: 'hidden', boxShadow: '0 8px 40px rgba(107,33,168,0.1)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f0ff', display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #a087b0, #6b21a8)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Sarah M.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>Online</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ alignSelf: 'flex-start', background: '#F3F4F6', borderRadius: '4px 14px 14px 14px', padding: '10px 14px', maxWidth: '78%' }}>
            <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>Did you see the Calc midterm study guide I shared?</p>
          </div>
          <div style={{ alignSelf: 'flex-end', background: '#6b21a8', borderRadius: '14px 4px 14px 14px', padding: '10px 14px', maxWidth: '78%' }}>
            <p style={{ fontSize: 12, color: 'white', margin: 0, lineHeight: 1.5 }}>Yes! Just added it to my flashcards. Super helpful, thank you</p>
          </div>
          <div style={{ alignSelf: 'flex-start', background: '#F3F4F6', borderRadius: '4px 14px 14px 14px', padding: '10px 14px', maxWidth: '78%' }}>
            <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>Want to study together Thursday? Library at 3?</p>
          </div>
          <div style={{ alignSelf: 'flex-end', background: '#6b21a8', borderRadius: '14px 4px 14px 14px', padding: '10px 14px', maxWidth: '78%' }}>
            <p style={{ fontSize: 12, color: 'white', margin: 0, lineHeight: 1.5 }}>Yes, Thursday works. See you there!</p>
          </div>
        </div>
        <div style={{ padding: '10px 18px', borderTop: '1px solid #f3f0ff', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 22, padding: '8px 14px', fontSize: 12, color: '#9CA3AF' }}>Type a message...</div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
            <ArrowRight size={14} color="white" />
          </div>
        </div>
      </div>
    ),
  },
];

const aiFeatures = [
  {
    icon: Brain,
    title: 'Note Summaries',
    description: 'Get a concise summary of any note instantly. Cached so it loads on every visit without an extra AI call.',
  },
  {
    icon: Zap,
    title: 'Flashcard Generation',
    description: 'AI reads your note and generates a full flashcard set, front and back, in seconds.',
  },
  {
    icon: Target,
    title: 'Resume Feedback',
    description: 'Detailed scoring across experience, education, skills, and formatting with keyword gap analysis.',
  },
];

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
          <Link to="/product" className="text-sm font-semibold px-3 py-2 border-b-2" style={{ color: '#6b21a8', borderColor: '#6b21a8' }}>Product</Link>
          <Link to="/about" className="text-sm font-medium px-3 py-2" style={{ color: 'rgba(17,24,39,0.6)' }}>About</Link>
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

export default function Product() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fef7ff' }}>
      <NavBar user={user} />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border" style={{ background: '#f5f0ff', borderColor: 'rgba(107,33,168,0.2)' }}>
          <Sparkles size={12} style={{ color: '#6b21a8' }} />
          <span className="text-xs font-semibold" style={{ color: '#6b21a8' }}>Full feature breakdown</span>
        </div>
        <h1 className="font-bold tracking-tight leading-tight mb-5" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#111827' }}>
          Everything Continuum does
        </h1>
        <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: '#6B7280' }}>
          One platform for your academic life and career. Notes, flashcards, tasks, job
          applications, resumes, and your social network, connected and powered by AI.
        </p>
      </section>

      {/* Feature sections */}
      <section className="max-w-6xl mx-auto px-6 pb-24 space-y-32">
        {sections.map((s, i) => (
          <div
            key={s.title}
            className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-16 items-center`}
          >
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: '#a087b0', letterSpacing: '0.15em' }}>{s.tag}</span>
              <h2 className="font-bold mb-4" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#111827' }}>{s.title}</h2>
              <p className="leading-relaxed mb-8 text-base" style={{ color: '#6B7280' }}>{s.description}</p>
              <ul className="space-y-3">
                {s.bullets.map(b => (
                  <li key={b} className="flex items-start gap-3 text-sm" style={{ color: '#374151' }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#6b21a8' }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1 flex justify-center items-center">
              {s.mockup}
            </div>
          </div>
        ))}
      </section>

      {/* AI section */}
      <section style={{ background: 'linear-gradient(135deg, #6b21a8 0%, #4c1671 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <Sparkles size={12} style={{ color: 'rgba(255,255,255,0.8)' }} />
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>AI-powered</span>
            </div>
            <h2 className="font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}>AI built into every layer</h2>
            <p className="max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Not a bolt-on chatbot. AI is woven into the features you already use every day.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {aiFeatures.map(f => (
              <div key={f.title} className="rounded-2xl p-7" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <f.icon size={22} style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 14 }} />
                <h3 className="font-semibold text-white mb-2" style={{ fontSize: 15 }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#a087b0', letterSpacing: '0.15em' }}>Get started</p>
        <h2 className="font-bold mb-3" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', color: '#111827' }}>Ready to try it?</h2>
        <p className="mb-10" style={{ color: '#6B7280' }}>Create an account. It is free.</p>
        {user ? (
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl" style={{ background: '#6b21a8', boxShadow: '0 4px 20px rgba(107,33,168,0.3)' }}>
            Go to Dashboard <ArrowRight size={15} />
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 text-white font-semibold px-7 py-3.5 rounded-xl" style={{ background: '#6b21a8', boxShadow: '0 4px 20px rgba(107,33,168,0.3)' }}>
              Create your account <ArrowRight size={15} />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-xl border" style={{ background: 'white', borderColor: '#d1d5db', color: '#374151' }}>
              Sign in
            </Link>
          </div>
        )}
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
