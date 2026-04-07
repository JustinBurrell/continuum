import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  FileText, BookOpen, CheckSquare, Briefcase, MessageCircle,
  Sparkles, ArrowRight, Brain, Target, Zap, Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import MarketingNav from '@/components/layout/MarketingNav';
import MarketingFooter from '@/components/layout/MarketingFooter';

const tabs = [
  { label: 'Notes', id: 'notes' },
  { label: 'Flashcards', id: 'flashcards' },
  { label: 'Tasks', id: 'tasks' },
  { label: 'Career Pipeline', id: 'career' },
  { label: 'Resume', id: 'resume' },
  { label: 'Messaging', id: 'social' },
];

const sections = [
  {
    id: 'notes',
    icon: FileText,
    title: 'Smart Notes',
    tag: 'WORKSPACE',
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
      <div style={{ width: '100%', maxWidth: 560, background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: '#6B21A8' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Macroeconomics Ch.4</span>
          </div>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: '#F3F0FF', color: '#6B21A8', fontWeight: 600 }}>Lecture</span>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, marginBottom: 18 }}>
            GDP is the total monetary value of all finished goods and services produced within a country's borders in a specific time period. Key components include consumer spending, investment, government expenditure...
          </div>
          <div style={{ background: 'rgba(107,33,168,0.04)', border: '1px solid rgba(107,33,168,0.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: '#6B21A8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>AI</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6B21A8' }}>AI Summary</span>
              <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 'auto' }}>Generated just now</span>
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>GDP measures economic output via C + I + G + NX. Growth above 2% signals expansion. Key terms: inflation, fiscal policy, monetary policy, trade deficit.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['#economics', '#macro', '#exam-prep', '#ch4'].map(tag => (
              <span key={tag} style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 999, background: '#F3F0FF', color: '#6B21A8' }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'flashcards',
    icon: BookOpen,
    title: 'Flashcard Study',
    tag: 'WORKSPACE',
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
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '28px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', marginBottom: 14, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 }}>Economics Set</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Card 3 of 14</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 24, lineHeight: 1.4 }}>What is opportunity cost?</div>
          <div style={{ height: 1, background: 'rgba(107,33,168,0.15)', marginBottom: 20 }} />
          <div style={{ fontSize: 14, color: '#6B21A8', lineHeight: 1.6 }}>The value of the next best alternative forgone when a decision is made between two or more options.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Again</div>
          <div style={{ flex: 1, padding: '10px 0', borderRadius: 8, background: '#6B21A8', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'white' }}>Got it</div>
        </div>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{ width: 22, height: 5, borderRadius: 3, background: i < 3 ? '#6B21A8' : '#E5E7EB' }} />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    title: 'Task Management',
    tag: 'WORKSPACE',
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
            label: 'TO DO',
            headerColor: '#6B21A8',
            headerBg: '#F3F0FF',
            tasks: [
              { title: 'Submit Essay Draft', due: 'Tomorrow', overdue: false },
              { title: 'Read Chapter 7', due: 'Wed, Oct 25', overdue: false },
              { title: 'Email Professor Kim', due: 'Thu, Oct 26', overdue: true },
            ],
          },
          {
            label: 'IN PROGRESS',
            headerColor: '#D97706',
            headerBg: '#FFFBEB',
            tasks: [
              { title: 'Group Project Slides', due: 'Fri, Oct 27', overdue: false },
              { title: 'Biology Lab Report', due: 'Thu, Oct 26', overdue: true },
            ],
          },
          {
            label: 'DONE',
            headerColor: '#059669',
            headerBg: '#ECFDF5',
            tasks: [
              { title: 'Midterm Review', due: 'Completed', overdue: false },
              { title: 'Read Syllabus', due: 'Completed', overdue: false },
            ],
          },
        ].map(col => (
          <div key={col.label} style={{ flex: 1, background: '#F9FAFB', borderRadius: 12, padding: '12px 10px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: col.headerColor, background: col.headerBg, borderRadius: 4, padding: '3px 6px', marginBottom: 10, display: 'inline-block' }}>{col.label}</div>
            {col.tasks.map(t => (
              <div key={t.title} style={{ background: 'white', borderRadius: 8, padding: 12, marginBottom: 6, border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: 11, color: '#111827', fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>{t.title}</div>
                <div style={{ fontSize: 10, color: t.overdue ? '#DC2626' : '#9CA3AF' }}>{t.due}</div>
              </div>
            ))}
            <div style={{ border: '1px dashed #E5E7EB', borderRadius: 8, padding: '8px 0', fontSize: 11, color: '#9CA3AF', textAlign: 'center' }}>+ Add task</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'career',
    icon: Briefcase,
    title: 'Career Pipeline',
    tag: 'CAREER',
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
      <div style={{ width: '100%', maxWidth: 460, background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 8, background: '#fafafa' }}>
          {[
            { label: 'Saved', active: false },
            { label: 'Applied', active: false },
            { label: 'Interview', active: true },
            { label: 'Offer', active: false },
          ].map(s => (
            <span key={s.label} style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600, background: s.active ? '#6B21A8' : '#F3F4F6', color: s.active ? 'white' : '#6B7280' }}>{s.label}</span>
          ))}
        </div>
        {[
          { co: 'L', title: 'Product Intern', company: 'Linear', stage: 'Interview', badgeStyle: { background: '#6B21A8', color: 'white', border: 'none' } },
          { co: 'S', title: 'SWE Intern', company: 'Stripe', stage: 'Applied', badgeStyle: { background: '#F3F0FF', color: '#6B21A8', border: '1px solid #6B21A8' } },
          { co: 'V', title: 'Data Analyst', company: 'Vercel', stage: 'Applied', badgeStyle: { background: '#F3F0FF', color: '#6B21A8', border: '1px solid #6B21A8' } },
          { co: 'N', title: 'Design Intern', company: 'Notion', stage: 'Saved', badgeStyle: { background: '#F3F4F6', color: '#6B7280', border: 'none' } },
        ].map(app => (
          <div key={app.co} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #F9FAFB', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#6B21A8', flexShrink: 0 }}>{app.co}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{app.title}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{app.company}</div>
            </div>
            <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: 999, fontWeight: 600, ...app.badgeStyle }}>{app.stage}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'resume',
    icon: FileText,
    title: 'Resume Tracking',
    tag: 'CAREER',
    description:
      'Upload multiple resume versions for different roles. Get structured AI feedback with an overall score, strengths, section analysis, and keyword optimization every time.',
    bullets: [
      'Upload and version your resumes',
      'AI feedback: score, strengths, improvements',
      'Section-by-section analysis',
      'Keyword gap detection',
      'Cloudinary-hosted secure storage',
    ],
    mockup: (
      <div style={{ width: '100%', maxWidth: 460, background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '24px 28px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>SWE_Resume_v3.pdf</div>
            <div style={{ fontSize: 12, color: '#9CA3AF' }}>Uploaded Mar 12 · Software Engineering</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#6B21A8', lineHeight: 1 }}>84</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>/ 100</div>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: '#F3F0FF', marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ width: '84%', height: '100%', borderRadius: 4, background: '#6B21A8' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Experience', score: 90 },
            { label: 'Education', score: 88 },
            { label: 'Skills', score: 78 },
            { label: 'Keywords', score: 72 },
            { label: 'Formatting', score: 85 },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '0.875rem', color: '#374151', width: 80, fontWeight: 500 }}>{s.label}</div>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
                <div style={{ width: `${s.score}%`, height: '100%', borderRadius: 3, background: '#6B21A8' }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6B21A8', width: 28, textAlign: 'right' }}>{s.score}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'social',
    icon: MessageCircle,
    title: 'Social and Messaging',
    tag: 'SOCIAL',
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
      <div style={{ width: '100%', maxWidth: 460, background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #a087b0, #6B21A8)' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: '#059669', border: '1.5px solid white' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Sarah M.</div>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>Online</div>
          </div>
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ alignSelf: 'flex-start', background: '#F3F4F6', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', maxWidth: '78%' }}>
            <p style={{ fontSize: 12, color: '#111827', margin: 0, lineHeight: 1.5 }}>Did you see the Calc midterm study guide I shared?</p>
          </div>
          <div style={{ alignSelf: 'flex-end', background: '#6B21A8', borderRadius: '18px 18px 4px 18px', padding: '10px 14px', maxWidth: '78%' }}>
            <p style={{ fontSize: 12, color: 'white', margin: 0, lineHeight: 1.5 }}>Yes! Just added it to my flashcards. Super helpful, thank you</p>
          </div>
          <div style={{ alignSelf: 'flex-start', background: '#F3F4F6', borderRadius: '18px 18px 18px 4px', padding: '10px 14px', maxWidth: '78%' }}>
            <p style={{ fontSize: 12, color: '#111827', margin: 0, lineHeight: 1.5 }}>Want to study together Thursday? Library at 3?</p>
          </div>
          <div style={{ alignSelf: 'flex-end', background: '#6B21A8', borderRadius: '18px 18px 4px 18px', padding: '10px 14px', maxWidth: '78%' }}>
            <p style={{ fontSize: 12, color: 'white', margin: 0, lineHeight: 1.5 }}>Yes, Thursday works. See you there!</p>
          </div>
        </div>
        <div style={{ padding: '10px 18px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, background: 'white', border: '1px solid #E5E7EB', borderRadius: 22, padding: '8px 14px', fontSize: 12, color: '#9CA3AF' }}>Type a message...</div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#6B21A8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
    proof: 'Generated in under 3 seconds. Cached on every subsequent visit.',
  },
  {
    icon: Zap,
    title: 'Flashcard Generation',
    description: 'AI reads your note and generates a full flashcard set, front and back, in seconds.',
    proof: 'Extracts up to 20 Q&A pairs per note automatically.',
  },
  {
    icon: Target,
    title: 'Resume Feedback',
    description: 'Detailed scoring across experience, education, skills, and formatting with keyword gap analysis.',
    proof: 'Scored across 5 dimensions with keyword gap detection.',
  },
];

export default function Product() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('notes');
  const [navVisible, setNavVisible] = useState(false);
  const sectionRefs = useRef({});

  useEffect(() => {
    const observers = [];

    // Active tab: highlight whichever section is most visible
    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveTab(s.id);
        },
        { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    // Visibility: show tab strip after trigger scrolls above viewport, hide at AI section
    let triggerPassed = false;
    let aiVisible = false;

    const update = () => setNavVisible(triggerPassed && !aiVisible);

    const trigger = document.getElementById('feature-nav-trigger');
    if (trigger) {
      const triggerObserver = new IntersectionObserver(
        ([entry]) => {
          triggerPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          update();
        },
        { threshold: 0 }
      );
      triggerObserver.observe(trigger);
      observers.push(triggerObserver);
    }

    const aiSection = document.getElementById('ai-section');
    if (aiSection) {
      const aiObserver = new IntersectionObserver(
        ([entry]) => {
          aiVisible = entry.isIntersecting;
          update();
        },
        { rootMargin: '0px 0px -60% 0px', threshold: 0 }
      );
      aiObserver.observe(aiSection);
      observers.push(aiObserver);
    }

    return () => observers.forEach(o => o.disconnect());
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="font-marketing min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <MarketingNav active="product" />

      {/* Fixed tab strip — appears after scrolling past trigger anchor */}
      <div
        style={{
          position: 'fixed',
          top: 57,
          left: 0,
          right: 0,
          zIndex: 40,
          background: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid #E5E7EB',
          padding: '10px 0',
          opacity: navVisible ? 1 : 0,
          pointerEvents: navVisible ? 'auto' : 'none',
          transform: navVisible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none', justifyContent: 'center' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                style={{
                  background: activeTab === tab.id ? '#6B21A8' : 'white',
                  border: `1px solid ${activeTab === tab.id ? '#6B21A8' : '#E5E7EB'}`,
                  borderRadius: 999,
                  padding: '8px 18px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: activeTab === tab.id ? 'white' : '#6B7280',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-10 text-center">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border"
          style={{ background: '#F3F0FF', borderColor: 'rgba(107,33,168,0.2)' }}
        >
          <Sparkles size={12} style={{ color: '#6B21A8' }} />
          <span className="text-xs font-semibold" style={{ color: '#6B21A8' }}>Full feature breakdown</span>
        </div>
        <h1
          className="font-bold tracking-tight leading-tight mb-5"
          style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'normal', fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#111827', fontWeight: 700 }}
        >
          Every tool a student needs, connected in one place.
        </h1>
        <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: '#6B7280' }}>
          One platform for your academic life and career. Notes, flashcards, tasks, job
          applications, resumes, and your social network, connected and powered by AI.
        </p>
      </section>

      {/* 3-up mini mockup preview row */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="flex gap-4 items-stretch" style={{ maxHeight: 260, overflow: 'hidden' }}>
          {/* Dashboard preview */}
          <div style={{ flex: 1, background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(107,33,168,0.06)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #E5E7EB', background: '#fafafa', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="flex gap-1">
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fca5a5' }} />
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fcd34d' }} />
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#86efac' }} />
              </div>
              <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 4, height: 14, marginLeft: 6 }} />
            </div>
            <div style={{ padding: 12, display: 'flex', gap: 10, height: '100%' }}>
              <div style={{ width: 44, background: '#F9FAFB', borderRadius: 8, padding: '8px 6px', flexShrink: 0 }}>
                {['D','N','F','T'].map(l => (
                  <div key={l} style={{ width: '100%', height: 8, borderRadius: 4, background: l === 'D' ? '#6B21A8' : '#E5E7EB', marginBottom: 6 }} />
                ))}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 10, background: '#F3F0FF', borderRadius: 4, width: '60%' }} />
                <div style={{ height: 48, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8 }} />
                <div style={{ height: 48, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8 }} />
              </div>
            </div>
          </div>
          {/* Note card preview */}
          <div style={{ flex: 1, background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(107,33,168,0.06)', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: '#6B21A8' }} />
              <div style={{ height: 10, background: '#111827', borderRadius: 4, width: '55%' }} />
              <div style={{ marginLeft: 'auto', height: 16, width: 40, borderRadius: 8, background: '#F3F0FF' }} />
            </div>
            <div style={{ height: 7, background: '#E5E7EB', borderRadius: 4, marginBottom: 6, width: '100%' }} />
            <div style={{ height: 7, background: '#E5E7EB', borderRadius: 4, marginBottom: 6, width: '85%' }} />
            <div style={{ height: 7, background: '#E5E7EB', borderRadius: 4, marginBottom: 16, width: '70%' }} />
            <div style={{ background: 'rgba(107,33,168,0.05)', border: '1px solid rgba(107,33,168,0.15)', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: '#6B21A8' }} />
                <div style={{ height: 8, background: '#6B21A8', borderRadius: 4, width: 60, opacity: 0.7 }} />
              </div>
              <div style={{ height: 6, background: '#E5E7EB', borderRadius: 4, marginBottom: 4, width: '100%' }} />
              <div style={{ height: 6, background: '#E5E7EB', borderRadius: 4, width: '75%' }} />
            </div>
          </div>
          {/* Kanban preview */}
          <div style={{ flex: 1, background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(107,33,168,0.06)', padding: 14 }}>
            <div style={{ display: 'flex', gap: 8, height: '100%' }}>
              {[
                { label: 'TO DO', color: '#6B21A8', bg: '#F3F0FF', count: 3 },
                { label: 'IN PROGRESS', color: '#D97706', bg: '#FFFBEB', count: 2 },
                { label: 'DONE', color: '#059669', bg: '#ECFDF5', count: 2 },
              ].map(col => (
                <div key={col.label} style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: col.color, background: col.bg, borderRadius: 3, padding: '2px 5px', marginBottom: 8, display: 'inline-block' }}>{col.label}</div>
                  {Array.from({ length: col.count }).map((_, i) => (
                    <div key={i} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 6, padding: '8px 8px', marginBottom: 5 }}>
                      <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, marginBottom: 4, width: '80%' }} />
                      <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3, width: '50%' }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature sections */}
      <div className="max-w-6xl mx-auto px-6">
        <div id="feature-nav-trigger" />
        {sections.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            style={{ padding: '96px 0' }}
          >
            <div className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-16 items-center`}>
              <div style={{ flex: 1, minWidth: 0, maxWidth: 480 }}>
                <span
                  className="block mb-3"
                  style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B21A8' }}
                >
                  {s.tag}
                </span>
                <h2
                  className="font-bold mb-4"
                  style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'normal', fontSize: '2.25rem', color: '#111827' }}
                >
                  {s.title}
                </h2>
                <p style={{ color: '#6B7280', fontSize: '1rem', lineHeight: 1.625, maxWidth: 440, marginBottom: 32 }}>{s.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {s.bullets.map(b => (
                    <div key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flexShrink: 0, marginTop: 2 }}>
                        <Check size={16} style={{ color: '#6B21A8', strokeWidth: 2.5 }} />
                      </div>
                      <span style={{ fontSize: '0.9375rem', color: '#374151' }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, maxWidth: 560, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {s.mockup}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* AI section */}
      <section id="ai-section" style={{ background: '#3B0764' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <Sparkles size={12} style={{ color: 'white' }} />
              <span className="text-xs font-semibold" style={{ color: 'white' }}>AI-POWERED</span>
            </div>
            <h2
              className="font-bold text-white mb-3"
              style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'normal', fontSize: '2.5rem' }}
            >
              AI built into every layer
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Not a bolt-on chatbot. AI is woven into the features you already use every day.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {aiFeatures.map(f => (
              <div
                key={f.title}
                style={{ background: '#FFFFFF', borderRadius: 12, padding: 28, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
              >
                <f.icon size={24} style={{ color: '#6B21A8', marginBottom: 14 }} />
                <h3 className="font-semibold mb-2" style={{ fontSize: '1.0625rem', color: '#111827' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.625, marginBottom: 8 }}>{f.description}</p>
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{f.proof}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#FFFFFF', borderTop: '1px solid #E5E7EB', padding: '96px 0' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2
            className="font-bold mb-4"
            style={{ fontFamily: 'Fraunces, Georgia, serif', fontStyle: 'normal', fontSize: '2.5rem', color: '#111827' }}
          >
            Ready to get started?
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1.125rem', marginBottom: 40 }}>
            Join Continuum and keep everything that matters in one place.
          </p>
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 font-semibold px-7 py-3 transition-all"
              style={{ background: '#6B21A8', color: 'white', fontSize: '0.9375rem', borderRadius: 8 }}
            >
              Go to Dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 font-semibold px-7 py-3 transition-all"
              style={{ background: '#6B21A8', color: 'white', fontSize: '0.9375rem', borderRadius: 8 }}
            >
              Start for free <ArrowRight size={15} />
            </Link>
          )}
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: 12 }}>
            Free forever. No credit card required.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
