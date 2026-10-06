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

    // Unselected panels are not mounted, so pointing at them would name ids that do not exist.
    it('points aria-controls only from the selected tab, at a panel that exists', () => {
      render(<Harness initial="claims" />);
      expect(tab('Overview').hasAttribute('aria-controls')).toBe(false);
      expect(tab('Notes').hasAttribute('aria-controls')).toBe(false);
      const controls = tab('Claims').getAttribute('aria-controls') ?? '';
      expect(document.getElementById(controls)).toBe(
        screen.getByRole('tabpanel'),
      );
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

    // Without a tab stop the whole tablist is skipped by Tab, so a keyboard user could never reach it.
    function stops() {
      return screen
        .getAllByRole('tab')
        .filter((element) => element.tabIndex === 0)
        .map((element) => element.textContent);
    }

    it('makes the first tab the tab stop when nothing is selected', () => {
      render(
        <Tabs>
          <TabList>
            <Tab value="a">A</Tab>
            <Tab value="b">B</Tab>
          </TabList>
        </Tabs>,
      );
      expect(stops()).toEqual(['A']);
    });

    it('skips a disabled first tab when choosing the fallback tab stop', () => {
      render(
        <Tabs>
          <TabList>
            <Tab value="a" disabled>
              A
            </Tab>
            <Tab value="b">B</Tab>
            <Tab value="c">C</Tab>
          </TabList>
        </Tabs>,
      );
      expect(stops()).toEqual(['B']);
    });

    it('falls back to the first enabled tab when the selected tab is disabled', () => {
      render(
        <Tabs value="b" onValueChange={() => undefined}>
          <TabList>
            <Tab value="a">A</Tab>
            <Tab value="b" disabled>
              B
            </Tab>
          </TabList>
        </Tabs>,
      );
      expect(stops()).toEqual(['A']);
    });

    it('falls back to the first enabled tab when the value names no tab in the list', () => {
      render(
        <Tabs value="gone" onValueChange={() => undefined}>
          <TabList>
            <Tab value="a">A</Tab>
            <Tab value="b">B</Tab>
          </TabList>
        </Tabs>,
      );
      expect(stops()).toEqual(['A']);
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
    // The prototype's .tabbar: opaque, so the unselected tabs' secondary ink is text on the tinted
    // canvas, which material.spec.ts proves at 4.5:1.
    it('draws the list as the prototype tab rail', () => {
      render(<Harness />);
      const list = screen.getByRole('tablist');
      expect([...list.classList]).toEqual(
        expect.arrayContaining([
          'nova-tabbar',
          'rounded-md',
          'p-1.5',
          'gap-0.5',
        ]),
      );
      expect(list.className).not.toMatch(/bg-primary/);
    });

    it('raises the selected tab as a white chip with its hairline and shadow, and gives the others the secondary ink', () => {
      render(<Harness initial="claims" />);
      expect([...tab('Claims').classList]).toEqual(
        expect.arrayContaining([
          'bg-surface',
          'text-chrome-1',
          'shadow-sm',
          'ring-1',
          'ring-inset',
        ]),
      );
      for (const name of ['Overview', 'Notes']) {
        expect(tab(name).classList.contains('bg-surface')).toBe(false);
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

describe('Tabs, the prototype .tab', () => {
  it('sets every tab label at 13px semibold on 8px by 16px, with a quick ease-out transition', () => {
    render(<Harness />);
    for (const name of ['Overview', 'Claims', 'Notes']) {
      expect([...tab(name).classList]).toEqual(
        expect.arrayContaining([
          'text-[13px]',
          'font-semibold',
          'px-4',
          'py-2',
          'duration-150',
          'ease-out',
        ]),
      );
      expect(tab(name).className).not.toMatch(
        /text-sm|font-medium|corner-shape/,
      );
    }
  });
});
