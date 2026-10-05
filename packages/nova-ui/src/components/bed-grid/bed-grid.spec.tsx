import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { BedGrid, type Bed, type BedStatus } from './bed-grid';

afterEach(() => cleanup());

// What a screen reader hears for a cell: its one non-hidden text.
function readout(cell: HTMLElement): string | null | undefined {
  return cell.querySelector('.sr-only')?.textContent;
}

const beds: Bed[] = [
  {
    id: 'b12',
    label: '12',
    status: 'occupied',
    patient: 'Ramesh',
    ward: 'Ward A',
  },
  { id: 'b13', label: '13', status: 'free', ward: 'Ward A' },
  { id: 'b14', label: '14', status: 'cleaning', ward: 'Ward A' },
  { id: 'b15', label: '15', status: 'blocked', ward: 'Ward A' },
];

describe('BedGrid', () => {
  it('is a list with the name it was given', () => {
    render(<BedGrid beds={beds} ariaLabel="Ward A beds" />);
    const list = screen.getByRole('list', { name: 'Ward A beds' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('keeps the beds in the order given', () => {
    render(<BedGrid beds={beds} ariaLabel="Beds" />);
    expect(screen.getAllByRole('listitem').map(readout)).toEqual([
      'Bed 12, occupied, Ramesh, Ward A',
      'Bed 13, free, Ward A',
      'Bed 14, cleaning, Ward A',
      'Bed 15, blocked, Ward A',
    ]);
  });

  describe('without onSelect', () => {
    it('renders plain list items, not buttons', () => {
      render(<BedGrid beds={beds} ariaLabel="Beds" />);
      expect(screen.queryAllByRole('button')).toHaveLength(0);
      expect(screen.getAllByRole('listitem')).toHaveLength(4);
    });

    it('reads out as bed, status and ward, in that order', () => {
      render(
        <BedGrid
          beds={[
            { id: 'b12', label: '12', status: 'occupied', ward: 'Ward A' },
          ]}
          ariaLabel="Beds"
        />,
      );
      expect(readout(screen.getByRole('listitem'))).toBe(
        'Bed 12, occupied, Ward A',
      );
    });

    it('hides the visual layer, so a screen reader hears the phrase once and not the fragments too', () => {
      render(
        <BedGrid
          beds={[
            { id: 'b12', label: '12', status: 'occupied', ward: 'Ward A' },
          ]}
          ariaLabel="Beds"
        />,
      );
      const cell = screen.getByRole('listitem');
      const visual = cell.querySelector('[aria-hidden="true"]');
      expect(visual?.textContent).toContain('occupied');
      expect(visual?.textContent).toContain('Ward A');
      const spoken = [...cell.children].filter(
        (child) => child.getAttribute('aria-hidden') !== 'true',
      );
      expect(spoken.map((child) => child.textContent)).toEqual([
        'Bed 12, occupied, Ward A',
      ]);
    });
  });

  describe('with onSelect', () => {
    it('renders each bed as a button whose name has its label, status and ward', () => {
      render(
        <BedGrid
          beds={[
            { id: 'b12', label: '12', status: 'occupied', ward: 'Ward A' },
          ]}
          onSelect={() => undefined}
          ariaLabel="Beds"
        />,
      );
      expect(
        screen.getByRole('button', { name: 'Bed 12, occupied, Ward A' }),
      ).toBeTruthy();
    });

    it('calls onSelect with the bed id', () => {
      const onSelect = vi.fn();
      render(<BedGrid beds={beds} onSelect={onSelect} ariaLabel="Beds" />);
      fireEvent.click(screen.getByRole('button', { name: /^Bed 13, free/ }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith('b13');
    });

    it('never submits a surrounding form', () => {
      render(
        <form>
          <BedGrid beds={beds} onSelect={() => undefined} ariaLabel="Beds" />
        </form>,
      );
      expect(
        screen
          .getAllByRole('button')
          .every((button) => button.getAttribute('type') === 'button'),
      ).toBe(true);
    });

    it('keeps the buttons inside list items, so the board is still a list', () => {
      render(
        <BedGrid beds={beds} onSelect={() => undefined} ariaLabel="Beds" />,
      );
      expect(screen.getAllByRole('listitem')).toHaveLength(4);
      expect(screen.getAllByRole('button')).toHaveLength(4);
    });
  });

  describe('status is never carried by colour alone', () => {
    it.each(['free', 'occupied', 'cleaning', 'blocked'] as const)(
      'a %s bed says so in words and reads it out',
      (status) => {
        render(
          <BedGrid
            beds={[{ id: 'x', label: '7', status, ward: 'Ward B' }]}
            onSelect={() => undefined}
            ariaLabel="Beds"
          />,
        );
        const cell = screen.getByRole('button');
        expect(cell.closest('li')?.dataset['status']).toBe(status);
        const word = within(cell).getByText(status);
        // visible text, not a screen-reader-only aside
        expect(word.classList.contains('sr-only')).toBe(false);
        expect(cell.getAttribute('aria-label')).toBeNull();
        expect(
          screen.getByRole('button', { name: `Bed 7, ${status}, Ward B` }),
        ).toBe(cell);
      },
    );

    it('gives every status a different look', () => {
      render(<BedGrid beds={beds} ariaLabel="Beds" />);
      const looks = screen
        .getAllByRole('listitem')
        .map((cell) => cell.className);
      expect(new Set(looks).size).toBe(4);
    });

    it('draws a blocked bed with a dashed border, a cue that is not a colour', () => {
      render(
        <BedGrid
          beds={[{ id: 'x', label: '9', status: 'blocked' }]}
          ariaLabel="Beds"
        />,
      );
      expect(
        screen.getByRole('listitem').classList.contains('border-dashed'),
      ).toBe(true);
    });
  });

  describe('patients', () => {
    it('shows and reads out the patient of an occupied bed', () => {
      render(
        <BedGrid beds={beds} onSelect={() => undefined} ariaLabel="Beds" />,
      );
      expect(screen.getByText('Ramesh')).toBeTruthy();
      expect(
        screen.getByRole('button', {
          name: 'Bed 12, occupied, Ramesh, Ward A',
        }),
      ).toBeTruthy();
    });

    it('does not announce a patient on a free bed', () => {
      render(
        <BedGrid
          beds={[{ id: 'b13', label: '13', status: 'free', ward: 'Ward A' }]}
          onSelect={() => undefined}
          ariaLabel="Beds"
        />,
      );
      const cell = screen.getByRole('button', { name: 'Bed 13, free, Ward A' });
      expect(cell.textContent).not.toMatch(/patient/i);
    });

    it('does not announce a patient on a free bed, even when stale data supplies one', () => {
      render(
        <BedGrid
          beds={[
            {
              id: 'b13',
              label: '13',
              status: 'free',
              ward: 'Ward A',
              patient: 'Ramesh',
            },
          ]}
          onSelect={() => undefined}
          ariaLabel="Beds"
        />,
      );
      const cell = screen.getByRole('button', { name: 'Bed 13, free, Ward A' });
      expect(cell.textContent).not.toContain('Ramesh');
    });

    it.each(['free', 'cleaning', 'blocked'] as const)(
      'never shows a patient name on a %s bed, even when stale data supplies one',
      (status: Exclude<BedStatus, 'occupied'>) => {
        render(
          <BedGrid
            beds={[{ id: 'x', label: '3', status, patient: 'Ramesh' }]}
            onSelect={() => undefined}
            ariaLabel="Beds"
          />,
        );
        expect(screen.queryByText('Ramesh')).toBeNull();
        expect(
          screen.getByRole('button', { name: `Bed 3, ${status}` }),
        ).toBeTruthy();
      },
    );

    it('reads an occupied bed with no named patient without inventing one', () => {
      render(
        <BedGrid
          beds={[{ id: 'x', label: '3', status: 'occupied' }]}
          onSelect={() => undefined}
          ariaLabel="Beds"
        />,
      );
      expect(
        screen.getByRole('button', { name: 'Bed 3, occupied' }),
      ).toBeTruthy();
    });
  });

  it('leaves the ward out of the name when the bed has none', () => {
    render(
      <BedGrid
        beds={[{ id: 'x', label: '3', status: 'free' }]}
        onSelect={() => undefined}
        ariaLabel="Beds"
      />,
    );
    expect(screen.getByRole('button', { name: 'Bed 3, free' })).toBeTruthy();
  });

  it('lays the cells out as a responsive grid', () => {
    render(<BedGrid beds={beds} ariaLabel="Beds" />);
    const list = screen.getByRole('list');
    expect(list.classList.contains('grid')).toBe(true);
    expect(
      [...list.classList].some((c) =>
        c.startsWith('grid-cols-[repeat(auto-fill'),
      ),
    ).toBe(true);
  });

  it('builds every cell on the opaque data surface, so clinical status stays legible under glass', () => {
    render(<BedGrid beds={beds} ariaLabel="Beds" />);
    for (const cell of screen.getAllByRole('listitem')) {
      expect(cell.dataset['surface']).toBe('data');
      expect(cell.classList.contains('nova-data')).toBe(true);
    }
  });

  it('keeps the same surface and status on the list item when the cell is a button', () => {
    render(<BedGrid beds={beds} onSelect={() => undefined} ariaLabel="Beds" />);
    const [first] = screen.getAllByRole('listitem');
    expect(first.dataset['surface']).toBe('data');
    expect(first.dataset['status']).toBe('occupied');
  });

  it('merges a caller className onto the list', () => {
    render(<BedGrid beds={beds} ariaLabel="Beds" className="mt-4" />);
    expect(screen.getByRole('list').classList.contains('mt-4')).toBe(true);
  });
});
