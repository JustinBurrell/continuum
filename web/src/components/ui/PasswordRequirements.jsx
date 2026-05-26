const CHECKS = [
  { id: 'length',  label: 'At least 8 characters',         test: (v) => v.length >= 8 },
  { id: 'letter',  label: 'At least one letter',            test: (v) => /[a-zA-Z]/.test(v) },
  { id: 'number',  label: 'At least one number',            test: (v) => /\d/.test(v) },
  { id: 'special', label: 'At least one special character', test: (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v) },
];

export default function PasswordRequirements({ password }) {
  return (
    <ul
      role="list"
      aria-label="Password requirements"
      aria-live="polite"
      aria-atomic="false"
      style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8, padding: 0, listStyle: 'none' }}
    >
      {CHECKS.map(({ id, label, test }) => {
        const ok = password.length > 0 && test(password);
        const pending = password.length === 0;
        return (
          <li key={id} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              aria-hidden="true"
              style={{
                width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                background: pending ? 'rgba(107,33,168,0.08)' : ok ? '#dcfce7' : '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: pending ? '#6B7280' : ok ? '#16a34a' : '#dc2626' }}>
                {pending ? '·' : ok ? '✓' : '✗'}
              </span>
            </span>
            <span
              style={{ fontSize: 12, color: pending ? '#6B7280' : ok ? '#16a34a' : '#dc2626' }}
              aria-label={`${label}: ${pending ? 'not entered' : ok ? 'met' : 'not met'}`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
