import { Star } from 'lucide-react';

const CONFIG = {
    founder: {
        label: 'Founder',
        render: (size) => <Star size={size} fill="#f59e0b" stroke="none" />,
        color: '#f59e0b',
    },
    team: {
        label: 'Team Continuum',
        render: (size) => (
            <img
                src="/logo.svg"
                alt=""
                aria-hidden="true"
                style={{ width: Math.round(size * 1.4), height: Math.round(size * 1.4), objectFit: 'contain', display: 'block', flexShrink: 0 }}
            />
        ),
        color: '#6b21a8',
    },
};

// Renders inline role badge icons for founder and team roles.
// Accepts a roles array — renders one icon per recognized role.
// admin and any unrecognized values are silently ignored.
//
// Props:
//   roles    — Array<'founder' | 'team' | 'admin'> | null | undefined
//   expanded — false (icon only, 14px) | true (icon + label text, 18px)
export default function VerifiedBadge({ roles, expanded = false }) {
    if (!roles || roles.length === 0) return null;

    const badges = roles
        .map(r => CONFIG[r])
        .filter(Boolean);

    if (badges.length === 0) return null;

    const size = expanded ? 18 : 14;

    return (
        <>
            {badges.map(({ render, color, label }) => (
                <span
                    key={label}
                    role="img"
                    aria-label={label}
                    title={label}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: expanded ? 4 : 0,
                        flexShrink: 0,
                    }}
                >
                    {render(size)}
                    {expanded && (
                        <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
                    )}
                </span>
            ))}
        </>
    );
}
