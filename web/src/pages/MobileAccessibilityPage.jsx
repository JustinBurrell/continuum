import { Link } from 'react-router-dom';

const toc = [
  { id: 'our-commitment',    label: 'Our Commitment' },
  { id: 'what-we-support',  label: 'What We Support' },
  { id: 'known-limitations', label: 'Known Limitations' },
  { id: 'testing-methods',  label: 'Testing Methods' },
  { id: 'reporting-issues', label: 'Reporting Issues' },
  { id: 'last-reviewed',    label: 'Last Reviewed' },
];

export default function MobileAccessibilityPage() {
  return (
    <div className="w-full min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F8F9FA' }}>
      {/* Nav */}
      <nav className="w-full" style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: 'rgba(255,255,255,0.95)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="max-w-sm mx-auto w-full px-4 py-3 flex items-center justify-between">
          <Link to="/">
            <img src="/logo-lockup.svg" alt="Continuum" style={{ height: 28 }} />
          </Link>
          <Link to="/" state={{ scrollToForm: true }} style={{ color: '#6B21A8', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
            Join the waitlist
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-sm mx-auto w-full px-4 py-8">
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.75rem', color: '#111827', marginBottom: 6, lineHeight: 1.15 }}>
          Accessibility
        </h1>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B21A8', marginBottom: 16 }}>Last reviewed: May 2026</p>

        <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: '#374151', marginBottom: 28 }}>
          Continuum is committed to making our platform accessible to everyone. This page describes
          what we support, where we fall short, and how to reach us when something does not work.
        </p>

        {/* Table of contents */}
        <div style={{ background: '#F3F0FF', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px', marginBottom: 36 }}>
          <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 12 }}>
            Table of Contents
          </p>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} style={{ fontSize: '0.875rem', color: '#6B21A8', fontWeight: 500, textDecoration: 'none' }}>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <Section id="our-commitment" title="1. Our Commitment">
            <p>
              Continuum is built for students. We believe that academic tools should work for everyone,
              regardless of disability, assistive technology, or how you prefer to interact with the web.
              Accessibility is a continuous effort, not a checklist.
            </p>
            <p>
              We target WCAG 2.1 Level AA compliance, which satisfies the requirements of Section 508
              of the Rehabilitation Act. We review our accessibility status on every major release.
            </p>
          </Section>

          <Section id="what-we-support" title="2. What We Support">
            <p>We currently support:</p>
            <ul>
              <li>Keyboard-only navigation throughout the app and marketing site</li>
              <li>Screen readers: VoiceOver (macOS and iOS), NVDA (Windows), TalkBack (Android)</li>
              <li>Browsers tested: Chrome, Firefox, Safari</li>
              <li>Reduced motion: animations are disabled when you have "Reduce Motion" enabled in your OS settings</li>
              <li>Skip-to-main-content link on every page</li>
              <li>Focus management in modals: focus is trapped and returned to the trigger on close</li>
              <li>Live region announcements for new messages and toast notifications</li>
              <li>Calendar grid: fully keyboard-navigable with arrow keys, Home, End, and Enter</li>
            </ul>
          </Section>

          <Section id="known-limitations" title="3. Known Limitations">
            <p>
              We are honest about where we fall short. Every item below includes a workaround.
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
                alternative.
              </li>
            </ul>
          </Section>

          <Section id="testing-methods" title="4. Testing Methods">
            <p>We test accessibility using:</p>
            <ul>
              <li><strong>Automated:</strong> axe-playwright runs on every pull request via GitHub Actions CI. Violations block merges.</li>
              <li><strong>Manual:</strong> Keyboard-only navigation testing, VoiceOver smoke tests, and Lighthouse audits.</li>
              <li><strong>Tools:</strong> axe DevTools Chrome extension, Lighthouse, and WebAIM Contrast Checker.</li>
            </ul>
          </Section>

          <Section id="reporting-issues" title="5. Reporting Issues">
            <p>
              Found an accessibility barrier? Email us at{' '}
              <a href="mailto:support@usecontinuum.dev" style={{ color: '#6B21A8' }}>support@usecontinuum.dev</a>.
              We will respond within 2 business days.
            </p>
            <p>
              When you write in, it helps to include the page URL, what you were trying to do, and
              which browser or assistive technology you were using.
            </p>
          </Section>

          <Section id="last-reviewed" title="6. Last Reviewed" last>
            <p>
              This statement was last reviewed in May 2026. We update it on every major release.
            </p>
          </Section>

        </div>
      </main>

      <MobileFooter />

      <style>{`
        .legal-content { display: flex; flex-direction: column; gap: 10px; }
        .legal-content p { font-size: 0.875rem; line-height: 1.75; color: #374151; margin: 0; }
        .legal-content ul { padding-left: 18px; list-style: disc; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .legal-content ul li { font-size: 0.875rem; line-height: 1.7; color: #374151; }
        .legal-content a { color: #6B21A8; }
        .legal-content strong { color: #111827; }
        section[id] { scroll-margin-top: 64px; }
      `}</style>
    </div>
  );
}

function Section({ id, title, children, last = false }) {
  return (
    <section id={id} style={{ marginBottom: last ? 0 : undefined }}>
      <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 12 }}>
        {title}
      </h2>
      <div className="legal-content">{children}</div>
    </section>
  );
}

function MobileFooter() {
  return (
    <footer className="w-full" style={{ borderTop: '1px solid #E5E7EB', marginTop: 48 }}>
      <div className="max-w-sm mx-auto w-full px-4 pt-4 pb-8 text-center">
        <p style={{ color: '#9B9B9B', fontSize: '0.75rem', margin: '0 0 8px' }}>
          &copy; 2026 Continuum. All rights reserved.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <Link to="/privacy" style={{ color: '#6B7280', fontSize: '0.75rem', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>
          <Link to="/terms" style={{ color: '#6B7280', fontSize: '0.75rem', textDecoration: 'underline' }}>
            Terms of Service
          </Link>
          <Link to="/accessibility" style={{ color: '#6B7280', fontSize: '0.75rem', textDecoration: 'underline' }}>
            Accessibility
          </Link>
        </div>
      </div>
    </footer>
  );
}
