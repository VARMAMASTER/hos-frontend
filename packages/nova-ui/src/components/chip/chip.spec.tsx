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

  it('is the prototype .chip: an 11.5px semibold pill padded 8 x 2, 6px between its parts', () => {
    render(<Chip tone="warn">Warning</Chip>);
    const chip = screen.getByText('Warning');
    expect([...chip.classList]).toEqual(
      expect.arrayContaining([
        'rounded-full',
        'px-2',
        'py-0.5',
        'gap-1.5',
        'whitespace-nowrap',
        'text-[11.5px]',
        'font-semibold',
      ]),
    );
    expect(chip.className).not.toMatch(/text-xs|shadow|corner-shape/);
  });
});
