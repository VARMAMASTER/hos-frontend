import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { ButtonGroup, ButtonGroupItem } from './button-group';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function View(props: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabledItem?: string;
}) {
  return (
    <ButtonGroup aria-label="View" {...props}>
      <ButtonGroupItem value="list">List</ButtonGroupItem>
      <ButtonGroupItem value="grid" disabled={props.disabledItem === 'grid'}>
        Grid
      </ButtonGroupItem>
      <ButtonGroupItem value="map" disabled={props.disabledItem === 'map'}>
        Map
      </ButtonGroupItem>
    </ButtonGroup>
  );
}

const radio = (name: string) => screen.getByRole('radio', { name });

describe('ButtonGroup, single select', () => {
  it('is a named radio group of radios, none selected by default', () => {
    render(<View />);
    const group = screen.getByRole('radiogroup', { name: 'View' });
    expect(within(group).getAllByRole('radio')).toHaveLength(3);
    for (const name of ['List', 'Grid', 'Map']) {
      expect(radio(name).getAttribute('aria-checked')).toBe('false');
      expect(radio(name).getAttribute('type')).toBe('button');
    }
  });

  it('puts the selected radio in the Tab order and the others out of it (roving tabindex)', () => {
    render(<View defaultValue="grid" />);
    expect(radio('Grid').getAttribute('tabindex')).toBe('0');
    expect(radio('List').getAttribute('tabindex')).toBe('-1');
    expect(radio('Map').getAttribute('tabindex')).toBe('-1');
  });

  it('leaves the first enabled radio as the tab stop while nothing is selected', () => {
    render(<View disabledItem="grid" />);
    expect(radio('List').getAttribute('tabindex')).toBe('0');
    expect(radio('Grid').getAttribute('tabindex')).toBe('-1');
    expect(radio('Map').getAttribute('tabindex')).toBe('-1');
  });

  it('selects on click and reports the new value once', () => {
    const onValueChange = vi.fn();
    render(<View onValueChange={onValueChange} />);
    fireEvent.click(radio('Grid'));
    expect(radio('Grid').getAttribute('aria-checked')).toBe('true');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith('grid');
    // A radio is not a toggle: clicking the chosen one changes nothing.
    fireEvent.click(radio('Grid'));
    expect(radio('Grid').getAttribute('aria-checked')).toBe('true');
    expect(onValueChange).toHaveBeenCalledTimes(1);
    fireEvent.click(radio('Map'));
    expect(radio('Grid').getAttribute('aria-checked')).toBe('false');
    expect(onValueChange).toHaveBeenLastCalledWith('map');
  });

  it('only asks when controlled: the parent decides', () => {
    const onValueChange = vi.fn();
    render(<View value="list" onValueChange={onValueChange} />);
    fireEvent.click(radio('Grid'));
    expect(onValueChange).toHaveBeenCalledWith('grid');
    expect(radio('List').getAttribute('aria-checked')).toBe('true');
    expect(radio('Grid').getAttribute('aria-checked')).toBe('false');
  });

  it('follows a controlled parent as it changes', () => {
    function Parent() {
      const [value, setValue] = useState('list');
      return (
        <>
          <View value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue('map')}>
            to map
          </button>
        </>
      );
    }
    render(<Parent />);
    fireEvent.click(screen.getByText('to map'));
    expect(radio('Map').getAttribute('aria-checked')).toBe('true');
    fireEvent.click(radio('List'));
    expect(radio('List').getAttribute('aria-checked')).toBe('true');
  });

  describe('keyboard', () => {
    it('moves to the next radio on ArrowRight and ArrowDown, selecting and focusing it', () => {
      render(<View defaultValue="list" />);
      radio('List').focus();
      expect(fireEvent.keyDown(radio('List'), { key: 'ArrowRight' })).toBe(
        false,
      );
      expect(document.activeElement).toBe(radio('Grid'));
      expect(radio('Grid').getAttribute('aria-checked')).toBe('true');
      fireEvent.keyDown(radio('Grid'), { key: 'ArrowDown' });
      expect(document.activeElement).toBe(radio('Map'));
      expect(radio('Map').getAttribute('aria-checked')).toBe('true');
    });

    it('moves back on ArrowLeft and ArrowUp, wrapping at the ends', () => {
      render(<View defaultValue="list" />);
      radio('List').focus();
      fireEvent.keyDown(radio('List'), { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(radio('Map'));
      fireEvent.keyDown(radio('Map'), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(radio('List'));
      fireEvent.keyDown(radio('List'), { key: 'ArrowUp' });
      expect(document.activeElement).toBe(radio('Map'));
    });

    it('jumps to the ends on Home and End', () => {
      render(<View defaultValue="grid" />);
      radio('Grid').focus();
      fireEvent.keyDown(radio('Grid'), { key: 'End' });
      expect(document.activeElement).toBe(radio('Map'));
      fireEvent.keyDown(radio('Map'), { key: 'Home' });
      expect(document.activeElement).toBe(radio('List'));
    });

    it('skips a disabled radio', () => {
      render(<View defaultValue="list" disabledItem="grid" />);
      radio('List').focus();
      fireEvent.keyDown(radio('List'), { key: 'ArrowRight' });
      expect(document.activeElement).toBe(radio('Map'));
    });

    it('leaves other keys alone, so Tab and typing still work', () => {
      render(<View defaultValue="list" />);
      expect(fireEvent.keyDown(radio('List'), { key: 'Tab' })).toBe(true);
      expect(fireEvent.keyDown(radio('List'), { key: 'a' })).toBe(true);
    });

    it('lets a caller cancel the move from its own onKeyDown', () => {
      render(
        <ButtonGroup aria-label="View" defaultValue="a">
          <ButtonGroupItem value="a" onKeyDown={(e) => e.preventDefault()}>
            A
          </ButtonGroupItem>
          <ButtonGroupItem value="b">B</ButtonGroupItem>
        </ButtonGroup>,
      );
      fireEvent.keyDown(radio('A'), { key: 'ArrowRight' });
      expect(radio('A').getAttribute('aria-checked')).toBe('true');
    });
  });

  it('does not select a disabled radio, and disabling the group disables every one', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <View disabledItem="grid" onValueChange={onValueChange} />,
    );
    fireEvent.click(radio('Grid'));
    expect(onValueChange).not.toHaveBeenCalled();
    rerender(
      <ButtonGroup aria-label="View" disabled onValueChange={onValueChange}>
        <ButtonGroupItem value="list">List</ButtonGroupItem>
        <ButtonGroupItem value="grid">Grid</ButtonGroupItem>
      </ButtonGroup>,
    );
    fireEvent.click(radio('List'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect((radio('List') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('ButtonGroup, multiple select', () => {
  function Filters(props: {
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
  }) {
    return (
      <ButtonGroup type="multiple" aria-label="Wards" {...props}>
        <ButtonGroupItem value="icu">ICU</ButtonGroupItem>
        <ButtonGroupItem value="ward">Ward</ButtonGroupItem>
        <ButtonGroupItem value="er">ER</ButtonGroupItem>
      </ButtonGroup>
    );
  }

  it('is a named group of toggle buttons with aria-pressed, all in the Tab order', () => {
    render(<Filters defaultValue={['ward']} />);
    expect(screen.getByRole('group', { name: 'Wards' })).toBeTruthy();
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    const icu = screen.getByRole('button', { name: 'ICU' });
    const ward = screen.getByRole('button', { name: 'Ward' });
    expect(icu.getAttribute('aria-pressed')).toBe('false');
    expect(ward.getAttribute('aria-pressed')).toBe('true');
    expect(icu.getAttribute('tabindex')).toBeNull();
    expect(ward.getAttribute('tabindex')).toBeNull();
  });

  it('toggles each button independently and reports the whole selection', () => {
    const onValueChange = vi.fn();
    render(<Filters onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'ICU' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['icu']);
    fireEvent.click(screen.getByRole('button', { name: 'ER' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['icu', 'er']);
    fireEvent.click(screen.getByRole('button', { name: 'ICU' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['er']);
    expect(
      screen.getByRole('button', { name: 'ER' }).getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('only asks when controlled', () => {
    const onValueChange = vi.fn();
    render(<Filters value={['icu']} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ward' }));
    expect(onValueChange).toHaveBeenCalledWith(['icu', 'ward']);
    expect(
      screen.getByRole('button', { name: 'Ward' }).getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('shows a tick on a pressed button, so the state is not colour alone, and none for the sliding indicator', () => {
    render(<Filters defaultValue={['icu']} />);
    const group = screen.getByRole('group', { name: 'Wards' });
    expect(group.querySelector('[data-slot="indicator"]')).toBeNull();
    const icu = screen.getByRole('button', { name: 'ICU' });
    expect(
      icu.querySelector('[data-slot="tick"]')?.getAttribute('data-state'),
    ).toBe('on');
    expect(
      screen
        .getByRole('button', { name: 'Ward' })
        .querySelector('[data-slot="tick"]')
        ?.getAttribute('data-state'),
    ).toBe('off');
  });
});

describe('ButtonGroup, the shape', () => {
  it('is connected segments with a small gap, in the Button sizes', () => {
    render(<View />);
    const group = screen.getByRole('radiogroup');
    expect([...group.classList]).toEqual(
      expect.arrayContaining(['inline-flex', 'gap-s0', 'relative']),
    );
    expect([...radio('List').classList]).toEqual(
      expect.arrayContaining([
        'px-control-md',
        'py-control-md',
        'text-control',
        'font-semibold',
      ]),
    );
    cleanup();
    render(
      <ButtonGroup aria-label="View" size="sm">
        <ButtonGroupItem value="list">List</ButtonGroupItem>
      </ButtonGroup>,
    );
    expect([...radio('List').classList]).toEqual(
      expect.arrayContaining(['px-control-sm', 'py-control-sm', 'text-label']),
    );
    expect(radio('List').dataset['size']).toBe('sm');
  });

  // 8px to 18px: the segments are 30 to 36px tall, so 18px is already the full pill.
  it('morphs a segment from soft corners to a pill when selected, animating the radius under motion-safe', () => {
    render(<View defaultValue="grid" />);
    expect([...radio('List').classList]).toContain('rounded-control');
    expect([...radio('List').classList]).not.toContain('rounded-overlay');
    expect([...radio('Grid').classList]).toContain('rounded-overlay');
    expect([...radio('Grid').classList]).not.toContain('rounded-control');
    for (const name of ['List', 'Grid']) {
      const cls = radio(name).className;
      expect(cls).toMatch(/motion-safe:transition-\[[^\]]*border-radius/);
      expect(cls).not.toMatch(/(^|\s)(?:transition|duration)-/);
      expect(cls).toContain('motion-safe:active:scale-95');
    }
  });

  it('draws the 3:1 control edge on a segment, never a shadow or a squircle', () => {
    render(<View />);
    expect([...radio('List').classList]).toContain('border-border-control');
    expect(radio('List').className).not.toMatch(/shadow|corner-shape/);
  });

  it('has an icon-only form, named by its aria-label, with the icon hidden from assistive technology', () => {
    render(
      <ButtonGroup aria-label="View" defaultValue="list">
        <ButtonGroupItem
          value="list"
          aria-label="List view"
          icon={<svg data-testid="list-glyph" />}
        />
        <ButtonGroupItem
          value="grid"
          aria-label="Grid view"
          icon={<svg data-testid="grid-glyph" />}
        />
      </ButtonGroup>,
    );
    const list = radio('List view');
    expect(list.getAttribute('aria-checked')).toBe('true');
    expect(
      screen
        .getByTestId('list-glyph')
        .parentElement?.getAttribute('aria-hidden'),
    ).toBe('true');
    // Square, not padded like a text segment.
    expect([...list.classList]).toContain('p-s3');
    expect([...list.classList]).not.toContain('px-control-md');
  });

  it('shows an icon beside a label', () => {
    render(
      <ButtonGroup aria-label="View">
        <ButtonGroupItem value="list" icon={<svg data-testid="glyph" />}>
          List
        </ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(radio('List')).toBeTruthy();
    expect(radio('List').contains(screen.getByTestId('glyph'))).toBe(true);
  });

  it('forwards a ref and merges className on the group, and passes attributes through', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ButtonGroup ref={ref} aria-label="View" className="mt-4" data-testid="g">
        <ButtonGroupItem value="a" className="ml-2" data-testid="a">
          A
        </ButtonGroupItem>
      </ButtonGroup>,
    );
    expect(ref.current).toBe(screen.getByTestId('g'));
    expect(ref.current?.classList.contains('mt-4')).toBe(true);
    expect(screen.getByTestId('a').classList.contains('ml-2')).toBe(true);
  });

  it('fails fast when an item is rendered outside a group', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      render(<ButtonGroupItem value="a">A</ButtonGroupItem>),
    ).toThrow(/ButtonGroupItem.*ButtonGroup/);
  });
});

describe('ButtonGroup, the sliding indicator', () => {
  // jsdom has no layout, so the offsets come from the segment's value.
  function mockLayout(offsets: Record<string, [number, number]>) {
    const at = (el: HTMLElement) => offsets[el.dataset['value'] ?? ''];
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(
      function (this: HTMLElement) {
        return at(this)?.[0] ?? 0;
      },
    );
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
      function (this: HTMLElement) {
        return at(this)?.[1] ?? 0;
      },
    );
  }

  const indicator = () =>
    screen
      .getByRole('radiogroup')
      .querySelector('[data-slot="indicator"]') as HTMLElement | null;

  it('draws nothing while no segment is selected', () => {
    mockLayout({ list: [0, 60], grid: [62, 60], map: [124, 60] });
    render(<View />);
    expect(indicator()).toBeNull();
  });

  it('sits under the selected segment and is decorative', () => {
    mockLayout({ list: [0, 60], grid: [62, 70], map: [134, 60] });
    render(<View defaultValue="grid" />);
    const bar = indicator() as HTMLElement;
    expect(bar.getAttribute('aria-hidden')).toBe('true');
    expect(bar.style.transform).toBe('translateX(62px)');
    expect(bar.style.width).toBe('70px');
    expect([...bar.classList]).toEqual(
      expect.arrayContaining(['absolute', 'bg-primary', 'rounded-overlay']),
    );
  });

  it('slides to the next segment, by transform and width, under motion-safe only', () => {
    mockLayout({ list: [0, 60], grid: [62, 70], map: [134, 60] });
    render(<View defaultValue="list" />);
    expect(indicator()?.style.transform).toBe('translateX(0px)');
    fireEvent.click(radio('Map'));
    expect(indicator()?.style.transform).toBe('translateX(134px)');
    expect(indicator()?.style.width).toBe('60px');
    expect(indicator()?.className).toMatch(
      /motion-safe:transition-\[transform,width\]/,
    );
    expect(indicator()?.className).not.toMatch(
      /(^|\s)(?:transition|duration)-/,
    );
  });

  it('fills the selected segment itself until the indicator is measured, so it is never unreadable', () => {
    // No mocked layout: every width is 0, nothing to draw.
    render(<View defaultValue="grid" />);
    expect(indicator()).toBeNull();
    expect([...radio('Grid').classList]).toContain('bg-primary');
  });

  it('hands the fill to the indicator once it is drawn', () => {
    mockLayout({ list: [0, 60], grid: [62, 70], map: [134, 60] });
    render(<View defaultValue="grid" />);
    expect([...radio('Grid').classList]).toContain('bg-transparent');
    expect([...radio('Grid').classList]).not.toContain('bg-primary');
    expect([...radio('Grid').classList]).toContain('text-on-primary');
  });
});

describe('ButtonGroupItem loading state', () => {
  it('renders a spinner, sets aria-busy, and disables the item', () => {
    const handleSelect = vi.fn();
    render(
      <ButtonGroup aria-label="Actions" onValueChange={handleSelect}>
        <ButtonGroupItem value="a">Option A</ButtonGroupItem>
        <ButtonGroupItem value="b" loading>
          Option B
        </ButtonGroupItem>
      </ButtonGroup>,
    );

    const itemB = screen.getByRole('radio', { name: 'Option B' });
    expect(itemB.getAttribute('aria-busy')).toBe('true');
    expect((itemB as HTMLButtonElement).disabled).toBe(true);
    expect(itemB.className).toContain('cursor-progress');

    // Spinner is present
    const spinner = itemB.querySelector('[data-spinner]');
    expect(spinner).not.toBeNull();
    expect(spinner?.getAttribute('aria-hidden')).toBe('true');

    // Label container has opacity-0 to conceal text behind spinner while keeping accessible name
    const labelSpan = itemB.querySelector('span.opacity-0');
    expect(labelSpan).not.toBeNull();
    expect(labelSpan?.textContent).toBe('Option B');

    // Clicks are prevented
    fireEvent.click(itemB);
    expect(handleSelect).not.toHaveBeenCalled();
  });
});
