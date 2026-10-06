import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Chip } from './chip';

afterEach(() => cleanup());

describe('Chip', () => {
  it('renders its label with the neutral tone by default', () => {
    render(<Chip>Pending</Chip>);
    expect(screen.getByText('Pending').dataset['tone']).toBe('neutral');
  });

  it.each(['good', 'warn', 'crit', 'info', 'ai'] as const)(
    'exposes the %s tone',
    (tone) => {
      render(<Chip tone={tone}>{tone}</Chip>);
      expect(screen.getByText(tone).dataset['tone']).toBe(tone);
    },
  );

  it('is a caption-size pill with the 8 x 2 padding and a 600 label', () => {
    render(<Chip tone="warn">Warning</Chip>);
    const chip = screen.getByText('Warning');
    expect([...chip.classList]).toEqual(
      expect.arrayContaining([
        'rounded-full',
        '[corner-shape:round]',
        'px-2',
        'py-0.5',
        'text-caption',
        'font-semibold',
      ]),
    );
    expect(chip.className).not.toMatch(/text-xs|shadow/);
  });
});
