import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  ModuleSwitcher,
  type ModuleOption,
  type ModuleSwitcherProps,
} from './module-switcher';

afterEach(() => cleanup());

const modules: ModuleOption[] = [
  { id: 'reception', label: 'Reception', group: 'Clinical', keywords: ['OPD'] },
  { id: 'doctor', label: 'Doctor', group: 'Clinical' },
  {
    id: 'ipd',
    label: 'IPD',
    group: 'Clinical',
    description: 'In-patients',
  },
  { id: 'ot', label: 'Operation Theatre', group: 'Clinical', disabled: true },
  {
    id: 'billing',
    label: 'Billing',
    group: 'Money',
    badge: 3,
    badgeLabel: '3 claims waiting',
  },
  { id: 'pharmacy', label: 'Pharmacy', group: 'Money', href: '#pharmacy' },
  { id: 'workforce', label: 'AI Workforce', group: 'Intelligence', ai: true },
  { id: 'superadmin', label: 'Super Admin', group: 'Settings', hidden: true },
];

type Overrides = Partial<
  Omit<ModuleSwitcherProps, 'open' | 'onOpenChange' | 'onSelect'>
> & { initialOpen?: boolean };

// A real parent: it owns `open` and the current module, as a shell would.
function Harness({
  initialOpen = false,
  onSelect,
  onOpenChange,
  current: initialCurrent = 'billing',
  ...rest
}: Overrides & {
  onSelect?: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [current, setCurrent] = useState(initialCurrent);
  return (
    <ModuleSwitcher
      modules={modules}
      {...rest}
      current={current}
      open={open}
      onOpenChange={(next) => {
        onOpenChange?.(next);
        setOpen(next);
      }}
      onSelect={(id) => {
        onSelect?.(id);
        setCurrent(id);
      }}
    />
  );
}

function trigger(): HTMLElement {
  return screen.getByRole('button', { name: /Current module/ });
}

function press(
  key: string,
  target: Element = document.activeElement as Element,
) {
  fireEvent.keyDown(target, { key });
}

function item(name: RegExp | string): HTMLElement {
  return screen.getByRole('menuitemradio', { name });
}

function filter(): HTMLInputElement {
  return screen.getByRole('searchbox', {
    name: 'Filter modules',
  }) as HTMLInputElement;
}

function type(text: string) {
  fireEvent.change(filter(), { target: { value: text } });
}

function labels(): string[] {
  return screen
    .getAllByRole('menuitemradio')
    .map((el) => el.getAttribute('data-module') ?? '');
}

describe('ModuleSwitcher trigger', () => {
  it('shows the current module and tells assistive technology which one it is', () => {
    render(<Harness />);
    const button = trigger();
    expect(button.textContent).toContain('Billing');
    expect(
      screen.getByRole('button', { name: 'Current module: Billing' }),
    ).toBe(button);
  });

  it('shows the current module icon, or its monogram when it has none', () => {
    const { unmount } = render(
      <Harness
        modules={[
          {
            id: 'billing',
            label: 'Billing',
            icon: <svg data-testid="glyph" />,
          },
        ]}
      />,
    );
    expect(within(trigger()).getByTestId('glyph')).toBeTruthy();
    unmount();
    render(<Harness />);
    expect(trigger().querySelector('[data-module-glyph]')?.textContent).toBe(
      'Bi',
    );
  });

  it('labels the trigger as a module switcher, not a workspace', () => {
    render(<Harness />);
    expect(within(trigger()).getByText('Module')).toBeTruthy();
    expect(trigger().textContent).not.toMatch(/workspace/i);
  });

  it('carries aria-haspopup="menu" and reports whether it is expanded', () => {
    render(<Harness />);
    const button = trigger();
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('points aria-controls at the menu only while the menu exists', () => {
    render(<Harness />);
    const button = trigger();
    expect(button.getAttribute('aria-controls')).toBeNull();
    fireEvent.click(button);
    const controls = button.getAttribute('aria-controls');
    expect(document.getElementById(controls ?? '')).toBe(
      screen.getByRole('menu'),
    );
  });

  it('never submits a surrounding form', () => {
    render(
      <form>
        <Harness />
      </form>,
    );
    expect(trigger().getAttribute('type')).toBe('button');
  });

  it('asks the parent to open on press, and leaves the decision to it', () => {
    const onOpenChange = vi.fn();
    render(
      <ModuleSwitcher
        modules={modules}
        current="billing"
        open={false}
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('shows a prompt when the current module is not among the modules', () => {
    render(<Harness current="gone" />);
    expect(trigger().textContent).toContain('Choose a module');
  });

  it('does not offer a module the user may not see, even as the current one', () => {
    render(<Harness current="superadmin" />);
    expect(trigger().textContent).not.toContain('Super Admin');
  });
});

describe('ModuleSwitcher without a parent-owned open state', () => {
  it('opens and closes itself, and reports the change when asked to', () => {
    const onOpenChange = vi.fn();
    render(
      <ModuleSwitcher
        modules={modules}
        current="billing"
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(trigger());
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    press('Escape');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(document.activeElement).toBe(trigger());
  });

  it('can start open, and works without an onSelect', () => {
    render(<ModuleSwitcher modules={modules} current="billing" defaultOpen />);
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.click(item(/Doctor/));
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('ModuleSwitcher menu', () => {
  it('is a menu named by the trigger', () => {
    render(<Harness initialOpen />);
    const menu = screen.getByRole('menu');
    expect(menu.getAttribute('aria-labelledby')).toBe(trigger().id);
  });

  it('groups its modules under a visible group label, in the order given', () => {
    render(<Harness initialOpen />);
    expect(screen.getAllByRole('group').map((g) => g.textContent)).toEqual([
      expect.stringContaining('Clinical'),
      expect.stringContaining('Money'),
      expect.stringContaining('Intelligence'),
    ]);
    const clinical = screen.getByRole('group', { name: 'Clinical' });
    expect(within(clinical).getAllByRole('menuitemradio')).toHaveLength(4);
    expect(
      within(clinical).getByText('Clinical').classList.contains('sr-only'),
    ).toBe(false);
  });

  it('uses menuitemradio items and marks the current module aria-checked, and no other', () => {
    render(<Harness initialOpen />);
    const checked = screen
      .getAllByRole('menuitemradio')
      .filter((el) => el.getAttribute('aria-checked') === 'true');
    expect(checked).toEqual([item(/Billing/)]);
  });

  it('also ticks the current module on screen and sets it in bold', () => {
    render(<Harness initialOpen />);
    const tick = item(/Billing/).querySelector('[data-tick]');
    expect(tick?.getAttribute('aria-hidden')).toBe('true');
    expect(item(/Billing/).classList.contains('font-semibold')).toBe(true);
    expect(item(/Doctor/).querySelector('[data-tick]')).toBeNull();
    expect(item(/Doctor/).classList.contains('font-semibold')).toBe(false);
  });

  it('shows a description beside the label, and a badge with its accessible text', () => {
    render(<Harness initialOpen />);
    expect(within(item(/IPD/)).getByText('In-patients')).toBeTruthy();
    const billing = item(/Billing/);
    expect(billing.textContent).toContain('3');
    expect(
      within(billing)
        .getByText('3 claims waiting')
        .classList.contains('sr-only'),
    ).toBe(true);
    expect(billing.querySelector('[data-badge-visible]')?.textContent).toBe(
      '3',
    );
    expect(
      billing
        .querySelector('[data-badge-visible]')
        ?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('renders a module with an href as a link that stays in the menu pattern', () => {
    render(<Harness initialOpen />);
    const link = item(/Pharmacy/);
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('#pharmacy');
    expect(link.getAttribute('tabindex')).toBe('-1');
  });

  it('marks an AI module with the AI tile, not by colour alone', () => {
    render(<Harness initialOpen />);
    expect(
      item(/AI Workforce/)
        .querySelector('[data-module-glyph]')
        ?.getAttribute('data-tone'),
    ).toBe('ai');
  });

  it('keeps an unavailable module in the menu, announced as disabled, with no link', () => {
    render(<Harness initialOpen />);
    expect(item(/Operation Theatre/).getAttribute('aria-disabled')).toBe(
      'true',
    );
  });

  it('does not render a module the user lacks permission for at all', () => {
    render(<Harness initialOpen recent={['superadmin']} />);
    expect(screen.queryByText('Super Admin')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Settings' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Recent' })).toBeNull();
    type('super');
    expect(screen.queryByText('Super Admin')).toBeNull();
  });

  it('shows the hint when given one, and nothing when not', () => {
    const { unmount } = render(
      <Harness initialOpen hint={<span>Switch module</span>} />,
    );
    expect(screen.getByText('Switch module')).toBeTruthy();
    unmount();
    render(<Harness initialOpen />);
    expect(screen.queryByText('Switch module')).toBeNull();
  });

  it('is an overlay surface', () => {
    render(<Harness initialOpen />);
    expect(
      screen
        .getByRole('menu')
        .parentElement?.classList.contains('nova-overlay'),
    ).toBe(true);
  });
});

describe('ModuleSwitcher recent modules', () => {
  it('lists recent modules first, in the order given, each once', () => {
    render(<Harness initialOpen recent={['pharmacy', 'doctor']} />);
    const groups = screen.getAllByRole('group');
    expect(groups[0]?.getAttribute('aria-labelledby')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Recent' })).toBe(groups[0]);
    expect(
      within(groups[0] as HTMLElement)
        .getAllByRole('menuitemradio')
        .map((el) => el.getAttribute('data-module')),
    ).toEqual(['pharmacy', 'doctor']);
    expect(
      screen.getAllByRole('menuitemradio', { name: /Doctor/ }),
    ).toHaveLength(1);
    expect(labels()).toEqual([
      'pharmacy',
      'doctor',
      'reception',
      'ipd',
      'ot',
      'billing',
      'workforce',
    ]);
  });

  it('ignores a recent id that is unknown, and shows no group when none is left', () => {
    render(<Harness initialOpen recent={['nope']} />);
    expect(screen.queryByRole('group', { name: 'Recent' })).toBeNull();
  });

  it('drops the recent group while filtering, so results keep their own groups', () => {
    render(<Harness initialOpen recent={['pharmacy']} />);
    type('pharm');
    expect(screen.queryByRole('group', { name: 'Recent' })).toBeNull();
    expect(
      within(screen.getByRole('group', { name: 'Money' })).getByRole(
        'menuitemradio',
        { name: /Pharmacy/ },
      ),
    ).toBeTruthy();
  });

  it('names the group from recentLabel', () => {
    render(<Harness initialOpen recent={['doctor']} recentLabel="Last used" />);
    expect(screen.getByRole('group', { name: 'Last used' })).toBeTruthy();
  });
});

describe('ModuleSwitcher type-to-filter', () => {
  it('has a labelled search box inside the menu surface', () => {
    render(<Harness initialOpen />);
    expect(screen.getByRole('menu').parentElement?.contains(filter())).toBe(
      true,
    );
    expect(filter().getAttribute('autocomplete')).toBe('off');
  });

  it('filters the list as the user types, case-insensitively', () => {
    render(<Harness initialOpen />);
    type('PHAR');
    expect(labels()).toEqual(['pharmacy']);
    type('o');
    expect(labels()).toEqual(['reception', 'doctor', 'ot', 'workforce']);
  });

  it('matches keywords and descriptions as well as labels', () => {
    render(<Harness initialOpen />);
    type('opd');
    expect(labels()).toEqual(['reception']);
    type('in-pat');
    expect(labels()).toEqual(['ipd']);
  });

  it('hides a group when none of its modules match', () => {
    render(<Harness initialOpen />);
    type('bill');
    expect(screen.queryByRole('group', { name: 'Clinical' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Money' })).toBeTruthy();
  });

  it('says so when no module matches, and tells assistive technology', () => {
    render(<Harness initialOpen />);
    type('zzz');
    expect(screen.queryAllByRole('menuitemradio')).toHaveLength(0);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('No modules match');
    expect(status.textContent).toContain('zzz');
  });

  it('announces how many modules match while filtering', () => {
    render(<Harness initialOpen />);
    expect(screen.getByRole('status').textContent).toBe('');
    type('o');
    expect(screen.getByRole('status').textContent).toBe('4 modules');
    type('bill');
    expect(screen.getByRole('status').textContent).toBe('1 module');
  });

  it('clears the filter when the menu closes', () => {
    render(<Harness initialOpen />);
    type('bill');
    press('Escape');
    fireEvent.click(trigger());
    expect(filter().value).toBe('');
    expect(screen.getAllByRole('menuitemradio').length).toBeGreaterThan(1);
  });

  it('moves into the list with ArrowDown from the search box, and to the last item with ArrowUp', () => {
    render(<Harness initialOpen />);
    type('o');
    filter().focus();
    press('ArrowDown');
    expect(document.activeElement).toBe(item(/Reception/));
    filter().focus();
    press('ArrowUp');
    expect(document.activeElement).toBe(item(/AI Workforce/));
  });

  it('selects the first available match on Enter in the search box', () => {
    const onSelect = vi.fn();
    render(<Harness initialOpen onSelect={onSelect} />);
    type('operation');
    filter().focus();
    // The only match is disabled: Enter must not choose it.
    press('Enter');
    expect(onSelect).not.toHaveBeenCalled();
    type('pharm');
    press('Enter');
    expect(onSelect).toHaveBeenCalledWith('pharmacy');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('returns focus from a typed character on an item to the search box, with the character', () => {
    render(<Harness initialOpen />);
    expect(document.activeElement).toBe(item(/Billing/));
    press('p');
    expect(document.activeElement).toBe(filter());
    expect(filter().value).toBe('p');
    expect(labels()).toContain('pharmacy');
  });

  it('does not treat Space or a shortcut chord on an item as typing', () => {
    render(<Harness initialOpen />);
    fireEvent.keyDown(item(/Billing/), { key: 'c', ctrlKey: true });
    expect(document.activeElement).toBe(item(/Billing/));
    expect(filter().value).toBe('');
  });

  it('steps up from the first item to the search box', () => {
    render(<Harness initialOpen />);
    press('Home');
    press('ArrowUp');
    expect(document.activeElement).toBe(filter());
  });

  it('closes on Escape from the search box and returns focus to the trigger', () => {
    render(<Harness initialOpen />);
    filter().focus();
    press('Escape');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('keeps the menu open while focus moves between the search box and the items', () => {
    render(<Harness initialOpen />);
    act(() => filter().focus());
    act(() => item(/Doctor/).focus());
    expect(screen.getByRole('menu')).toBeTruthy();
  });
});

describe('ModuleSwitcher selecting', () => {
  it('calls onSelect with the id, closes the menu and returns focus to the trigger', () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Harness initialOpen onSelect={onSelect} onOpenChange={onOpenChange} />,
    );
    fireEvent.click(item(/Doctor/));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('doctor');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Current module: Doctor' }),
    );
  });

  it("runs the module's own onSelect before the switcher's", () => {
    const calls: string[] = [];
    render(
      <Harness
        initialOpen
        modules={[
          { id: 'a', label: 'Alpha', onSelect: () => calls.push('module') },
          { id: 'b', label: 'Beta' },
        ]}
        current="b"
        onSelect={() => calls.push('switcher')}
      />,
    );
    fireEvent.click(item(/Alpha/));
    expect(calls).toEqual(['module', 'switcher']);
  });

  it('follows a link module through its anchor, once, and still reports the choice', () => {
    const onSelect = vi.fn();
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
    document.addEventListener('click', onClick);
    render(<Harness initialOpen onSelect={onSelect} />);
    fireEvent.click(item(/Pharmacy/));
    document.removeEventListener('click', onClick);
    expect(onSelect).toHaveBeenCalledWith('pharmacy');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('selects the focused item on Enter', () => {
    const onSelect = vi.fn();
    render(<Harness initialOpen onSelect={onSelect} />);
    press('Home');
    press('ArrowDown');
    press('Enter');
    expect(onSelect).toHaveBeenCalledWith('doctor');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('selects the focused item on Space', () => {
    const onSelect = vi.fn();
    render(<Harness initialOpen onSelect={onSelect} />);
    press('Home');
    press(' ');
    expect(onSelect).toHaveBeenCalledWith('reception');
  });

  it('does not select, or close, on a disabled module', () => {
    const onSelect = vi.fn();
    render(<Harness initialOpen onSelect={onSelect} />);
    const disabled = item(/Operation Theatre/);
    fireEvent.click(disabled);
    fireEvent.keyDown(disabled, { key: 'Enter' });
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('reports the current module again when it is picked again', () => {
    const onSelect = vi.fn();
    render(<Harness initialOpen onSelect={onSelect} />);
    fireEvent.click(item(/Billing/));
    expect(onSelect).toHaveBeenCalledWith('billing');
  });
});

describe('ModuleSwitcher keyboard', () => {
  it('opens on Enter or Space (a native button click) and lands on the current module', () => {
    render(<Harness />);
    fireEvent.click(trigger());
    expect(document.activeElement).toBe(item(/Billing/));
  });

  it('opens on ArrowDown from the trigger and focuses the current module', () => {
    render(<Harness />);
    trigger().focus();
    press('ArrowDown');
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(document.activeElement).toBe(item(/Billing/));
  });

  it('opens on ArrowUp from the trigger and focuses the last module', () => {
    render(<Harness />);
    trigger().focus();
    press('ArrowUp');
    expect(document.activeElement).toBe(item(/AI Workforce/));
  });

  it('moves focus with the arrow keys, wraps, and jumps with Home and End', () => {
    render(<Harness initialOpen />);
    press('ArrowDown');
    expect(document.activeElement).toBe(item(/Pharmacy/));
    press('End');
    expect(document.activeElement).toBe(item(/AI Workforce/));
    press('ArrowDown');
    expect(document.activeElement).toBe(item(/Reception/));
    press('ArrowUp');
    expect(document.activeElement).toBe(filter());
  });

  it('keeps a disabled module reachable by arrow, so it is discoverable', () => {
    render(<Harness initialOpen />);
    press('Home');
    press('ArrowDown');
    press('ArrowDown');
    press('ArrowDown');
    expect(document.activeElement).toBe(item(/Operation Theatre/));
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const onOpenChange = vi.fn();
    render(<Harness initialOpen onOpenChange={onOpenChange} />);
    press('Escape');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(document.activeElement).toBe(trigger());
  });

  it('does not let an Escape it handled reach a parent dialog', () => {
    const parentKeyDown = vi.fn();
    render(
      <div onKeyDown={parentKeyDown}>
        <Harness initialOpen />
      </div>,
    );
    press('Escape');
    expect(parentKeyDown).not.toHaveBeenCalled();
  });

  it('closes on Tab and keeps focus on the trigger', () => {
    render(<Harness initialOpen />);
    press('Tab');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes on a press outside', () => {
    render(
      <>
        <Harness initialOpen />
        <input aria-label="Search patients" />
      </>,
    );
    const search = screen.getByLabelText('Search patients');
    act(() => search.focus());
    fireEvent.pointerDown(search);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(search);
  });

  it('keeps items out of the tab order, so Tab does not walk the menu', () => {
    render(<Harness initialOpen />);
    for (const el of screen.getAllByRole('menuitemradio')) {
      expect(el.getAttribute('tabindex')).toBe('-1');
    }
  });
});

describe('ModuleSwitcher attributes', () => {
  it('merges a caller className and passes other attributes to the root', () => {
    render(<Harness className="w-60" data-testid="root" />);
    const root = screen.getByTestId('root');
    expect(root.classList.contains('w-60')).toBe(true);
    expect(root.contains(trigger())).toBe(true);
  });
});

// Tokens only: the trigger is the chrome's nav row; a module row is a menu row (8px all round, the
// control corner, the dense UI type) with the .ic tile.
describe('ModuleSwitcher tokens', () => {
  it('draws the trigger and the rows from tokens', () => {
    render(<Harness initialOpen />);
    expect([...trigger().classList]).toEqual(
      expect.arrayContaining([
        'px-nav-item',
        'py-nav-item',
        'gap-s3',
        'rounded-card',
      ]),
    );
    const row = item(/Billing/);
    expect([...row.classList]).toEqual(
      expect.arrayContaining([
        'p-s3',
        'gap-s3',
        'rounded-control',
        'text-control',
      ]),
    );
    const tile = row.querySelector('[data-module-glyph]') as HTMLElement;
    expect([...tile.classList]).toEqual(
      expect.arrayContaining([
        'size-tile',
        'text-badge',
        'tracking-initials',
        '[&_svg]:size-icon-tile',
      ]),
    );
  });
});
