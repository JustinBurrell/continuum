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
        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately at <a href="mailto:privacy@continuumapp.dev">privacy@continuumapp.dev</a> if you become aware of any unauthorized use of your account.</p>
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
        <p>You may delete your account at any time by contacting us at <a href="mailto:privacy@continuumapp.dev">privacy@continuumapp.dev</a>. We will process deletion requests within 30 days.</p>
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
        <p><strong>Email:</strong> <a href="mailto:privacy@continuumapp.dev">privacy@continuumapp.dev</a></p>
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
    <div className="min-h-screen" style={{ backgroundColor: '#fef7ff' }}>
      <MarketingNav />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1
          className="font-bold mb-2"
          style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#111827' }}
        >
          Terms of Service
        </h1>
        <p className="text-sm font-semibold mb-8" style={{ color: '#6b21a8' }}>
          Last updated: March 2026
        </p>

        <p className="text-base leading-relaxed mb-10" style={{ color: '#374151' }}>
          These Terms of Service govern your access to and use of Continuum, a student productivity platform.
          Please read these Terms carefully before using the platform. By creating an account or accessing Continuum,
          you agree to be bound by these Terms.
        </p>

        {/* Table of contents */}
        <div
          className="rounded-xl p-6 mb-12"
          style={{ background: '#f5f0ff', border: '1px solid rgba(107,33,168,0.15)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#a087b0', letterSpacing: '0.12em' }}>
            Table of Contents
          </p>
          <ol className="space-y-2">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-sm no-underline"
                  style={{ color: '#6b21a8', fontWeight: 500 }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2
                className="font-bold mb-4"
                style={{ fontFamily: 'Georgia, serif', fontSize: '1.15rem', color: '#111827' }}
              >
                {section.title}
              </h2>
              <div
                className="text-sm leading-relaxed space-y-4"
                style={{ color: '#374151' }}
              >
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </main>

      <style>{`
        .space-y-4 p { margin: 0; }
        .space-y-4 ul { padding-left: 1.25rem; list-style: disc; margin: 0; }
        .space-y-4 ul li { margin-bottom: 0.35rem; }
        .space-y-4 a { color: #6b21a8; }
      `}</style>

      <MarketingFooter />
    </div>
  );
}
