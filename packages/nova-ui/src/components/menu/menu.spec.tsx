import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { Menu, MenuGroup, MenuItem, MenuItemRadio } from './menu';

afterEach(() => cleanup());

interface HarnessProps {
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onEdit?: () => void;
  onTransfer?: () => void;
  onArchive?: () => void;
  // Parent that refuses to close, to prove the menu is controlled.
  stubborn?: boolean;
}

function Harness({
  initialOpen = true,
  onOpenChange,
  onEdit,
  onTransfer,
  onArchive,
  stubborn = false,
}: HarnessProps) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <button type="button">Before</button>
      <Menu
        trigger={<button type="button">Actions</button>}
        open={open}
        onOpenChange={(next) => {
          onOpenChange?.(next);
          if (!stubborn) setOpen(next);
        }}
      >
        <MenuItem onClick={onEdit}>Edit</MenuItem>
        <MenuItem disabled onClick={onTransfer}>
          Transfer
        </MenuItem>
        <MenuItem onClick={onArchive}>Archive</MenuItem>
      </Menu>
      <button type="button">After</button>
    </>
  );
}

const trigger = () => screen.getByRole('button', { name: 'Actions' });
const item = (name: string) => screen.getByRole('menuitem', { name });
const press = (
  key: string,
  target: Element = document.activeElement ?? document.body,
) => fireEvent.keyDown(target, { key });

describe('Menu semantics', () => {
  it('is closed by default: no menu, and the trigger says it opens one', () => {
    render(<Harness initialOpen={false} />);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().getAttribute('aria-controls')).toBeNull();
  });

  it('opens as role="menu" of role="menuitem" buttons, linked both ways to the trigger', () => {
    render(<Harness />);
    const menu = screen.getByRole('menu');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(menu.id);
    expect(menu.getAttribute('aria-labelledby')).toBe(trigger().id);
    expect(trigger().id).not.toBe('');
    expect(screen.getByRole('menu', { name: 'Actions' })).toBe(menu);
    const items = screen.getAllByRole('menuitem');
    expect(items.map((el) => el.textContent)).toEqual([
      'Edit',
      'Transfer',
      'Archive',
    ]);
    for (const el of items) {
      expect(el.tagName).toBe('BUTTON');
      expect(el.getAttribute('type')).toBe('button');
      expect(el.getAttribute('tabindex')).toBe('-1');
    }
  });

  it('keeps a caller-supplied trigger id', () => {
    render(
      <Menu
        trigger={
          <button type="button" id="row-actions">
            Actions
          </button>
        }
        open
        onOpenChange={() => undefined}
      >
        <MenuItem>Edit</MenuItem>
      </Menu>,
    );
    expect(screen.getByRole('button', { name: 'Actions' }).id).toBe(
      'row-actions',
    );
    expect(screen.getByRole('menu').getAttribute('aria-labelledby')).toBe(
      'row-actions',
    );
  });

  it('draws on the nova-overlay material and styles the wrapper with className', () => {
    const { container } = render(
      <Menu
        trigger={<button type="button">Actions</button>}
        open
        onOpenChange={() => undefined}
        className="ml-2"
      >
        <MenuItem>Edit</MenuItem>
      </Menu>,
    );
    expect(
      screen.getByRole('menu').closest('[data-surface="overlay"]')?.classList,
    ).toContain('nova-overlay');
    expect(container.querySelector('.ml-2')).not.toBeNull();
  });

  it('is controlled: it asks to change and the parent decides', () => {
    const onOpenChange = vi.fn();
    render(<Harness stubborn onOpenChange={onOpenChange} />);
    press('Escape');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('menu')).not.toBeNull();
  });
});

describe('Menu uncontrolled', () => {
  it('keeps its own state when no open prop is given', () => {
    const onOpenChange = vi.fn();
    render(
      <Menu
        trigger={<button type="button">Actions</button>}
        onOpenChange={onOpenChange}
      >
        <MenuItem>Edit</MenuItem>
      </Menu>,
    );
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(trigger());
    expect(screen.queryByRole('menu')).not.toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    press('Escape');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('starts open with defaultOpen', () => {
    render(
      <Menu trigger={<button type="button">Actions</button>} defaultOpen>
        <MenuItem>Edit</MenuItem>
      </Menu>,
    );
    expect(screen.queryByRole('menu')).not.toBeNull();
  });
});

describe('Menu opening', () => {
  it('toggles from the trigger', () => {
    const onOpenChange = vi.fn();
    render(<Harness initialOpen={false} onOpenChange={onOpenChange} />);
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole('menu')).not.toBeNull();
    fireEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it("still runs the trigger's own onClick, and lets it veto with preventDefault", () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    const onOpenChange = vi.fn();
    render(
      <Menu
        trigger={
          <button type="button" onClick={onClick}>
            Actions
          </button>
        }
        open={false}
        onOpenChange={onOpenChange}
      >
        <MenuItem>Edit</MenuItem>
      </Menu>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('moves focus to the first enabled item when it opens', () => {
    render(<Harness initialOpen={false} />);
    act(() => trigger().focus());
    fireEvent.click(trigger());
    expect(document.activeElement).toBe(item('Edit'));
  });

  it('opens on ArrowDown from the trigger, on the first item', () => {
    const onOpenChange = vi.fn();
    render(<Harness initialOpen={false} onOpenChange={onOpenChange} />);
    act(() => trigger().focus());
    expect(press('ArrowDown')).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(document.activeElement).toBe(item('Edit'));
  });

  it('opens on ArrowUp from the trigger, on the last item', () => {
    render(<Harness initialOpen={false} />);
    act(() => trigger().focus());
    press('ArrowUp');
    expect(document.activeElement).toBe(item('Archive'));
  });

  it('moves into the menu on ArrowDown when already open and the trigger has focus', () => {
    render(<Harness />);
    act(() => trigger().focus());
    press('ArrowDown');
    expect(document.activeElement).toBe(item('Edit'));
  });
});

describe('Menu keyboard', () => {
  // WAI-ARIA menus keep a disabled item focusable, so it can be discovered and is announced as
  // unavailable; it just cannot be chosen.
  it('moves focus with ArrowDown and ArrowUp, through disabled items too, and wraps', () => {
    render(<Harness />);
    expect(document.activeElement).toBe(item('Edit'));
    press('ArrowDown');
    expect(document.activeElement).toBe(item('Transfer'));
    press('ArrowDown');
    expect(document.activeElement).toBe(item('Archive'));
    press('ArrowDown');
    expect(document.activeElement).toBe(item('Edit'));
    press('ArrowUp');
    expect(document.activeElement).toBe(item('Archive'));
  });

  it('activates the focused item with Enter or Space, once', () => {
    const onEdit = vi.fn();
    const onArchive = vi.fn();
    render(<Harness onEdit={onEdit} onArchive={onArchive} />);
    expect(press('Enter')).toBe(false);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    cleanup();
    render(<Harness onEdit={onEdit} onArchive={onArchive} />);
    press('End');
    expect(press(' ')).toBe(false);
    expect(onArchive).toHaveBeenCalledTimes(1);
  });

  it('does not activate a disabled item from the keyboard', () => {
    const onTransfer = vi.fn();
    render(<Harness onTransfer={onTransfer} />);
    press('ArrowDown');
    press('Enter');
    press(' ');
    expect(onTransfer).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('jumps to the first and last item with Home and End', () => {
    render(<Harness />);
    press('End');
    expect(document.activeElement).toBe(item('Archive'));
    press('Home');
    expect(document.activeElement).toBe(item('Edit'));
  });

  it('stops the page scrolling on the keys it handles', () => {
    render(<Harness />);
    expect(press('ArrowDown')).toBe(false);
    expect(press('ArrowUp')).toBe(false);
    expect(press('Home')).toBe(false);
    expect(press('End')).toBe(false);
  });

  it('leaves other keys alone', () => {
    render(<Harness />);
    expect(press('a')).toBe(true);
    expect(document.activeElement).toBe(item('Edit'));
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    expect(document.activeElement).toBe(item('Edit'));
    press('Escape');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('also closes on Escape while focus is still on the trigger', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    act(() => trigger().focus());
    press('Escape');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(document.activeElement).toBe(trigger());
  });

  it('consumes Escape, so a dialog around the menu does not close with it', () => {
    const enclosing = vi.fn();
    document.addEventListener('keydown', enclosing);
    try {
      render(<Harness />);
      expect(press('Escape')).toBe(false);
      expect(enclosing).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', enclosing);
    }
  });

  it('does not swallow Escape while closed', () => {
    render(<Harness initialOpen={false} />);
    act(() => trigger().focus());
    expect(press('Escape')).toBe(true);
  });

  it('closes on Tab and hands focus back to the trigger so Tab carries on from there', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    expect(press('Tab')).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });
});

describe('Menu items', () => {
  it('calls the item handler, closes, and returns focus to the trigger', () => {
    const onEdit = vi.fn();
    const onOpenChange = vi.fn();
    render(<Harness onEdit={onEdit} onOpenChange={onOpenChange} />);
    fireEvent.click(item('Edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('runs the item handler before the menu closes', () => {
    const order: string[] = [];
    render(
      <Harness
        onEdit={() => order.push('item')}
        onOpenChange={(open) => order.push(open ? 'open' : 'close')}
      />,
    );
    fireEvent.click(item('Edit'));
    expect(order).toEqual(['item', 'close']);
  });

  it('does nothing for a disabled item', () => {
    const onTransfer = vi.fn();
    const onOpenChange = vi.fn();
    render(<Harness onTransfer={onTransfer} onOpenChange={onOpenChange} />);
    expect(item('Transfer').getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(item('Transfer'));
    expect(onTransfer).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeNull();
  });

  it('stays open when the item handler calls preventDefault', () => {
    const onOpenChange = vi.fn();
    render(
      <Menu
        trigger={<button type="button">Filters</button>}
        open
        onOpenChange={onOpenChange}
      >
        <MenuItem onClick={(event) => event.preventDefault()}>
          Show archived
        </MenuItem>
      </Menu>,
    );
    fireEvent.click(screen.getByRole('menuitem', { name: 'Show archived' }));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('does not close when the click lands on the menu itself rather than an item', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('menu'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('forwards a ref, merges className and passes attributes through', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Menu
        trigger={<button type="button">Actions</button>}
        open
        onOpenChange={() => undefined}
      >
        <MenuItem ref={ref} className="text-crit-deep" data-testid="danger">
          Delete
        </MenuItem>
      </Menu>,
    );
    const el = screen.getByTestId('danger');
    expect(ref.current).toBe(el);
    expect(el.classList).toContain('text-crit-deep');
    expect(el.getAttribute('role')).toBe('menuitem');
  });
});

describe('Menu dismissal', () => {
  it('closes on a pointer press outside, without taking focus', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'After' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(document.activeElement).not.toBe(trigger());
  });

  it('does not treat a press on the trigger or the menu as outside', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    fireEvent.pointerDown(trigger());
    fireEvent.pointerDown(item('Edit'));
    fireEvent.pointerDown(screen.getByRole('menu'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('listens for outside presses only while open', () => {
    const onOpenChange = vi.fn();
    render(<Harness initialOpen={false} onOpenChange={onOpenChange} />);
    fireEvent.pointerDown(document.body);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes when focus moves to another control, and leaves focus there', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    const after = screen.getByRole('button', { name: 'After' });
    act(() => after.focus());
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(document.activeElement).toBe(after);
  });

  it('stays open while focus moves between the trigger and the items', () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} />);
    act(() => trigger().focus());
    act(() => item('Archive').focus());
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe('Menu radio items and groups', () => {
  function Wards({
    onPick = () => undefined,
  }: {
    onPick?: (id: string) => void;
  }) {
    return (
      <Menu
        trigger={<button type="button">Ward</button>}
        header="Switch ward"
        defaultOpen
      >
        <MenuGroup label="Medical">
          <MenuItemRadio checked={false} onClick={() => onPick('a')}>
            Ward A
          </MenuItemRadio>
          <MenuItemRadio
            checked
            description="Current"
            onClick={() => onPick('b')}
          >
            Ward B
          </MenuItemRadio>
        </MenuGroup>
        <MenuGroup label="Surgical">
          <MenuItemRadio checked={false} disabled>
            Ward C
          </MenuItemRadio>
        </MenuGroup>
      </Menu>
    );
  }
  const radio = (name: RegExp) => screen.getByRole('menuitemradio', { name });

  it('opens on the checked item, so the current choice is announced first', () => {
    render(<Wards />);
    expect(document.activeElement).toBe(radio(/Ward B/));
  });

  it('marks the checked item with aria-checked, a tick and weight, not colour alone', () => {
    render(<Wards />);
    expect(radio(/Ward B/).getAttribute('aria-checked')).toBe('true');
    expect(radio(/Ward A/).getAttribute('aria-checked')).toBe('false');
    expect(radio(/Ward B/).querySelector('[data-tick]')).not.toBeNull();
    expect(radio(/Ward A/).querySelector('[data-tick]')).toBeNull();
    expect(radio(/Ward B/).classList.contains('font-semibold')).toBe(true);
  });

  it('shows a description line under the name', () => {
    render(<Wards />);
    expect(radio(/Ward B/).textContent).toContain('Current');
  });

  it('groups items under a visible label that names the group', () => {
    render(<Wards />);
    const medical = screen.getByRole('group', { name: 'Medical' });
    expect(medical.querySelectorAll('[role="menuitemradio"]')).toHaveLength(2);
  });

  it('describes the menu with its header, outside the menu itself', () => {
    render(<Wards />);
    const menu = screen.getByRole('menu');
    const header = screen.getByText('Switch ward');
    expect(menu.contains(header)).toBe(false);
    expect(menu.getAttribute('aria-describedby')).toBe(header.id);
  });

  it('navigates radio items with the same keys as plain items', () => {
    const onPick = vi.fn();
    render(<Wards onPick={onPick} />);
    press('ArrowDown');
    expect(document.activeElement).toBe(radio(/Ward C/));
    press('Home');
    press('Enter');
    expect(onPick).toHaveBeenCalledWith('a');
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
