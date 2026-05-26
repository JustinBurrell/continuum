import { Link } from 'react-router-dom';

const toc = [
  { id: 'information-we-collect',    label: 'Information We Collect' },
  { id: 'how-we-use',                label: 'How We Use Your Information' },
  { id: 'google-drive',              label: 'Google Drive Data' },
  { id: 'data-storage',              label: 'Data Storage and Security' },
  { id: 'data-retention',            label: 'Data Retention and Deletion' },
  { id: 'third-party',               label: 'Third-Party Services' },
  { id: 'childrens-privacy',         label: "Children's Privacy" },
  { id: 'changes',                   label: 'Changes to This Policy' },
  { id: 'contact',                   label: 'Contact Us' },
];

export default function MobilePrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6B21A8', marginBottom: 16 }}>Last updated: April 2026</p>

        <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: '#374151', marginBottom: 28 }}>
          Continuum ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform. By creating an account or using Continuum, you agree to the practices described in this policy.
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

          <Section id="information-we-collect" title="1. Information We Collect">
            <p>When you create a Continuum account or use our services, we collect the following types of information:</p>
            <p><strong>Account information.</strong> When you register with email and password, we collect your first name, last name, username, and email address. When you sign in with Google OAuth, we receive your name, email address, and Google profile picture from Google.</p>
            <p><strong>Content you create.</strong> This includes notes, flashcard sets, tasks, job applications, resumes, and messages you send to other users on the platform.</p>
            <p><strong>Usage data.</strong> We collect information about how you interact with the platform, such as pages visited and features used, to improve the service.</p>
            <p><strong>Profile information.</strong> You may optionally add a username, profile photo, and other profile details.</p>
          </Section>

          <Section id="how-we-use" title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Create and manage your account</li>
              <li>Provide, maintain, and improve the Continuum platform and its features</li>
              <li>Send transactional emails, including email verification and password reset messages</li>
              <li>Enable AI-powered features such as note summaries, flashcard generation, and resume feedback</li>
              <li>Allow you to connect and communicate with other users</li>
              <li>Protect the security and integrity of the platform</li>
            </ul>
            <p>We do not sell your personal information to third parties. We do not use your data for advertising purposes.</p>
          </Section>

          <Section id="google-drive" title="3. Google Drive Data">
            <p>Continuum requests access to Google Drive files you explicitly select (drive.file scope) to enable the Google Drive import feature. You choose which documents to import using the Google Picker — Continuum never browses or lists your entire Drive.</p>
            <p>How we use your Drive data:</p>
            <ul>
              <li>Drive data is accessed only when you explicitly select a file and initiate an import action</li>
              <li>Continuum only accesses files you select — we cannot see or list the rest of your Drive</li>
              <li>Imported content is displayed only to you, the authenticated user</li>
              <li>We do not store your raw Google Drive files on our servers beyond what you choose to import as a note</li>
              <li>We do not share your Drive data with third parties</li>
              <li>We do not use your Drive data for advertising or profiling</li>
              <li>We do not write to or modify your Google Drive</li>
            </ul>
            <p>You can revoke Continuum's access to your Google Drive at any time through your Google Account settings at myaccount.google.com/permissions.</p>
          </Section>

          <Section id="data-storage" title="4. Data Storage and Security">
            <p>Your data is stored on MongoDB Atlas, a cloud database service. Profile photos are stored on Cloudinary. We implement the following security measures:</p>
            <ul>
              <li>Passwords are hashed using bcrypt before storage</li>
              <li>Authentication uses short-lived JWT access tokens with rotating refresh tokens stored in httpOnly cookies</li>
              <li>All API endpoints are protected with rate limiting</li>
              <li>Security headers are enforced via Helmet.js</li>
              <li>Google OAuth tokens are encrypted at rest</li>
              <li>Database inputs are sanitized to prevent injection attacks</li>
            </ul>
            <p>While we take reasonable steps to protect your data, no method of transmission over the internet is completely secure. We cannot guarantee absolute security.</p>
          </Section>

          <Section id="data-retention" title="5. Data Retention and Deletion">
            <p>We retain your account data for as long as your account is active. If you wish to delete your account and all associated data, you may submit a request to us at the contact email below.</p>
            <p>When you delete your account from settings, your account enters a 30-day grace period during which it is deactivated but not permanently removed. You can restore your account at any time within those 30 days by logging back in. After 30 days, your account, profile, notes, flashcard sets, tasks, applications, resumes, and messages are permanently deleted and cannot be recovered.</p>
            <p>Some data may be retained for a limited period in backups, after which it will be permanently purged.</p>
          </Section>

          <Section id="third-party" title="6. Third-Party Services">
            <p>Continuum uses the following third-party services to operate the platform:</p>
            <ul>
              <li>Google OAuth (Google LLC) for authentication and Google Drive integration</li>
              <li>Groq for AI-powered features including note summaries, flashcard generation, and resume feedback</li>
              <li>Cloudinary for profile photo storage and delivery</li>
              <li>Resend for transactional email delivery (verification and password reset emails)</li>
              <li>MongoDB Atlas for database storage</li>
              <li>Upstash for Redis-based caching and rate limiting</li>
            </ul>
            <p>Each of these services has its own privacy policy. We encourage you to review them. We only share the minimum data necessary for these services to function.</p>
          </Section>

          <Section id="childrens-privacy" title="7. Children's Privacy">
            <p>Continuum is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us at the email below and we will promptly delete it.</p>
          </Section>

          <Section id="changes" title="8. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. When we make material changes, we will update the "Last updated" date at the top of this page. We encourage you to review this policy periodically. Continued use of Continuum after changes are posted constitutes your acceptance of the updated policy.</p>
          </Section>

          <Section id="contact" title="9. Contact Us" last>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:</p>
            <p><strong>Email:</strong> <a href="mailto:support@usecontinuum.dev" style={{ color: '#6B21A8' }}>support@usecontinuum.dev</a></p>
            <p>We will respond to privacy-related inquiries within 30 days.</p>
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
