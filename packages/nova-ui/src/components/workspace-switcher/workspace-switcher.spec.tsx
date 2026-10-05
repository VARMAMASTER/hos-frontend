import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import {
  WorkspaceSwitcher,
  type WorkspaceGroup,
  type WorkspaceOption,
  type WorkspaceSwitcherProps,
} from './workspace-switcher';

afterEach(() => cleanup());

const groups: WorkspaceGroup[] = [
  {
    label: 'Hospitals',
    items: [
      { id: 'sv', name: 'Sri Venkateshwara Hospital', label: 'Kukatpally' },
      { id: 'kr', name: 'Krishna Hospital', label: 'Vijayawada' },
      { id: 'vs', name: 'Vasavi Hospital', disabled: true },
    ],
  },
  {
    label: 'Units',
    items: [
      { id: 'icu', name: 'ICU' },
      { id: 'ot', name: 'Operation Theatre' },
    ],
  },
];

const current = { id: 'kr', name: 'Krishna Hospital', label: 'Vijayawada' };

type Overrides = Partial<
  Omit<WorkspaceSwitcherProps, 'open' | 'onOpenChange' | 'onSelect'>
> & { initialOpen?: boolean };

// A real parent: it owns `open`, as the component requires, and mirrors the spies.
function Harness({
  initialOpen = false,
  onSelect,
  onOpenChange,
  ...rest
}: Overrides & {
  onSelect?: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <WorkspaceSwitcher
      current={current}
      groups={groups}
      {...rest}
      open={open}
      onOpenChange={(next) => {
        onOpenChange?.(next);
        setOpen(next);
      }}
      onSelect={(id) => onSelect?.(id)}
    />
  );
}

function trigger(): HTMLElement {
  return screen.getByRole('button', { name: /Current workspace/ });
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

describe('WorkspaceSwitcher trigger', () => {
  it('shows the current workspace and tells assistive technology which one it is', () => {
    render(<Harness />);
    const button = trigger();
    expect(button.textContent).toContain('Krishna Hospital');
    expect(button.textContent).toContain('Vijayawada');
    expect(
      screen.getByRole('button', {
        name: 'Current workspace: Krishna Hospital Vijayawada',
      }),
    ).toBe(button);
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
    expect(controls).toBeTruthy();
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

  it('shows no menu while closed', () => {
    render(<Harness />);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('asks the parent to open on press, and leaves the decision to it', () => {
    const onOpenChange = vi.fn();
    render(
      <WorkspaceSwitcher
        current={current}
        groups={groups}
        open={false}
        onOpenChange={onOpenChange}
        onSelect={() => undefined}
      />,
    );
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('asks the parent to close when pressed while open', () => {
    const onOpenChange = vi.fn();
    render(<Harness initialOpen onOpenChange={onOpenChange} />);
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('WorkspaceSwitcher without a parent-owned open state', () => {
  function Bare() {
    return (
      <WorkspaceSwitcher
        current={current}
        groups={groups}
        onSelect={() => undefined}
      />
    );
  }

  it('opens and closes itself, and reports the change when asked to', () => {
    const onOpenChange = vi.fn();
    render(
      <WorkspaceSwitcher
        current={current}
        groups={groups}
        onSelect={() => undefined}
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

  it('starts closed and closes on selecting', () => {
    render(<Bare />);
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(trigger());
    fireEvent.click(item(/ICU/));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('can start open', () => {
    render(
      <WorkspaceSwitcher
        current={current}
        groups={groups}
        onSelect={() => undefined}
        defaultOpen
      />,
    );
    expect(screen.getByRole('menu')).toBeTruthy();
  });
});

describe('WorkspaceSwitcher menu', () => {
  it('is a menu named by the trigger', () => {
    render(<Harness initialOpen />);
    const menu = screen.getByRole('menu');
    expect(menu.getAttribute('aria-labelledby')).toBe(trigger().id);
    expect(
      screen.getByRole('menu', {
        name: 'Current workspace: Krishna Hospital Vijayawada',
      }),
    ).toBe(menu);
  });

  it('groups its items under a visible group label', () => {
    render(<Harness initialOpen />);
    const hospitals = screen.getByRole('group', { name: 'Hospitals' });
    const units = screen.getByRole('group', { name: 'Units' });
    expect(within(hospitals).getAllByRole('menuitemradio')).toHaveLength(3);
    expect(within(units).getAllByRole('menuitemradio')).toHaveLength(2);
    const label = within(hospitals).getByText('Hospitals');
    expect(label.classList.contains('sr-only')).toBe(false);
  });

  it('uses menuitemradio items', () => {
    render(<Harness initialOpen />);
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(5);
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
  });

  it('marks the current workspace aria-checked, and no other', () => {
    render(<Harness initialOpen />);
    const checked = screen
      .getAllByRole('menuitemradio')
      .filter((el) => el.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(checked[0]).toBe(item(/Krishna Hospital/));
    for (const other of [/Sri Venkateshwara/, /Vasavi/, /^ICU/, /Operation/]) {
      expect(item(other).getAttribute('aria-checked')).toBe('false');
    }
  });

  it('also ticks the current workspace on screen, with a glyph hidden from assistive technology', () => {
    render(<Harness initialOpen />);
    const tick = item(/Krishna Hospital/).querySelector('[data-tick]');
    expect(tick).toBeTruthy();
    expect(tick?.getAttribute('aria-hidden')).toBe('true');
    expect(item(/ICU/).querySelector('[data-tick]')).toBeNull();
  });

  it('makes the current workspace look different with more than colour', () => {
    render(<Harness initialOpen />);
    expect(item(/Krishna Hospital/).classList.contains('font-semibold')).toBe(
      true,
    );
    expect(item(/ICU/).classList.contains('font-semibold')).toBe(false);
  });

  it('shows an item label beside its name', () => {
    render(<Harness initialOpen />);
    expect(
      within(item(/Sri Venkateshwara/)).getByText('Kukatpally'),
    ).toBeTruthy();
  });

  it('shows the hint when given one, and nothing when not', () => {
    const { unmount } = render(
      <Harness initialOpen hint={<span>Switch workspace</span>} />,
    );
    expect(screen.getByText('Switch workspace')).toBeTruthy();
    unmount();
    render(<Harness initialOpen />);
    expect(screen.queryByText('Switch workspace')).toBeNull();
  });

  it('is an overlay surface', () => {
    render(<Harness initialOpen />);
    const surface = screen.getByRole('menu').parentElement;
    expect(surface?.classList.contains('nova-overlay')).toBe(true);
  });

  it('still marks the current workspace when it is not among the groups', () => {
    render(
      <Harness initialOpen current={{ id: 'gone', name: 'Closed Hospital' }} />,
    );
    expect(
      screen
        .getAllByRole('menuitemradio')
        .some((el) => el.getAttribute('aria-checked') === 'true'),
    ).toBe(false);
    expect(trigger().textContent).toContain('Closed Hospital');
  });
});

describe('WorkspaceSwitcher selecting', () => {
  it('calls onSelect with the id, closes the menu and returns focus to the trigger', () => {
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <Harness initialOpen onSelect={onSelect} onOpenChange={onOpenChange} />,
    );
    fireEvent.click(item(/ICU/));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('icu');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('lands focus on a trigger that already names the new workspace, so the switch is announced', () => {
    function Switching() {
      const [now, setNow] = useState<WorkspaceOption>(current);
      const [open, setOpen] = useState(true);
      return (
        <WorkspaceSwitcher
          current={now}
          groups={groups}
          open={open}
          onOpenChange={setOpen}
          onSelect={(id) => {
            const next = groups
              .flatMap((g) => g.items)
              .find((i) => i.id === id);
            if (next) setNow(next);
          }}
        />
      );
    }
    render(<Switching />);
    fireEvent.click(item(/ICU/));
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Current workspace: ICU' }),
    );
  });

  it('selects the focused item on Enter', () => {
    const onSelect = vi.fn();
    render(<Harness initialOpen onSelect={onSelect} />);
    press('ArrowDown'); // from Krishna to Vasavi (disabled), then ICU
    press('ArrowDown');
    press('Enter');
    expect(onSelect).toHaveBeenCalledWith('icu');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('selects the focused item on Space', () => {
    const onSelect = vi.fn();
    render(<Harness initialOpen onSelect={onSelect} />);
    press('ArrowUp');
    press(' ');
    expect(onSelect).toHaveBeenCalledWith('sv');
  });

  it('does not select, or close, on a disabled item', () => {
    const onSelect = vi.fn();
    render(<Harness initialOpen onSelect={onSelect} />);
    const disabled = item(/Vasavi/);
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(disabled);
    fireEvent.keyDown(disabled, { key: 'Enter' });
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('reports the current workspace again when it is picked again', () => {
    const onSelect = vi.fn();
    render(<Harness initialOpen onSelect={onSelect} />);
    fireEvent.click(item(/Krishna Hospital/));
    expect(onSelect).toHaveBeenCalledWith('kr');
  });
});

describe('WorkspaceSwitcher keyboard', () => {
  it('moves focus to the current workspace when the menu opens, so it is announced first', () => {
    render(<Harness />);
    fireEvent.click(trigger());
    expect(document.activeElement).toBe(item(/Krishna Hospital/));
  });

  it('moves focus to the first item when the current workspace is not in the menu', () => {
    render(<Harness current={{ id: 'gone', name: 'Closed Hospital' }} />);
    fireEvent.click(trigger());
    expect(document.activeElement).toBe(item(/Sri Venkateshwara/));
  });

  it('opens on ArrowDown from the trigger and focuses the current workspace', () => {
    render(<Harness />);
    trigger().focus();
    press('ArrowDown');
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(document.activeElement).toBe(item(/Krishna Hospital/));
  });

  it('opens on ArrowUp from the trigger and focuses the last item', () => {
    render(<Harness />);
    trigger().focus();
    press('ArrowUp');
    expect(document.activeElement).toBe(item(/Operation Theatre/));
  });

  it('moves focus down and up with the arrow keys', () => {
    render(<Harness initialOpen />);
    expect(document.activeElement).toBe(item(/Krishna Hospital/));
    press('ArrowDown');
    expect(document.activeElement).toBe(item(/Vasavi/));
    press('ArrowDown');
    expect(document.activeElement).toBe(item(/ICU/));
    press('ArrowUp');
    expect(document.activeElement).toBe(item(/Vasavi/));
  });

  it('keeps a disabled item reachable by arrow, so it is discoverable', () => {
    render(<Harness initialOpen />);
    press('ArrowDown');
    expect(document.activeElement).toBe(item(/Vasavi/));
  });

  it('wraps from the last item to the first, and back', () => {
    render(<Harness initialOpen />);
    press('End');
    expect(document.activeElement).toBe(item(/Operation Theatre/));
    press('ArrowDown');
    expect(document.activeElement).toBe(item(/Sri Venkateshwara/));
    press('ArrowUp');
    expect(document.activeElement).toBe(item(/Operation Theatre/));
  });

  it('jumps to the first and last item with Home and End', () => {
    render(<Harness initialOpen />);
    press('Home');
    expect(document.activeElement).toBe(item(/Sri Venkateshwara/));
    press('End');
    expect(document.activeElement).toBe(item(/Operation Theatre/));
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const onOpenChange = vi.fn();
    render(<Harness initialOpen onOpenChange={onOpenChange} />);
    expect(document.activeElement).toBe(item(/Krishna Hospital/));
    press('Escape');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes on Escape from the trigger as well', () => {
    render(<Harness initialOpen />);
    trigger().focus();
    press('Escape');
    expect(screen.queryByRole('menu')).toBeNull();
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

  it('closes on Tab and keeps focus on the trigger, rather than dropping it into the page', () => {
    render(<Harness initialOpen />);
    press('Tab');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes on a press outside, without stealing focus from where the user went', () => {
    render(
      <>
        <Harness initialOpen />
        <input aria-label="Search patients" />
      </>,
    );
    const search = screen.getByLabelText('Search patients');
    search.focus();
    fireEvent.pointerDown(search);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(search);
  });

  it('stays open on a press inside the menu', () => {
    render(<Harness initialOpen />);
    fireEvent.pointerDown(screen.getByRole('menu'));
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('stops listening for outside presses once closed', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    fireEvent.pointerDown(document.body);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('keeps items out of the tab order, so Tab does not walk the menu', () => {
    render(<Harness initialOpen />);
    for (const el of screen.getAllByRole('menuitemradio')) {
      expect(el.getAttribute('tabindex')).toBe('-1');
    }
  });
});

describe('WorkspaceSwitcher attributes', () => {
  it('merges a caller className and passes other attributes to the root', () => {
    render(<Harness className="w-60" data-testid="root" />);
    const root = screen.getByTestId('root');
    expect(root.classList.contains('w-60')).toBe(true);
    expect(root.contains(trigger())).toBe(true);
  });
});
