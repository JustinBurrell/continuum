import MarketingNav from '@/components/layout/MarketingNav';
import MarketingFooter from '@/components/layout/MarketingFooter';

const sections = [
  {
    id: 'our-commitment',
    title: '1. Our Commitment',
    content: (
      <>
        <p>
          Continuum is built for students — all students. We believe that academic tools should work
          for everyone, regardless of disability, assistive technology, or how you prefer to interact
          with the web. Accessibility is a continuous effort, not a checklist.
        </p>
        <p>
          We target WCAG 2.1 Level AA compliance, which satisfies the requirements of Section 508 of
          the Rehabilitation Act. Both standards are designed to ensure that web content is usable by
          people with a wide range of disabilities, including visual, auditory, motor, and cognitive
          differences.
        </p>
        <p>
          We review our accessibility status on every major release and update this statement accordingly.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-support',
    title: '2. What We Support',
    content: (
      <>
        <p>We currently support:</p>
        <ul>
          <li>Keyboard-only navigation throughout the app and marketing site</li>
          <li>
            Screen readers: VoiceOver (macOS and iOS), NVDA (Windows), TalkBack (Android)
          </li>
          <li>Browsers tested: Chrome, Firefox, Safari</li>
          <li>
            Reduced motion: animations are disabled when you have "Reduce Motion" enabled in your
            operating system settings
          </li>
          <li>Skip-to-main-content link on every page so keyboard users can bypass navigation</li>
          <li>
            Focus management in modals: keyboard focus is trapped inside open dialogs and returned to
            the trigger element on close
          </li>
          <li>Live region announcements for new messages and toast notifications</li>
          <li>
            Calendar grid: fully keyboard-navigable with arrow keys, Home, End, and Enter
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'known-limitations',
    title: '3. Known Limitations',
    content: (
      <>
        <p>
          We are honest about where we fall short. Every item below includes a workaround so you
          can still complete the task.
        </p>
        <ul>
          <li>
            <strong>Google Drive file picker:</strong> Uses a third-party modal provided by Google
            that we do not fully control. You can still connect your Drive account and select files
            using keyboard and click.
          </li>
          <li>
            <strong>Task board drag-and-drop:</strong> Moving cards by dragging is not keyboard
            accessible. Every card includes a status dropdown that provides a fully keyboard-accessible
            alternative for changing task status.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'testing-methods',
    title: '4. Testing Methods',
    content: (
      <>
        <p>We test accessibility using the following methods:</p>
        <ul>
          <li>
            <strong>Automated:</strong> axe-playwright runs on every pull request via GitHub Actions
            CI. Violations block merges.
          </li>
          <li>
            <strong>Manual:</strong> Keyboard-only navigation testing, VoiceOver smoke tests on
            macOS, and Lighthouse audits.
          </li>
          <li>
            <strong>Tools:</strong> axe DevTools Chrome extension, Lighthouse, and WebAIM Contrast
            Checker.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'reporting-issues',
    title: '5. Reporting Issues',
    content: (
      <>
        <p>
          Found an accessibility barrier? Tell us. We review every report and treat accessibility
          issues with the same priority as any other bug.
        </p>
        <p>
          Email us at{' '}
          <a href="mailto:support@usecontinuum.dev">support@usecontinuum.dev</a>. We will respond
          within 2 business days.
        </p>
        <p>
          When you write in, it helps to include the page URL, what you were trying to do, and
          which browser or assistive technology you were using. This lets us reproduce and fix the
          issue faster.
        </p>
      </>
    ),
  },
  {
    id: 'last-reviewed',
    title: '6. Last Reviewed',
    content: (
      <>
        <p>
          This statement was last reviewed in May 2026. We update it on every major release to
          reflect changes to our supported features and known limitations.
        </p>
      </>
    ),
  },
];

const toc = [
  { id: 'our-commitment', label: 'Our Commitment' },
  { id: 'what-we-support', label: 'What We Support' },
  { id: 'known-limitations', label: 'Known Limitations' },
  { id: 'testing-methods', label: 'Testing Methods' },
  { id: 'reporting-issues', label: 'Reporting Issues' },
  { id: 'last-reviewed', label: 'Last Reviewed' },
];

export default function Accessibility() {
  return (
    <div className="font-marketing min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <MarketingNav />

      <main id="main-content" style={{ maxWidth: 768, margin: '0 auto', padding: '64px 24px 96px' }}>
        <h1
          style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 2.75rem)', color: '#111827', marginBottom: 8, lineHeight: 1.15 }}
        >
          Accessibility
        </h1>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#6B21A8', marginBottom: 32 }}>
          Last reviewed: May 2026
        </p>

        <p style={{ fontSize: 15, lineHeight: 1.75, color: '#374151', marginBottom: 48 }}>
          Continuum is committed to making our platform accessible to everyone. This page describes
          what we support, where we fall short, and how to reach us when something does not work.
        </p>

        {/* Table of contents */}
        <div
          style={{ background: '#F3F0FF', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px 28px', marginBottom: 56 }}
        >
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B7280', marginBottom: 16 }}>
            Table of Contents
          </p>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  style={{ fontSize: 14, color: '#6B21A8', fontWeight: 500, textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2
                style={{ fontFamily: 'inherit', fontWeight: 700, fontSize: '1.1rem', color: '#111827', marginBottom: 16 }}
              >
                {section.title}
              </h2>
              <div className="legal-content">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </main>

      <style>{`
        .legal-content { display: flex; flex-direction: column; gap: 12px; }
        .legal-content p { font-size: 14px; line-height: 1.75; color: #374151; margin: 0; }
        .legal-content ul { padding-left: 20px; list-style: disc; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .legal-content ul li { font-size: 14px; line-height: 1.7; color: #374151; }
        .legal-content a { color: #6B21A8; }
        .legal-content strong { color: #111827; }
        section[id] { scroll-margin-top: 80px; }
      `}</style>

      <MarketingFooter />
    </div>
  );
}
