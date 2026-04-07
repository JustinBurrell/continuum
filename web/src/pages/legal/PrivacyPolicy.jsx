import MarketingNav from '@/components/layout/MarketingNav';
import MarketingFooter from '@/components/layout/MarketingFooter';

const sections = [
  {
    id: 'information-we-collect',
    title: '1. Information We Collect',
    content: (
      <>
        <p>When you create a Continuum account or use our services, we collect the following types of information:</p>
        <p><strong>Account information.</strong> When you register with email and password, we collect your first name, last name, username, and email address. When you sign in with Google OAuth, we receive your name, email address, and Google profile picture from Google.</p>
        <p><strong>Content you create.</strong> This includes notes, flashcard sets, tasks, job applications, resumes, and messages you send to other users on the platform.</p>
        <p><strong>Usage data.</strong> We collect information about how you interact with the platform, such as pages visited and features used, to improve the service.</p>
        <p><strong>Profile information.</strong> You may optionally add a username, profile photo, and other profile details.</p>
      </>
    ),
  },
  {
    id: 'how-we-use-your-information',
    title: '2. How We Use Your Information',
    content: (
      <>
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
      </>
    ),
  },
  {
    id: 'google-drive-data',
    title: '3. Google Drive Data',
    content: (
      <>
        <p>Continuum requests read-only access to your Google Drive (<code>drive.readonly</code> scope) to enable the Google Drive import feature. This allows you to import documents from your Google Drive directly into Continuum as notes.</p>
        <p><strong>How we use your Drive data:</strong></p>
        <ul>
          <li>Drive data is accessed only when you explicitly initiate an import action</li>
          <li>Imported content is displayed only to you, the authenticated user</li>
          <li>We do not store your raw Google Drive files on our servers beyond what you choose to import as a note</li>
          <li>We do not share your Drive data with third parties</li>
          <li>We do not use your Drive data for advertising or profiling</li>
          <li>Read-only is the narrowest scope that enables this feature. We do not write to or modify your Google Drive</li>
        </ul>
        <p>You can revoke Continuum's access to your Google Drive at any time through your Google Account settings at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a>.</p>
      </>
    ),
  },
  {
    id: 'data-storage-and-security',
    title: '4. Data Storage and Security',
    content: (
      <>
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
      </>
    ),
  },
  {
    id: 'data-retention-and-deletion',
    title: '5. Data Retention and Deletion',
    content: (
      <>
        <p>We retain your account data for as long as your account is active. If you wish to delete your account and all associated data, you may submit a request to us at the contact email below.</p>
        <p>When you delete your account from settings, your account enters a 30-day grace period during which it is deactivated but not permanently removed. You can restore your account at any time within those 30 days by logging back in. After 30 days, your account, profile, notes, flashcard sets, tasks, applications, resumes, and messages are permanently deleted and cannot be recovered.</p>
        <p>Some data may be retained for a limited period in backups, after which it will be permanently purged.</p>
      </>
    ),
  },
  {
    id: 'third-party-services',
    title: '6. Third-Party Services',
    content: (
      <>
        <p>Continuum uses the following third-party services to operate the platform:</p>
        <ul>
          <li><strong>Google OAuth</strong> (Google LLC) for authentication and Google Drive integration</li>
          <li><strong>Groq</strong> for AI-powered features including note summaries, flashcard generation, and resume feedback</li>
          <li><strong>Cloudinary</strong> for profile photo storage and delivery</li>
          <li><strong>Resend</strong> for transactional email delivery (verification and password reset emails)</li>
          <li><strong>MongoDB Atlas</strong> for database storage</li>
          <li><strong>Upstash</strong> for Redis-based caching and rate limiting</li>
        </ul>
        <p>Each of these services has its own privacy policy. We encourage you to review them. We only share the minimum data necessary for these services to function.</p>
      </>
    ),
  },
  {
    id: 'childrens-privacy',
    title: "7. Children's Privacy",
    content: (
      <>
        <p>Continuum is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us at the email below and we will promptly delete it.</p>
      </>
    ),
  },
  {
    id: 'changes-to-this-policy',
    title: '8. Changes to This Policy',
    content: (
      <>
        <p>We may update this Privacy Policy from time to time. When we make material changes, we will update the "Last updated" date at the top of this page. We encourage you to review this policy periodically. Continued use of Continuum after changes are posted constitutes your acceptance of the updated policy.</p>
      </>
    ),
  },
  {
    id: 'contact-us',
    title: '9. Contact Us',
    content: (
      <>
        <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:</p>
        <p><strong>Email:</strong> <a href="mailto:support@usecontinuum.dev">support@usecontinuum.dev</a></p>
        <p>We will respond to privacy-related inquiries within 30 days.</p>
      </>
    ),
  },
];

const toc = [
  { id: 'information-we-collect', label: 'Information We Collect' },
  { id: 'how-we-use-your-information', label: 'How We Use Your Information' },
  { id: 'google-drive-data', label: 'Google Drive Data' },
  { id: 'data-storage-and-security', label: 'Data Storage and Security' },
  { id: 'data-retention-and-deletion', label: 'Data Retention and Deletion' },
  { id: 'third-party-services', label: 'Third-Party Services' },
  { id: 'childrens-privacy', label: "Children's Privacy" },
  { id: 'changes-to-this-policy', label: 'Changes to This Policy' },
  { id: 'contact-us', label: 'Contact Us' },
];

export default function PrivacyPolicy() {
  return (
    <div className="font-marketing min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <MarketingNav />

      <main style={{ maxWidth: 768, margin: '0 auto', padding: '64px 24px 96px' }}>
        <h1
          style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 2.75rem)', color: '#111827', marginBottom: 8, lineHeight: 1.15 }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#6B21A8', marginBottom: 32 }}>
          Last updated: March 2026
        </p>

        <p style={{ fontSize: 15, lineHeight: 1.75, color: '#374151', marginBottom: 48 }}>
          Continuum ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
          explains how we collect, use, and safeguard your information when you use our platform. By
          creating an account or using Continuum, you agree to the practices described in this policy.
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
        .legal-content code { font-size: 0.85em; background: rgba(107,33,168,0.08); padding: 1px 5px; border-radius: 4px; }
        section[id] { scroll-margin-top: 80px; }
      `}</style>

      <MarketingFooter />
    </div>
  );
}
