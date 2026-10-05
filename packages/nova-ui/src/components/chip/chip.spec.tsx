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
});
