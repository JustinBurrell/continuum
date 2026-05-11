// Shows the Team Continuum logo icon for users with the "team" role.
// The "founder" role is intentionally not rendered — team membership covers it.
export default function VerifiedBadge({ roles, expanded = false }) {
    if (!roles?.includes('team')) return null;

    const size = expanded ? 18 : 14;

    return (
        <span
            role="img"
            aria-label="Team Continuum"
            title="Team Continuum"
            style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
        >
            <img
                src="/logo.svg"
                alt=""
                aria-hidden="true"
                style={{ width: Math.round(size * 1.4), height: Math.round(size * 1.4), objectFit: 'contain', display: 'block' }}
            />
        </span>
    );
}
