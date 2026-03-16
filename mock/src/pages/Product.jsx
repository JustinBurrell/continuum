import { Link } from 'react-router-dom';
import {
  FileText, BookOpen, CheckSquare, Briefcase, MessageCircle,
  Sparkles, Calendar, CloudUpload, Shield, Users, ArrowRight,
  Brain, Target, Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const sections = [
  {
    icon: FileText,
    title: 'Smart Notes',
    tag: 'Workspace',
    description:
      'Write rich-text notes organized by type and tag. Import directly from Google Drive, then let AI generate an instant summary. Your knowledge — structured and searchable.',
    bullets: [
      'Rich text editor with full formatting',
      'Tag and type-based organization',
      'AI-powered summaries saved to the note',
      'Google Drive import integration',
      'Share notes with friends or keep them private',
    ],
  },
  {
    icon: BookOpen,
    title: 'Flashcard Study',
    tag: 'Workspace',
    description:
      'Turn any note into a study-ready flashcard set. Use the flip-card study interface, track your progress, or let AI generate a full set from your note content in seconds.',
    bullets: [
      'Create sets manually or with AI generation',
      'Flip-card study interface',
      'Progress tracking per card',
      'Share sets with the community',
      'Study streaks and session history',
    ],
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
  },
  {
    icon: Briefcase,
    title: 'Career Pipeline',
    tag: 'Career',
    description:
      'Track every job application from first search to offer. Move roles through your pipeline, log contacts, set reminders, and get AI coaching on how to position yourself for each specific role.',
    bullets: [
      'Pipeline stages: Saved → Applied → Interview → Offer',
      'Contact log per application',
      'Follow-up reminders',
      'AI coaching tailored to each role',
      'Application history and notes',
    ],
  },
  {
    icon: FileText,
    title: 'Resume Tracking',
    tag: 'Career',
    description:
      'Upload multiple resume versions for different roles. Get structured AI feedback — an overall score, strengths, improvements by section, and keyword optimization — every time.',
    bullets: [
      'Upload and version your resumes',
      'AI feedback: score, strengths, improvements',
      'Section-by-section analysis',
      'Keyword gap detection',
      'Cloudinary-hosted secure storage',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Social & Messaging',
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
  },
];

const aiFeatures = [
  { icon: Brain, title: 'Note Summaries', description: 'Get a quick summary of any note instantly. Cached so it loads on every visit.' },
  { icon: Zap, title: 'Flashcard Generation', description: 'AI reads your note and generates a full flashcard set — front and back — in seconds.' },
  { icon: Target, title: 'Resume Feedback', description: 'Detailed scoring across experience, education, skills, and formatting. Keyword gap analysis for each job type.' },
  { icon: Briefcase, title: 'Application Coaching', description: 'AI explains how to position yourself for each specific role based on your background.' },
];

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
          <Link to="/product" className="text-sm font-medium text-primary border-b-2 border-primary px-3 py-2">Product</Link>
          <Link to="/about" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors px-3 py-2">About</Link>
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

export default function Product() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <NavBar user={user} />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-accent border border-primary/20 rounded-full px-4 py-1.5 mb-6">
          <Sparkles size={13} className="text-primary" />
          <span className="text-xs font-medium text-primary">Full feature breakdown</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight mb-5">
          Everything Continuum does
        </h1>
        <p className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed">
          One platform for your academic life and career. Notes, flashcards, tasks, job
          applications, resumes, and your social network — connected and powered by AI.
        </p>
      </section>

      {/* Feature sections */}
      <section className="max-w-6xl mx-auto px-6 pb-20 space-y-16">
        {sections.map((s, i) => (
          <div
            key={s.title}
            className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}
          >
            <div className="flex-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 block">{s.tag}</span>
              <h2 className="text-2xl font-bold text-foreground mb-4">{s.title}</h2>
              <p className="text-secondary leading-relaxed mb-6">{s.description}</p>
              <ul className="space-y-2">
                {s.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-64 h-48 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center">
                <s.icon size={64} className="text-primary/20" />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* AI section */}
      <section className="bg-primary">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">AI built into every layer</h2>
            <p className="text-white/70 max-w-xl mx-auto">
              Not a bolt-on chatbot. AI is woven into the features you already use every day.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiFeatures.map(f => (
              <div key={f.title} className="bg-white/10 rounded-2xl p-6">
                <f.icon size={22} className="text-white mb-3" />
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/70 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3">Ready to try it?</h2>
        <p className="text-secondary mb-8">Create an account — it's free.</p>
        {user ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-hover transition-colors"
          >
            Go to Dashboard <ArrowRight size={16} />
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-hover transition-colors"
            >
              Create your account <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 border border-border bg-white text-foreground font-semibold px-6 py-3 rounded-xl hover:bg-accent transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}
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
