import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Tab, TabList, TabPanel, Tabs } from './tabs';

afterEach(() => cleanup());

// Tabs holds no state of its own, so tests that need the selection to move wrap it the way a page
// would: a parent owns `value` and hands it down.
function Harness({
  initial = 'overview',
  onValueChange,
}: {
  initial?: string;
  onValueChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Tabs
      value={value}
      onValueChange={(next) => {
        onValueChange?.(next);
        setValue(next);
      }}
    >
      <TabList aria-label="Admission">
        <Tab value="overview">Overview</Tab>
        <Tab value="claims">Claims</Tab>
        <Tab value="notes">Notes</Tab>
      </TabList>
      <TabPanel value="overview">Overview panel</TabPanel>
      <TabPanel value="claims">Claims panel</TabPanel>
      <TabPanel value="notes">Notes panel</TabPanel>
    </Tabs>
  );
}

function tab(name: string): HTMLElement {
  return screen.getByRole('tab', { name });
}

describe('Tabs', () => {
  describe('structure', () => {
    it('exposes a named tablist of tabs and one tabpanel', () => {
      render(<Harness />);
      expect(screen.getByRole('tablist', { name: 'Admission' })).toBeTruthy();
      expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
        'Overview',
        'Claims',
        'Notes',
      ]);
      expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    });

    it('renders only the selected panel', () => {
      render(<Harness initial="claims" />);
      expect(screen.getByText('Claims panel')).toBeTruthy();
      expect(screen.queryByText('Overview panel')).toBeNull();
      expect(screen.queryByText('Notes panel')).toBeNull();
    });

    it('marks only the selected tab as selected', () => {
      render(<Harness initial="claims" />);
      expect(tab('Claims').getAttribute('aria-selected')).toBe('true');
      expect(tab('Overview').getAttribute('aria-selected')).toBe('false');
      expect(tab('Notes').getAttribute('aria-selected')).toBe('false');
      expect(
        screen.getByRole('tab', { name: 'Claims', selected: true }),
      ).toBeTruthy();
    });

    it("points aria-controls at the rendered panel's id, and labels the panel with its tab", () => {
      render(<Harness />);
      const selected = tab('Overview');
      const panel = screen.getByRole('tabpanel');
      expect(panel.id).not.toBe('');
      expect(selected.getAttribute('aria-controls')).toBe(panel.id);
      expect(document.getElementById(panel.id)).toBe(panel);
      expect(panel.getAttribute('aria-labelledby')).toBe(selected.id);
      expect(selected.id).not.toBe('');
      expect(screen.getByRole('tabpanel', { name: 'Overview' })).toBe(panel);
    });

    it('gives every tab its own id and keeps two tab sets on one page apart', () => {
      render(
        <>
          <Harness />
          <Harness />
        </>,
      );
      const ids = screen.getAllByRole('tab').map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
      const panelIds = screen.getAllByRole('tabpanel').map((p) => p.id);
      expect(new Set(panelIds).size).toBe(panelIds.length);
    });

    it('keeps ids valid for values with spaces, so aria-controls still names one element', () => {
      render(
        <Tabs value="in progress" onValueChange={() => undefined}>
          <TabList>
            <Tab value="in progress">In progress</Tab>
            <Tab value="done">Done</Tab>
          </TabList>
          <TabPanel value="in progress">Working</TabPanel>
        </Tabs>,
      );
      const selected = tab('In progress');
      const panel = screen.getByRole('tabpanel');
      expect(/\s/.test(selected.id)).toBe(false);
      expect(/\s/.test(panel.id)).toBe(false);
      expect(selected.getAttribute('aria-controls')).toBe(panel.id);
    });

    it('makes tabs plain buttons that never submit a surrounding form', () => {
      render(
        <form>
          <Harness />
        </form>,
      );
      for (const t of screen.getAllByRole('tab')) {
        expect(t.tagName).toBe('BUTTON');
        expect(t.getAttribute('type')).toBe('button');
      }
    });

    it('lets the selected panel be reached from the keyboard', () => {
      render(<Harness />);
      expect((screen.getByRole('tabpanel') as HTMLElement).tabIndex).toBe(0);
    });
  });

  describe('selection', () => {
    it('calls onValueChange with the clicked tab value', () => {
      const onValueChange = vi.fn();
      render(
        <Tabs value="overview" onValueChange={onValueChange}>
          <TabList>
            <Tab value="overview">Overview</Tab>
            <Tab value="claims">Claims</Tab>
          </TabList>
          <TabPanel value="overview">Overview panel</TabPanel>
        </Tabs>,
      );
      fireEvent.click(tab('Claims'));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('claims');
    });

    it('is controlled: the panel follows the value it is given, not the click', () => {
      render(
        <Tabs value="overview" onValueChange={() => undefined}>
          <TabList>
            <Tab value="overview">Overview</Tab>
            <Tab value="claims">Claims</Tab>
          </TabList>
          <TabPanel value="overview">Overview panel</TabPanel>
          <TabPanel value="claims">Claims panel</TabPanel>
        </Tabs>,
      );
      fireEvent.click(tab('Claims'));
      expect(screen.getByText('Overview panel')).toBeTruthy();
      expect(screen.queryByText('Claims panel')).toBeNull();
    });

    it('swaps the panel when the parent accepts the change', () => {
      render(<Harness />);
      fireEvent.click(tab('Notes'));
      expect(screen.getByText('Notes panel')).toBeTruthy();
      expect(screen.queryByText('Overview panel')).toBeNull();
    });

    it("still calls a tab's own onClick", () => {
      const onClick = vi.fn();
      render(
        <Tabs value="a" onValueChange={() => undefined}>
          <TabList>
            <Tab value="a" onClick={onClick}>
              A
            </Tab>
          </TabList>
        </Tabs>,
      );
      fireEvent.click(tab('A'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('uncontrolled', () => {
    function Uncontrolled({
      onValueChange,
    }: {
      onValueChange?: (value: string) => void;
    }) {
      return (
        <Tabs defaultValue="claims" onValueChange={onValueChange}>
          <TabList>
            <Tab value="overview">Overview</Tab>
            <Tab value="claims">Claims</Tab>
            <Tab value="notes">Notes</Tab>
          </TabList>
          <TabPanel value="overview">Overview panel</TabPanel>
          <TabPanel value="claims">Claims panel</TabPanel>
          <TabPanel value="notes">Notes panel</TabPanel>
        </Tabs>
      );
    }

    it('starts on defaultValue', () => {
      render(<Uncontrolled />);
      expect(screen.getByText('Claims panel')).toBeTruthy();
      expect(tab('Claims').getAttribute('aria-selected')).toBe('true');
    });

    it('keeps its own selection when clicked, and still reports it', () => {
      const onValueChange = vi.fn();
      render(<Uncontrolled onValueChange={onValueChange} />);
      fireEvent.click(tab('Notes'));
      expect(screen.getByText('Notes panel')).toBeTruthy();
      expect(screen.queryByText('Claims panel')).toBeNull();
      expect(tab('Notes').tabIndex).toBe(0);
      expect(onValueChange).toHaveBeenCalledWith('notes');
    });

    it('follows the keyboard without a parent holding the state', () => {
      render(<Uncontrolled />);
      tab('Claims').focus();
      fireEvent.keyDown(tab('Claims'), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(tab('Notes'));
      expect(screen.getByText('Notes panel')).toBeTruthy();
    });

    it('lets a given value win over defaultValue', () => {
      render(
        <Tabs value="overview" defaultValue="notes">
          <TabList>
            <Tab value="overview">Overview</Tab>
            <Tab value="notes">Notes</Tab>
          </TabList>
          <TabPanel value="overview">Overview panel</TabPanel>
          <TabPanel value="notes">Notes panel</TabPanel>
        </Tabs>,
      );
      expect(screen.getByText('Overview panel')).toBeTruthy();
    });

    it('stays put when controlled without an onValueChange', () => {
      render(
        <Tabs value="overview">
          <TabList>
            <Tab value="overview">Overview</Tab>
            <Tab value="notes">Notes</Tab>
          </TabList>
          <TabPanel value="overview">Overview panel</TabPanel>
          <TabPanel value="notes">Notes panel</TabPanel>
        </Tabs>,
      );
      fireEvent.click(tab('Notes'));
      expect(screen.getByText('Overview panel')).toBeTruthy();
    });
  });

  describe('roving tabindex', () => {
    it('lets only the selected tab be tabbed to', () => {
      render(<Harness initial="claims" />);
      expect(tab('Claims').tabIndex).toBe(0);
      expect(tab('Overview').tabIndex).toBe(-1);
      expect(tab('Notes').tabIndex).toBe(-1);
    });

    it('moves the tab stop with the selection', () => {
      render(<Harness />);
      fireEvent.click(tab('Notes'));
      expect(tab('Notes').tabIndex).toBe(0);
      expect(tab('Overview').tabIndex).toBe(-1);
    });
  });

  describe('keyboard', () => {
    it('moves to the next tab with ArrowRight, focusing and activating it', () => {
      const onValueChange = vi.fn();
      render(<Harness onValueChange={onValueChange} />);
      tab('Overview').focus();
      fireEvent.keyDown(tab('Overview'), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(tab('Claims'));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('claims');
      expect(screen.getByText('Claims panel')).toBeTruthy();
      expect(tab('Claims').tabIndex).toBe(0);
    });

    it('moves to the previous tab with ArrowLeft', () => {
      render(<Harness initial="claims" />);
      tab('Claims').focus();
      fireEvent.keyDown(tab('Claims'), { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(tab('Overview'));
      expect(screen.getByText('Overview panel')).toBeTruthy();
    });

    it('wraps from the last tab to the first with ArrowRight', () => {
      render(<Harness initial="notes" />);
      tab('Notes').focus();
      fireEvent.keyDown(tab('Notes'), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(tab('Overview'));
      expect(screen.getByText('Overview panel')).toBeTruthy();
    });

    it('wraps from the first tab to the last with ArrowLeft', () => {
      render(<Harness />);
      tab('Overview').focus();
      fireEvent.keyDown(tab('Overview'), { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(tab('Notes'));
      expect(screen.getByText('Notes panel')).toBeTruthy();
    });

    it('jumps to the first tab with Home', () => {
      render(<Harness initial="notes" />);
      tab('Notes').focus();
      fireEvent.keyDown(tab('Notes'), { key: 'Home' });
      expect(document.activeElement).toBe(tab('Overview'));
      expect(screen.getByText('Overview panel')).toBeTruthy();
    });

    it('jumps to the last tab with End', () => {
      render(<Harness />);
      tab('Overview').focus();
      fireEvent.keyDown(tab('Overview'), { key: 'End' });
      expect(document.activeElement).toBe(tab('Notes'));
      expect(screen.getByText('Notes panel')).toBeTruthy();
    });

    it('does not report a change when the key lands on the tab that is already focused', () => {
      const onValueChange = vi.fn();
      render(<Harness onValueChange={onValueChange} />);
      tab('Overview').focus();
      fireEvent.keyDown(tab('Overview'), { key: 'Home' });
      expect(document.activeElement).toBe(tab('Overview'));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('keeps the page from scrolling on the keys it handles', () => {
      render(<Harness />);
      tab('Overview').focus();
      for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
        // fireEvent returns false when the default was prevented.
        expect(
          fireEvent.keyDown(document.activeElement as Element, { key }),
        ).toBe(false);
      }
    });

    it('leaves every other key alone, so Tab still leaves the list', () => {
      const onValueChange = vi.fn();
      render(<Harness onValueChange={onValueChange} />);
      tab('Overview').focus();
      for (const key of ['Tab', 'ArrowDown', 'ArrowUp', 'Enter', 'a']) {
        expect(fireEvent.keyDown(tab('Overview'), { key })).toBe(true);
      }
      expect(onValueChange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(tab('Overview'));
    });

    it('skips a disabled tab', () => {
      render(
        <Tabs value="a" onValueChange={() => undefined}>
          <TabList>
            <Tab value="a">A</Tab>
            <Tab value="b" disabled>
              B
            </Tab>
            <Tab value="c">C</Tab>
          </TabList>
        </Tabs>,
      );
      tab('A').focus();
      fireEvent.keyDown(tab('A'), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(tab('C'));
    });

    it("still calls a tab's own onKeyDown, and lets it veto the move", () => {
      const onKeyDown = vi.fn((event: { preventDefault: () => void }) =>
        event.preventDefault(),
      );
      render(
        <Tabs value="a" onValueChange={() => undefined}>
          <TabList>
            <Tab value="a" onKeyDown={onKeyDown}>
              A
            </Tab>
            <Tab value="b">B</Tab>
          </TabList>
        </Tabs>,
      );
      tab('A').focus();
      fireEvent.keyDown(tab('A'), { key: 'ArrowRight' });
      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(document.activeElement).toBe(tab('A'));
    });
  });

  describe('look', () => {
    it('draws the list as a bordered, rounded rail on a faint brand tint', () => {
      render(<Harness />);
      const list = screen.getByRole('tablist');
      for (const name of [
        'rounded-lg',
        'border',
        'border-border',
        'bg-primary/10',
      ]) {
        expect(list.classList.contains(name), name).toBe(true);
      }
    });

    it('gives the selected tab a surface chip and the strong ink, and the others the secondary ink', () => {
      render(<Harness initial="claims" />);
      // The chip is a Surface behind the label, so the tab itself keeps its identity (and its
      // focus) when the selection moves.
      const chip = (name: string) => tab(name).querySelector('[data-surface]');
      expect(chip('Claims')?.getAttribute('data-surface')).toBe('surface');
      expect(tab('Claims').classList.contains('text-ink')).toBe(true);
      for (const name of ['Overview', 'Notes']) {
        expect(chip(name)).toBeNull();
        expect(tab(name).classList.contains('text-ink-2')).toBe(true);
      }
    });
  });

  describe('misuse', () => {
    it.each([
      ['TabList', <TabList key="l" />],
      ['Tab', <Tab key="t" value="a" />],
      ['TabPanel', <TabPanel key="p" value="a" />],
    ])('explains that <%s> belongs inside <Tabs>', (name, element) => {
      expect(() => render(element)).toThrow(
        `<${name}> must be rendered inside <Tabs>.`,
      );
    });
  });
});
