export function IntegrationLogo({ icon, size = 24, className, colorOverride }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={colorOverride || `#${icon.hex}`}
      className={className}
      aria-label={icon.title}
      role="img"
    >
      <path d={icon.path} />
    </svg>
  );
}
