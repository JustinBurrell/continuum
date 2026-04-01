import { Linkedin } from 'lucide-react';

function InstagramIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SocialLinks({ user, className = '', style }) {
  if (!user) return null;

  const hasLinkedin = !!user.linkedinUrl;
  const hasInstagram = !!user.instagramHandle;

  if (!hasLinkedin && !hasInstagram) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`} style={style}>
      {hasLinkedin && (
        <a
          href={user.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn profile"
          title="View LinkedIn profile"
          style={{ color: '#0a66c2', display: 'flex', alignItems: 'center' }}
        >
          <Linkedin size={16} />
        </a>
      )}
      {hasInstagram && (
        <a
          href={`https://instagram.com/${user.instagramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Instagram: @${user.instagramHandle}`}
          title={`View Instagram: @${user.instagramHandle}`}
          style={{ color: '#e1306c', display: 'flex', alignItems: 'center' }}
        >
          <InstagramIcon size={16} />
        </a>
      )}
    </div>
  );
}
