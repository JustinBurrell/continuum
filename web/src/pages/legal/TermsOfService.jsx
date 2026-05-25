import MarketingNav from '@/components/layout/MarketingNav';
import MarketingFooter from '@/components/layout/MarketingFooter';

const sections = [
  {
    id: 'acceptance-of-terms',
    title: '1. Acceptance of Terms',
    content: (
      <>
        <p>By creating an account or using Continuum, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the platform. These Terms apply to all users of Continuum, including registered users and visitors.</p>
        <p>We may update these Terms from time to time. Continued use of Continuum after changes are posted constitutes your acceptance of the updated Terms.</p>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    content: (
      <>
        <p>You must be at least 13 years old to use Continuum. By creating an account, you represent and warrant that you meet this age requirement.</p>
        <p>If you are between 13 and 18 years old, you represent that you have your parent or guardian's permission to use the platform and that they have agreed to these Terms on your behalf.</p>
      </>
    ),
  },
  {
    id: 'your-account',
    title: '3. Your Account',
    content: (
      <>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately at <a href="mailto:support@usecontinuum.dev">support@usecontinuum.dev</a> if you become aware of any unauthorized use of your account.</p>
        <p>You may not create an account on behalf of someone else or transfer your account to another person. Each account is for a single individual user.</p>
        <p>You agree to provide accurate, complete, and current information when registering and to keep your account information up to date.</p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: '4. Acceptable Use',
    content: (
      <>
        <p>You agree to use Continuum only for lawful purposes and in a manner that does not infringe the rights of others. You may not:</p>
        <ul>
          <li>Post or share content that is abusive, harassing, defamatory, or otherwise harmful</li>
          <li>Attempt to gain unauthorized access to other users' accounts or data</li>
          <li>Use Continuum to distribute spam, malware, or other malicious content</li>
          <li>Scrape, crawl, or otherwise extract data from the platform without our express written permission</li>
          <li>Use the platform in any way that could damage, disable, overburden, or impair its operation</li>
          <li>Impersonate another person or entity</li>
          <li>Use Continuum for any commercial purpose without our written consent</li>
        </ul>
        <p>We reserve the right to suspend or terminate accounts that violate these guidelines.</p>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: '5. Intellectual Property',
    content: (
      <>
        <p>The Continuum platform, including its design, code, features, and branding, is owned by Continuum and protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the platform without our express written permission.</p>
        <p>Content you create on Continuum, such as notes, flashcard sets, and resumes, remains yours. By posting content on the platform, you grant us a limited license to store, process, and display that content as necessary to operate the service. We do not claim ownership of your content.</p>
      </>
    ),
  },
  {
    id: 'google-integration',
    title: '6. Google Integration',
    content: (
      <>
        <p>Continuum offers Google OAuth login and Google Drive integration. By connecting your Google account, you authorize us to access the Google services and data you permit, as described in our Privacy Policy.</p>
        <p>Your use of Google services through Continuum is also subject to Google's Terms of Service and Privacy Policy. We are not responsible for Google's services or any changes Google makes to its platform or APIs.</p>
        <p>You can revoke Continuum's access to your Google account at any time through your Google Account settings.</p>
      </>
    ),
  },
  {
    id: 'ai-generated-content',
    title: '7. AI-Generated Content',
    content: (
      <>
        <p>Continuum uses AI to provide features including note summaries, flashcard generation, and resume feedback. AI-generated content is provided for informational and productivity purposes only.</p>
        <p>We do not guarantee the accuracy, completeness, or fitness for a particular purpose of any AI-generated content. You are responsible for reviewing and verifying any AI-generated content before relying on it.</p>
        <p>AI features are subject to usage limits. We reserve the right to adjust these limits at any time.</p>
      </>
    ),
  },
  {
    id: 'disclaimer-of-warranties',
    title: '8. Disclaimer of Warranties',
    content: (
      <>
        <p>Continuum is provided "as is" and "as available" without warranties of any kind, either express or implied. To the fullest extent permitted by law, we disclaim all warranties, including warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
        <p>We do not warrant that the platform will be uninterrupted, error-free, or free of harmful components. We do not warrant that defects will be corrected or that the platform is free of viruses or other harmful components.</p>
      </>
    ),
  },
  {
    id: 'limitation-of-liability',
    title: '9. Limitation of Liability',
    content: (
      <>
        <p>To the fullest extent permitted by applicable law, Continuum and its founders, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, loss of profits, or loss of goodwill, arising from your use of or inability to use the platform.</p>
        <p>In no event shall our total liability to you for all claims exceed the amount you have paid us in the twelve months preceding the claim, or one hundred dollars (USD $100), whichever is greater.</p>
      </>
    ),
  },
  {
    id: 'termination',
    title: '10. Termination',
    content: (
      <>
        <p>You may delete your account at any time from your account settings. When you initiate a deletion, your account enters a 30-day grace period. During this period your account and all associated data are deactivated but not yet permanently removed. You can restore your account at any time within those 30 days by logging back in. After 30 days, your account and all associated data are permanently deleted and cannot be recovered.</p>
        <p>We reserve the right to suspend or terminate your account at any time, without prior notice, if we reasonably believe you have violated these Terms or if we discontinue the platform. Upon termination, your right to use Continuum ceases immediately.</p>
      </>
    ),
  },
  {
    id: 'changes-to-these-terms',
    title: '11. Changes to These Terms',
    content: (
      <>
        <p>We may revise these Terms at any time. When we make material changes, we will update the "Last updated" date at the top of this page. We encourage you to review these Terms periodically. Your continued use of Continuum after changes are posted means you accept the revised Terms.</p>
      </>
    ),
  },
  {
    id: 'contact',
    title: '12. Contact',
    content: (
      <>
        <p>If you have questions about these Terms, please contact us at:</p>
        <p><strong>Email:</strong> <a href="mailto:support@usecontinuum.dev">support@usecontinuum.dev</a></p>
      </>
    ),
  },
];

const toc = [
  { id: 'acceptance-of-terms', label: 'Acceptance of Terms' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'your-account', label: 'Your Account' },
  { id: 'acceptable-use', label: 'Acceptable Use' },
  { id: 'intellectual-property', label: 'Intellectual Property' },
  { id: 'google-integration', label: 'Google Integration' },
  { id: 'ai-generated-content', label: 'AI-Generated Content' },
  { id: 'disclaimer-of-warranties', label: 'Disclaimer of Warranties' },
  { id: 'limitation-of-liability', label: 'Limitation of Liability' },
  { id: 'termination', label: 'Termination' },
  { id: 'changes-to-these-terms', label: 'Changes to These Terms' },
  { id: 'contact', label: 'Contact' },
];

export default function TermsOfService() {
  return (
    <div className="font-marketing min-h-screen" style={{ backgroundColor: '#F8F9FA' }}>
      <MarketingNav />

      <main id="main-content" style={{ maxWidth: 768, margin: '0 auto', padding: '64px 24px 96px' }}>
        <h1
          style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 2.75rem)', color: '#111827', marginBottom: 8, lineHeight: 1.15 }}
        >
          Terms of Service
        </h1>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#6B21A8', marginBottom: 32 }}>
          Last updated: March 2026
        </p>

        <p style={{ fontSize: 15, lineHeight: 1.75, color: '#374151', marginBottom: 48 }}>
          These Terms of Service govern your access to and use of Continuum, a student productivity platform.
          Please read these Terms carefully before using the platform. By creating an account or accessing Continuum,
          you agree to be bound by these Terms.
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
