import { Link } from 'react-router-dom';

export default function MobilePrivacyPage() {
  return (
    <div className="w-full min-h-screen overflow-x-hidden" style={{ backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <header className="w-full" style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#ffffff' }}>
        <div className="max-w-sm mx-auto w-full px-4 py-4 text-center">
          <Link to="/">
            <img src="/logo-lockup.svg" alt="Continuum" style={{ height: 32, display: 'inline-block' }} />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-sm mx-auto w-full px-4 py-6">
        <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: 4 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: '0.8125rem', color: '#9B9B9B', marginBottom: 28 }}>Last updated: April 2026</p>

        <Section title="1. Information We Collect">
          We collect information you provide when creating an account, such as your name, email address, and profile details. We also collect content you create within the app, including notes, flashcard sets, tasks, and job application records.
        </Section>

        <Section title="2. How We Use Your Information">
          We use your information to:
          <ul>
            <li>Provide and improve the Continuum service</li>
            <li>Personalize your experience</li>
            <li>Generate AI-powered summaries, feedback, and flashcards from your content</li>
            <li>Send important service-related notifications</li>
          </ul>
        </Section>

        <Section title="3. Data Sharing">
          We do not sell your personal information. We may share data with:
          <ul>
            <li>AI service providers (solely to process AI-powered features on your behalf)</li>
            <li>Cloud storage providers for file storage</li>
            <li>Analytics providers to improve app performance</li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          We retain your data as long as your account is active. You may request deletion of your account and associated data at any time by contacting us.
        </Section>

        <Section title="5. Security">
          We implement industry-standard security measures to protect your data, including encrypted connections (HTTPS) and secure authentication.
        </Section>

        <Section title="6. Your Rights">
          You have the right to access, update, and delete your personal information. Contact us at{' '}
          <a href="mailto:support@usecontinuum.dev" style={{ color: '#6B21A8' }}>support@usecontinuum.dev</a>{' '}
          to exercise these rights.
        </Section>

        <Section title="7. Children's Privacy">
          Continuum is not directed to children under 13. We do not knowingly collect personal information from children under 13.
        </Section>

        <Section title="8. Changes to This Policy">
          We may update this policy periodically. We will notify you of significant changes via email or in-app notification.
        </Section>

        <Section title="9. Contact" last>
          Questions? Email us at{' '}
          <a href="mailto:support@usecontinuum.dev" style={{ color: '#6B21A8' }}>support@usecontinuum.dev</a>
        </Section>
      </main>

      {/* Footer */}
      <footer className="w-full" style={{ borderTop: '1px solid #E5E7EB' }}>
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
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children, last = false }) {
  return (
    <div style={{ marginBottom: last ? 0 : 24 }}>
      <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.9375rem', fontWeight: 600, color: '#111827', marginBottom: 6 }}>
        {title}
      </h2>
      <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}
