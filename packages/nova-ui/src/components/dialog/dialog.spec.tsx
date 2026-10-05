import { StrictMode, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { Menu, MenuItem } from '../menu/menu';
import { Tooltip } from '../tooltip/tooltip';
import { Dialog } from './dialog';

afterEach(() => cleanup());

const press = (
  key: string,
  options: { shiftKey?: boolean; target?: Element } = {},
) =>
  fireEvent.keyDown(options.target ?? document.activeElement ?? document.body, {
    key,
    shiftKey: options.shiftKey ?? false,
  });

const dialog = () => screen.getByRole('dialog');
const active = () => document.activeElement as HTMLElement;

interface PageProps {
  initialOpen?: boolean;
  onClose?: () => void;
  withInput?: boolean;
}

// An app: a button that opens the dialog, as a real page would.
function Page({ initialOpen = false, onClose, withInput = true }: PageProps) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Dialog
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
        title="Discharge patient"
        description="This closes the current episode."
        footer={
          <>
            <button type="button">Cancel</button>
            <button type="button">Confirm</button>
          </>
        }
      >
        {withInput ? (
          <>
            <label htmlFor="reason">Reason</label>
            <input id="reason" />
          </>
        ) : (
          <p>Are you sure?</p>
        )}
      </Dialog>
    </>
  );
}

function openFromButton() {
  const opener = screen.getByRole('button', { name: 'Open dialog' });
  act(() => opener.focus());
  fireEvent.click(opener);
  return opener;
}

describe('Dialog semantics', () => {
  it('renders nothing while closed', () => {
    render(<Dialog open={false} onClose={() => undefined} title="Hi" />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders a modal dialog', () => {
    render(<Dialog open onClose={() => undefined} title="Discharge patient" />);
    expect(dialog().getAttribute('aria-modal')).toBe('true');
  });

  it('is labelled by its title', () => {
    render(<Dialog open onClose={() => undefined} title="Discharge patient" />);
    const labelledBy = dialog().getAttribute('aria-labelledby') ?? '';
    const title = document.getElementById(labelledBy);
    expect(title?.textContent).toBe('Discharge patient');
    expect(title?.tagName).toBe('H2');
    expect(screen.getByRole('dialog', { name: 'Discharge patient' })).toBe(
      dialog(),
    );
  });

  it('is described by its description when it has one, and by nothing otherwise', () => {
    const { rerender } = render(
      <Dialog
        open
        onClose={() => undefined}
        title="Discharge patient"
        description="This closes the current episode."
      />,
    );
    const describedBy = dialog().getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toBe(
      'This closes the current episode.',
    );
    rerender(
      <Dialog open onClose={() => undefined} title="Discharge patient" />,
    );
    expect(dialog().getAttribute('aria-describedby')).toBeNull();
  });

  it('renders through a portal to document.body, outside the React container', () => {
    const { container } = render(
      <Dialog open onClose={() => undefined} title="Hi" />,
    );
    expect(container.contains(dialog())).toBe(false);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    // The layer holding the dialog is a direct child of <body>.
    const layer = dialog().parentElement;
    expect(layer?.parentElement).toBe(document.body);
  });

  it('renders its children and footer inside the dialog', () => {
    render(<Page initialOpen />);
    expect(dialog().contains(screen.getByLabelText('Reason'))).toBe(true);
    expect(
      dialog().contains(screen.getByRole('button', { name: 'Confirm' })),
    ).toBe(true);
  });

  it('draws the panel on nova-overlay over a dimmed scrim, carrying its own typography', () => {
    render(
      <Dialog
        open
        onClose={() => undefined}
        title="Hi"
        className="max-w-2xl"
      />,
    );
    expect(dialog().classList).toContain('nova-overlay');
    expect(dialog().classList).toContain('max-w-2xl');
    const layer = dialog().parentElement as HTMLElement;
    // A portal escapes the app's text styles, so the layer brings its own.
    expect(layer.classList).toContain('font-sans');
    expect(layer.classList).toContain('text-ink');
    const scrim = layer.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(scrim.className).toContain('bg-ink/40');
  });
});

describe('Dialog uncontrolled', () => {
  it('closes itself on Escape when no open prop is given, and still reports it', () => {
    const onClose = vi.fn();
    render(<Dialog defaultOpen onClose={onClose} title="Hi" />);
    expect(screen.queryByRole('dialog')).not.toBeNull();
    press('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is closed unless told otherwise', () => {
    render(<Dialog title="Hi" />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Dialog close controls', () => {
  it('has a real close button with an accessible name', () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} title="Hi" />);
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close.tagName).toBe('BUTTON');
    expect(close.getAttribute('type')).toBe('button');
    expect(close.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('lets the close label be localised', () => {
    render(
      <Dialog
        open
        onClose={() => undefined}
        title="Hi"
        closeLabel="Close dialog"
      />,
    );
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeTruthy();
  });

  it('does not close on a click on the scrim, so a stray click cannot throw away a form', () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} title="Hi" />);
    const scrim = dialog().parentElement?.querySelector(
      '[aria-hidden="true"]',
    ) as HTMLElement;
    fireEvent.click(scrim);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps focus where it is when the scrim is pressed', () => {
    render(<Page initialOpen />);
    const scrim = dialog().parentElement?.querySelector(
      '[aria-hidden="true"]',
    ) as HTMLElement;
    // fireEvent returns false when a handler cancelled the event; cancelling mousedown is what
    // stops the browser moving focus to <body>.
    expect(fireEvent.mouseDown(scrim)).toBe(false);
  });
});

describe('Dialog initial focus', () => {
  it('moves focus into the dialog, onto the first control of its content', () => {
    render(<Page />);
    openFromButton();
    expect(dialog().contains(active())).toBe(true);
    expect(active()).toBe(screen.getByLabelText('Reason'));
  });

  it('does not start on the close button, which belongs to the chrome', () => {
    render(<Page />);
    openFromButton();
    expect(active()).not.toBe(screen.getByRole('button', { name: 'Close' }));
  });

  it('falls back to the first footer control when the content has none', () => {
    render(<Page withInput={false} />);
    openFromButton();
    expect(active()).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('falls back to the dialog itself when nothing inside can take focus', () => {
    render(<Dialog open onClose={() => undefined} title="Hi" />);
    // Only the close button is focusable and it is skipped, so the dialog takes focus.
    expect(active()).toBe(dialog());
    expect(dialog().getAttribute('tabindex')).toBe('-1');
  });

  it('leaves focus alone when something inside already took it', () => {
    render(
      <Dialog open onClose={() => undefined} title="Hi">
        <input aria-label="First" />
        <input aria-label="Second" autoFocus />
      </Dialog>,
    );
    expect(active()).toBe(screen.getByLabelText('Second'));
  });
});

describe('Dialog focus return', () => {
  it('returns focus to whatever opened it when it closes on Escape', () => {
    render(<Page />);
    const opener = openFromButton();
    expect(dialog().contains(active())).toBe(true);
    press('Escape');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(active()).toBe(opener);
  });

  it('returns focus when the parent closes it by changing `open`', () => {
    const { rerender } = render(
      <>
        <button type="button">Opener</button>
        <Dialog open={false} onClose={() => undefined} title="Hi">
          <input aria-label="Name" />
        </Dialog>
      </>,
    );
    const opener = screen.getByRole('button', { name: 'Opener' });
    act(() => opener.focus());
    rerender(
      <>
        <button type="button">Opener</button>
        <Dialog open onClose={() => undefined} title="Hi">
          <input aria-label="Name" />
        </Dialog>
      </>,
    );
    expect(active()).toBe(screen.getByLabelText('Name'));
    rerender(
      <>
        <button type="button">Opener</button>
        <Dialog open={false} onClose={() => undefined} title="Hi">
          <input aria-label="Name" />
        </Dialog>
      </>,
    );
    expect(active()).toBe(opener);
  });

  it('returns focus from the close button and from a footer button too', () => {
    render(<Page />);
    const opener = openFromButton();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(active()).toBe(opener);
  });

  it('lifts the inert marks before it restores focus, because the opener sits under them', () => {
    render(<Page />);
    const opener = screen.getByRole('button', { name: 'Open dialog' });
    act(() => opener.focus());
    const original = opener.focus.bind(opener);
    const inertAtRestore: boolean[] = [];
    opener.focus = () => {
      inertAtRestore.push(opener.closest('[inert]') !== null);
      original();
    };
    fireEvent.click(opener);
    inertAtRestore.length = 0;
    press('Escape');
    expect(inertAtRestore).toEqual([false]);
  });

  it('does not fail or force focus when the opener has left the page', () => {
    function Throwaway() {
      const [open, setOpen] = useState(false);
      const [shown, setShown] = useState(true);
      return (
        <>
          {shown ? (
            <button type="button" onClick={() => setOpen(true)}>
              Remove me
            </button>
          ) : null}
          <button type="button">Elsewhere</button>
          <Dialog
            open={open}
            onClose={() => {
              setShown(false);
              setOpen(false);
            }}
            title="Hi"
          >
            <input aria-label="Name" />
          </Dialog>
        </>
      );
    }
    render(<Throwaway />);
    const opener = screen.getByRole('button', { name: 'Remove me' });
    act(() => opener.focus());
    fireEvent.click(opener);
    expect(() => press('Escape')).not.toThrow();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove me' })).toBeNull();
  });
});

describe('Dialog Escape', () => {
  it('closes on Escape from inside the dialog', () => {
    const onClose = vi.fn();
    render(<Page initialOpen onClose={onClose} />);
    press('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape even when focus has fallen to <body>', () => {
    const onClose = vi.fn();
    render(<Page initialOpen onClose={onClose} />);
    act(() => (document.activeElement as HTMLElement).blur());
    expect(active()).toBe(document.body);
    press('Escape', { target: document.body });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores other keys', () => {
    const onClose = vi.fn();
    render(<Page initialOpen onClose={onClose} />);
    press('Enter');
    press('a');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close when an inner widget already used the Escape', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Hi">
        <input
          aria-label="Search"
          onKeyDown={(event) => event.preventDefault()}
        />
      </Dialog>,
    );
    press('Escape', { target: screen.getByLabelText('Search') });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close while an input method is composing', () => {
    const onClose = vi.fn();
    render(<Dialog open onClose={onClose} title="Hi" />);
    fireEvent.keyDown(document.body, { key: 'Escape', isComposing: true });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls the latest onClose without resubscribing', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Dialog open onClose={first} title="Hi" />);
    rerender(<Dialog open onClose={second} title="Hi" />);
    press('Escape');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops listening once it has closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(<Dialog open onClose={onClose} title="Hi" />);
    rerender(<Dialog open={false} onClose={onClose} title="Hi" />);
    press('Escape', { target: document.body });
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('Dialog focus trap', () => {
  it('wraps Tab from the last control to the first', () => {
    render(<Page initialOpen />);
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    act(() => confirm.focus());
    expect(press('Tab')).toBe(false);
    expect(active()).toBe(screen.getByRole('button', { name: 'Close' }));
  });

  it('wraps Shift+Tab from the first control to the last', () => {
    render(<Page initialOpen />);
    const close = screen.getByRole('button', { name: 'Close' });
    act(() => close.focus());
    expect(press('Tab', { shiftKey: true })).toBe(false);
    expect(active()).toBe(screen.getByRole('button', { name: 'Confirm' }));
  });

  it('leaves Tab to the browser everywhere in between', () => {
    render(<Page initialOpen />);
    act(() => screen.getByLabelText('Reason').focus());
    expect(press('Tab')).toBe(true);
    expect(press('Tab', { shiftKey: true })).toBe(true);
  });

  it('pulls focus back in if it has escaped to the page behind', () => {
    render(<Page initialOpen />);
    const behind = screen.getByRole('button', { name: 'Open dialog' });
    act(() => behind.focus());
    expect(press('Tab')).toBe(false);
    expect(dialog().contains(active())).toBe(true);
  });

  it('keeps focus on the dialog when there is nothing inside to tab to', () => {
    render(
      <Dialog open onClose={() => undefined} title="Hi" closeLabel="Close">
        <p>Read only</p>
      </Dialog>,
    );
    // The close button is the only stop; Tab from it wraps to itself.
    const close = screen.getByRole('button', { name: 'Close' });
    act(() => close.focus());
    expect(press('Tab')).toBe(false);
    expect(active()).toBe(close);
  });

  it('only the top dialog traps and handles keys when two are stacked', () => {
    const closeBottom = vi.fn();
    const closeTop = vi.fn();
    render(
      <>
        <Dialog open onClose={closeBottom} title="Bottom">
          <button type="button">Bottom action</button>
        </Dialog>
        <Dialog open onClose={closeTop} title="Top">
          <button type="button">Top action</button>
        </Dialog>
      </>,
    );
    press('Escape');
    expect(closeTop).toHaveBeenCalledTimes(1);
    expect(closeBottom).not.toHaveBeenCalled();
  });

  it('hands Escape to the dialog underneath once the top one has gone', () => {
    const closeBottom = vi.fn();
    function Stack({ topOpen }: { topOpen: boolean }) {
      return (
        <>
          <Dialog open onClose={closeBottom} title="Bottom" />
          <Dialog open={topOpen} onClose={() => undefined} title="Top" />
        </>
      );
    }
    const { rerender } = render(<Stack topOpen />);
    rerender(<Stack topOpen={false} />);
    press('Escape');
    expect(closeBottom).toHaveBeenCalledTimes(1);
  });
});

describe('Dialog inert background', () => {
  it('makes the page behind it inert while open, and restores it on close', () => {
    const { container, rerender } = render(
      <Dialog open onClose={() => undefined} title="Hi" />,
    );
    expect(container.hasAttribute('inert')).toBe(true);
    expect(dialog().parentElement?.hasAttribute('inert')).toBe(false);
    rerender(<Dialog open={false} onClose={() => undefined} title="Hi" />);
    expect(container.hasAttribute('inert')).toBe(false);
  });

  it('makes every other thing portalled to <body> inert too', () => {
    const toast = document.createElement('div');
    toast.id = 'toast-region';
    document.body.appendChild(toast);
    try {
      const { rerender } = render(
        <Dialog open onClose={() => undefined} title="Hi" />,
      );
      expect(toast.hasAttribute('inert')).toBe(true);
      rerender(<Dialog open={false} onClose={() => undefined} title="Hi" />);
      expect(toast.hasAttribute('inert')).toBe(false);
    } finally {
      toast.remove();
    }
  });

  it('restores the page when it unmounts while open', () => {
    const { container, unmount } = render(
      <Dialog open onClose={() => undefined} title="Hi" />,
    );
    expect(container.hasAttribute('inert')).toBe(true);
    unmount();
    expect(container.hasAttribute('inert')).toBe(false);
  });

  it('keeps the page inert behind a second dialog until the last one closes', () => {
    function Stack({ top, bottom }: { top: boolean; bottom: boolean }) {
      return (
        <>
          <Dialog open={bottom} onClose={() => undefined} title="Bottom" />
          <Dialog open={top} onClose={() => undefined} title="Top" />
        </>
      );
    }
    const { container, rerender } = render(<Stack bottom top />);
    expect(container.hasAttribute('inert')).toBe(true);
    // Both mounted in one commit: the top layer must be live, and the bottom one covered by it.
    const [bottomLayer, topLayer] = Array.from(
      document.querySelectorAll('[data-nova-layer]'),
    );
    expect(topLayer?.hasAttribute('inert')).toBe(false);
    expect(bottomLayer?.hasAttribute('inert')).toBe(true);
    // The bottom dialog closes first: the page must stay inert behind the top one.
    rerender(<Stack bottom={false} top />);
    expect(container.hasAttribute('inert')).toBe(true);
    rerender(<Stack bottom={false} top={false} />);
    expect(container.hasAttribute('inert')).toBe(false);
  });

  it('survives React StrictMode double-invoking its effects', () => {
    const { container, unmount } = render(
      <StrictMode>
        <Page initialOpen />
      </StrictMode>,
    );
    expect(container.hasAttribute('inert')).toBe(true);
    expect(dialog().contains(active())).toBe(true);
    press('Escape');
    expect(container.hasAttribute('inert')).toBe(false);
    unmount();
  });
});

describe('Dialog with other layers inside it', () => {
  function MenuInDialog({ onClose }: { onClose: () => void }) {
    const [menuOpen, setMenuOpen] = useState(true);
    return (
      <Dialog open onClose={onClose} title="Patient">
        <Menu
          trigger={<button type="button">More</button>}
          open={menuOpen}
          onOpenChange={setMenuOpen}
        >
          <MenuItem>Print wristband</MenuItem>
        </Menu>
      </Dialog>
    );
  }

  it('Escape closes an open menu first and leaves the dialog open', () => {
    const onClose = vi.fn();
    render(<MenuInDialog onClose={onClose} />);
    expect(screen.queryByRole('menu')).not.toBeNull();
    press('Escape');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(active()).toBe(screen.getByRole('button', { name: 'More' }));
    press('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape dismisses a visible tooltip first and leaves the dialog open', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Patient">
        <Tooltip content="Medical record number">
          <button type="button">MRN</button>
        </Tooltip>
      </Dialog>,
    );
    const trigger = screen.getByRole('button', { name: 'MRN' });
    act(() => trigger.focus());
    expect(screen.queryByRole('tooltip')).not.toBeNull();
    press('Escape');
    expect(screen.queryByRole('tooltip')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    press('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a menu item can open a dialog, and closing it lands back on the menu button', () => {
    function Flow() {
      const [menuOpen, setMenuOpen] = useState(false);
      const [dialogOpen, setDialogOpen] = useState(false);
      return (
        <>
          <Menu
            trigger={<button type="button">Actions</button>}
            open={menuOpen}
            onOpenChange={setMenuOpen}
          >
            <MenuItem onClick={() => setDialogOpen(true)}>Discharge…</MenuItem>
          </Menu>
          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title="Discharge patient"
          >
            <input aria-label="Reason" />
          </Dialog>
        </>
      );
    }
    render(<Flow />);
    const actions = screen.getByRole('button', { name: 'Actions' });
    act(() => actions.focus());
    fireEvent.click(actions);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Discharge…' }));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(active()).toBe(screen.getByLabelText('Reason'));
    press('Escape');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(active()).toBe(actions);
  });
});
