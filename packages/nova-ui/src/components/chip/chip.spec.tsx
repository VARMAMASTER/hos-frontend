import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

  it('is the prototype .chip: the caption role semibold, the chip corner, the chip padding and gap', () => {
    render(<Chip tone="warn">Warning</Chip>);
    const chip = screen.getByText('Warning');
    expect([...chip.classList]).toEqual(
      expect.arrayContaining([
        'rounded-chip',
        'px-chip',
        'py-chip',
        'gap-chip',
        'whitespace-nowrap',
        'text-caption',
        'font-semibold',
      ]),
    );
    expect(chip.className).not.toMatch(/text-xs|shadow|corner-shape/);
  });
});

describe('Chip slots', () => {
  it('shows an optional leading icon, hidden from assistive technology, before the label', () => {
    render(
      <Chip icon={<svg data-testid="glyph" />} tone="good">
        Filed
      </Chip>,
    );
    const slot = screen.getByTestId('glyph').parentElement as HTMLElement;
    expect(slot.getAttribute('aria-hidden')).toBe('true');
    const chip = slot.parentElement as HTMLElement;
    expect(chip.firstElementChild).toBe(slot);
    expect(chip.textContent).toBe('Filed');
  });

  it('shows an optional leading avatar, which is not hidden, so a named avatar stays announced', () => {
    render(<Chip avatar={<img alt="Dr Rao" src="rao.png" />}>Cardiology</Chip>);
    const image = screen.getByRole('img', { name: 'Dr Rao' });
    expect(image.parentElement?.getAttribute('aria-hidden')).toBeNull();
    expect(image.parentElement?.dataset['slot']).toBe('avatar');
  });

  it('keeps a plain chip a non-interactive span', () => {
    render(<Chip>Pending</Chip>);
    const chip = screen.getByText('Pending');
    expect(chip.tagName).toBe('SPAN');
    expect(screen.queryByRole('button')).toBeNull();
    expect(chip.getAttribute('tabindex')).toBeNull();
  });
});

describe('Chip selected', () => {
  it('marks a selected chip with a tick and a spoken word, never colour alone', () => {
    const { container } = render(<Chip selected>Cardiology</Chip>);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.dataset['selected']).toBe('true');
    expect(chip.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(chip.textContent).toMatch(/selected/i);
  });

  it('shows nothing selected by default', () => {
    render(<Chip>Cardiology</Chip>);
    const chip = screen.getByText('Cardiology');
    expect(chip.dataset['selected']).toBeUndefined();
    expect(chip.querySelector('svg')).toBeNull();
  });
});

describe('Chip as an input chip (removable)', () => {
  it('gets a remove button named after the chip text', () => {
    render(<Chip onRemove={() => undefined}>Cardiology</Chip>);
    const remove = screen.getByRole('button', { name: 'Remove Cardiology' });
    expect(remove.getAttribute('type')).toBe('button');
    expect(remove.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('lets a caller name the removal when the label is not plain text', () => {
    render(
      <Chip onRemove={() => undefined} removeLabel="Remove ward filter">
        <b>ICU</b>
      </Chip>,
    );
    expect(
      screen.getByRole('button', { name: 'Remove ward filter' }),
    ).toBeTruthy();
  });

  it('calls onRemove when the remove button is clicked', () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Cardiology</Chip>);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Cardiology' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('is a labelled, focusable group, so Backspace and Delete can act on it', () => {
    render(<Chip onRemove={() => undefined}>Cardiology</Chip>);
    const chip = screen.getByRole('group', { name: 'Cardiology' });
    expect(chip.getAttribute('tabindex')).toBe('0');
  });

  it.each(['Backspace', 'Delete'])('removes on %s while focused', (key) => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Cardiology</Chip>);
    const chip = screen.getByRole('group', { name: 'Cardiology' });
    fireEvent.keyDown(chip, { key });
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys, and a key typed with a modifier', () => {
    const onRemove = vi.fn();
    render(<Chip onRemove={onRemove}>Cardiology</Chip>);
    const chip = screen.getByRole('group', { name: 'Cardiology' });
    fireEvent.keyDown(chip, { key: 'a' });
    fireEvent.keyDown(chip, { key: 'Enter' });
    fireEvent.keyDown(chip, { key: 'Backspace', metaKey: true });
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('keeps the remove button one tab stop with the chip, not a second', () => {
    render(<Chip onRemove={() => undefined}>Cardiology</Chip>);
    expect(
      screen
        .getByRole('button', { name: 'Remove Cardiology' })
        .getAttribute('tabindex'),
    ).toBe('-1');
  });

  it('names a selected input chip as selected too', () => {
    render(
      <Chip onRemove={() => undefined} selected>
        Cardiology
      </Chip>,
    );
    expect(
      screen.getByRole('group', { name: 'Cardiology, selected' }),
    ).toBeTruthy();
  });

  it('gives the remove button at least a 24px target', () => {
    render(<Chip onRemove={() => undefined}>Cardiology</Chip>);
    expect(
      screen.getByRole('button', { name: 'Remove Cardiology' }).classList,
    ).toContain('size-touch-sm');
  });

  it('changes colour only under motion-safe, so reduced motion is instant', () => {
    render(<Chip onRemove={() => undefined}>Cardiology</Chip>);
    const remove = screen.getByRole('button', { name: 'Remove Cardiology' });
    expect(remove.className).toMatch(/motion-safe:transition-colors/);
    expect(remove.className).not.toMatch(/(^|\s)transition-/);
  });
});
