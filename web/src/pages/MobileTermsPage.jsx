import { Link } from 'react-router-dom';

export default function MobileTermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: '0.8125rem', color: '#9B9B9B', marginBottom: 28 }}>Last updated: April 2026</p>

        <Section title="1. Acceptance of Terms">
          By using Continuum, you agree to these Terms of Service. If you do not agree, please do not use the app.
        </Section>

        <Section title="2. Use of Service">
          Continuum provides tools for note-taking, flashcard creation, task management, career tracking, and social learning. You may use these services for personal and professional learning purposes.
        </Section>

        <Section title="3. Account Responsibilities">
          You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
        </Section>

        <Section title="4. User Content">
          You retain ownership of content you create. By using Continuum, you grant us a limited license to process your content solely to provide the service (including AI features).
        </Section>

        <Section title="5. Acceptable Use">
          You agree not to:
          <ul>
            <li>Use the service for any unlawful purpose</li>
            <li>Share another user's private information without consent</li>
            <li>Attempt to access systems or data you are not authorized to access</li>
            <li>Reverse engineer or attempt to extract the source code of the app</li>
          </ul>
        </Section>

        <Section title="6. AI-Powered Features">
          Continuum uses AI to generate summaries, feedback, and flashcards. AI outputs are provided as-is and may not always be accurate. Do not rely solely on AI-generated content for critical decisions.
        </Section>

        <Section title="7. Termination">
          We reserve the right to suspend or terminate accounts that violate these terms.
        </Section>

        <Section title="8. Disclaimer of Warranties">
          The service is provided "as is" without warranties of any kind, either express or implied.
        </Section>

        <Section title="9. Limitation of Liability">
          To the maximum extent permitted by law, Continuum shall not be liable for any indirect, incidental, special, or consequential damages.
        </Section>

        <Section title="10. Changes to Terms">
          We may update these terms periodically. Continued use of the service after changes constitutes acceptance of the new terms.
        </Section>

        <Section title="11. Contact" last>
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
