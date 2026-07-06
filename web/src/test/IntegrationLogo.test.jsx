/**
 * IntegrationLogo.test.jsx
 *
 * Component tests for the IntegrationLogo icon renderer.
 * Verifies the svg fill color, the inner <path> element, and that
 * colorOverride takes precedence over the icon's default hex color.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { siGoogledrive, siNotion } from 'simple-icons';
import { IntegrationLogo } from '@/components/ui/IntegrationLogo';

describe('IntegrationLogo', () => {
  it('renders the Google Drive icon with its brand fill color', () => {
    const { container } = render(<IntegrationLogo icon={siGoogledrive} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('fill', '#4285F4');
  });

  it('renders a non-empty path starting with "M" for the icon', () => {
    const { container } = render(<IntegrationLogo icon={siGoogledrive} />);
    const path = container.querySelector('path');
    expect(path).toBeInTheDocument();
    const d = path.getAttribute('d');
    expect(d).toBeTruthy();
    expect(d.startsWith('M')).toBe(true);
  });

  it('renders the Notion icon with its own brand fill color', () => {
    const { container } = render(<IntegrationLogo icon={siNotion} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('fill', `#${siNotion.hex}`);
    const path = container.querySelector('path');
    expect(path.getAttribute('d')).toBe(siNotion.path);
  });

  it('colorOverride wins over the icon default hex', () => {
    const { container } = render(
      <IntegrationLogo icon={siGoogledrive} colorOverride="#111827" />
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('fill', '#111827');
  });
});
