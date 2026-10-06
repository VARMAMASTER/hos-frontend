import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { ChoiceCard, ChoiceCardGroup } from './choice-card';

afterEach(() => cleanup());

describe('ChoiceCard', () => {
  it('is a real radio input named by its title and described by its description', () => {
    render(
      <ChoiceCard
        name="admission"
        value="emergency"
        title="Emergency"
        description="Unplanned, needs a bed now."
      />,
    );
    const input = screen.getByRole('radio', { name: 'Emergency' });
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.getAttribute('name')).toBe('admission');
    expect(input.getAttribute('value')).toBe('emergency');
    expect(input.getAttribute('aria-describedby')).toBe(
      screen.getByText('Unplanned, needs a bed now.').id,
    );
  });

  it('is a checkbox with type="checkbox"', () => {
    render(<ChoiceCard type="checkbox" title="Isolation bed" />);
    expect(
      screen.getByRole('checkbox', { name: 'Isolation bed' }),
    ).toBeInstanceOf(HTMLInputElement);
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('makes the whole card the label, so a click anywhere on it chooses', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ChoiceCard
        name="a"
        title="Planned"
        description="Booked ahead."
        badge={<span>Most common</span>}
        onChange={onChange}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('LABEL');
    expect(root.contains(screen.getByRole('radio'))).toBe(true);
    const input = screen.getByRole<HTMLInputElement>('radio');
    fireEvent.click(screen.getByText('Booked ahead.'));
    expect(input.checked).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Most common'));
    expect(onChange).toHaveBeenCalledTimes(1); // already chosen, a radio does not change again
  });

  it('toggles a checkbox card from any part of it', () => {
    render(<ChoiceCard type="checkbox" title="Isolation bed" />);
    const input = screen.getByRole<HTMLInputElement>('checkbox');
    fireEvent.click(screen.getByText('Isolation bed'));
    expect(input.checked).toBe(true);
    fireEvent.click(screen.getByText('Isolation bed'));
    expect(input.checked).toBe(false);
  });

  it('shows an optional icon (hidden from assistive technology) and badge', () => {
    render(
      <ChoiceCard
        name="a"
        title="Day care"
        icon={<svg data-testid="glyph" />}
        badge={<span>New</span>}
      />,
    );
    expect(
      screen.getByTestId('glyph').parentElement?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(screen.getByText('New')).toBeTruthy();
    // The badge is not part of the name: the input is named by the title.
    expect(screen.getByRole('radio', { name: 'Day care' })).toBeTruthy();
  });

  it('is a card surface, opaque under either material, with the card radius', () => {
    const { container } = render(<ChoiceCard name="a" title="Planned" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset['surface']).toBe('card');
    expect([...root.classList]).toEqual(
      expect.arrayContaining(['rounded-md', 'p-4']),
    );
    expect(root.className).not.toMatch(/shadow|corner-shape|backdrop/);
  });

  // Selected: a tinted fill and a primary edge, both reached from the checked input (:has), plus the
  // radio dot or tick itself, so the state is never colour alone.
  it('tints the fill and recolours the edge to the primary when its input is checked', () => {
    const { container } = render(<ChoiceCard name="a" title="Planned" />);
    const root = container.firstElementChild as HTMLElement;
    expect([...root.classList]).toContain(
      'has-checked:[--nova-card-edge:var(--nova-color-primary)]',
    );
    const tint = root.querySelector('[data-slot="tint"]') as HTMLElement;
    expect(tint.getAttribute('aria-hidden')).toBe('true');
    expect([...tint.classList]).toEqual(
      expect.arrayContaining([
        'bg-primary-ghost',
        'opacity-0',
        'group-has-checked:opacity-100',
        'nova-radius-inherit',
        'motion-safe:transition-opacity',
      ]),
    );
    expect(tint.className).not.toMatch(/(^|\s)(?:transition|duration)-/);
  });

  it('draws the radio dot or the checkbox tick as a shape beside the title', () => {
    const { container, rerender } = render(
      <ChoiceCard name="a" title="Planned" />,
    );
    expect(container.querySelector('svg')).not.toBeNull();
    expect(container.querySelector('svg[data-mark]')).toBeNull();
    rerender(<ChoiceCard type="checkbox" title="Planned" />);
    expect(container.querySelector('svg[data-mark="check"]')).not.toBeNull();
  });

  it('can start chosen and can be controlled', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ChoiceCard name="a" title="Planned" defaultChecked />,
    );
    expect(screen.getByRole<HTMLInputElement>('radio').checked).toBe(true);
    rerender(
      <ChoiceCard
        name="b"
        title="Planned"
        checked={false}
        onChange={onChange}
      />,
    );
    // Controlled and off: the click reports, the parent decides.
    fireEvent.click(screen.getByRole('radio'));
    expect(onChange).toHaveBeenCalled();
  });

  it('disables the input, dims the card and blocks the change', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ChoiceCard name="a" title="Planned" disabled onChange={onChange} />,
    );
    const root = container.firstElementChild as HTMLElement;
    const input = screen.getByRole<HTMLInputElement>('radio');
    expect(input.disabled).toBe(true);
    expect([...root.classList]).toEqual(
      expect.arrayContaining(['opacity-50', 'cursor-not-allowed']),
    );
    expect([...root.classList]).not.toContain('cursor-pointer');
    fireEvent.click(screen.getByText('Planned'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('forwards its ref to the input, merges className on the card and passes attributes to the input', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <ChoiceCard
        ref={ref}
        name="a"
        title="Planned"
        className="mt-4"
        data-testid="planned"
        required
      />,
    );
    expect(ref.current).toBe(screen.getByRole('radio'));
    expect(ref.current?.dataset['testid']).toBe('planned');
    expect(ref.current?.required).toBe(true);
    expect((container.firstElementChild as HTMLElement).classList).toContain(
      'mt-4',
    );
  });

  it('gives the title the prototype 13.5px semibold and the description 12.5px ink-2', () => {
    render(<ChoiceCard name="a" title="Planned" description="Booked ahead." />);
    expect([...screen.getByText('Planned').classList]).toEqual(
      expect.arrayContaining(['text-[13.5px]', 'font-semibold', 'text-ink']),
    );
    expect([...screen.getByText('Booked ahead.').classList]).toEqual(
      expect.arrayContaining(['text-[12.5px]', 'text-ink-2']),
    );
  });
});

describe('ChoiceCardGroup, single', () => {
  function Admission(props: {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
  }) {
    return (
      <ChoiceCardGroup legend="Admission type" name="admission" {...props}>
        <ChoiceCard value="emergency" title="Emergency" />
        <ChoiceCard value="planned" title="Planned" />
        <ChoiceCard value="daycare" title="Day care" />
      </ChoiceCardGroup>
    );
  }

  it('is a fieldset named by its legend, whose radios share one name', () => {
    render(<Admission />);
    const group = screen.getByRole('group', { name: 'Admission type' });
    expect(group.tagName).toBe('FIELDSET');
    const radios = within(group).getAllByRole<HTMLInputElement>('radio');
    expect(radios).toHaveLength(3);
    expect(new Set(radios.map((r) => r.name))).toEqual(new Set(['admission']));
  });

  it('chooses one at a time, uncontrolled, and reports the value', () => {
    const onValueChange = vi.fn();
    render(<Admission onValueChange={onValueChange} />);
    fireEvent.click(screen.getByText('Planned'));
    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'Planned' }).checked,
    ).toBe(true);
    expect(onValueChange).toHaveBeenLastCalledWith('planned');
    fireEvent.click(screen.getByText('Day care'));
    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'Planned' }).checked,
    ).toBe(false);
    expect(onValueChange).toHaveBeenLastCalledWith('daycare');
  });

  it('starts from defaultValue', () => {
    render(<Admission defaultValue="emergency" />);
    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'Emergency' })
        .checked,
    ).toBe(true);
  });

  it('only asks when controlled: the parent decides', () => {
    const onValueChange = vi.fn();
    render(<Admission value="emergency" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByText('Planned'));
    expect(onValueChange).toHaveBeenCalledWith('planned');
    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'Emergency' })
        .checked,
    ).toBe(true);
    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'Planned' }).checked,
    ).toBe(false);
  });

  it('follows a controlled parent', () => {
    function Parent() {
      const [value, setValue] = useState('emergency');
      return (
        <>
          <Admission value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue('daycare')}>
            set
          </button>
        </>
      );
    }
    render(<Parent />);
    fireEvent.click(screen.getByText('set'));
    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'Day care' }).checked,
    ).toBe(true);
    fireEvent.click(screen.getByText('Planned'));
    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'Planned' }).checked,
    ).toBe(true);
  });

  // The platform gives a radio group its keyboard: one Tab stop, arrow keys move and choose. The
  // group keeps that by rendering real inputs that share a name, never hiding them from the Tab order.
  it('leaves the keyboard to the platform: real, focusable radios, none removed from the Tab order', () => {
    render(<Admission />);
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.getAttribute('tabindex')).toBeNull();
    }
  });

  it('disables every card with the group', () => {
    render(<Admission disabled />);
    expect(screen.getByRole('group').hasAttribute('disabled')).toBe(true);
    for (const radio of screen.getAllByRole<HTMLInputElement>('radio')) {
      expect(radio.disabled).toBe(true);
    }
  });

  it('lays the cards out in a grid, in the requested columns', () => {
    render(
      <ChoiceCardGroup legend="Admission type" name="a" columns={2}>
        <ChoiceCard value="x" title="X" />
      </ChoiceCardGroup>,
    );
    const grid = screen.getByRole('radio').closest('[data-slot="cards"]');
    expect([...(grid as HTMLElement).classList]).toEqual(
      expect.arrayContaining(['grid', 'gap-3', 'sm:grid-cols-2']),
    );
  });

  it('forwards its ref to the fieldset and merges className', () => {
    const ref = createRef<HTMLFieldSetElement>();
    render(
      <ChoiceCardGroup
        ref={ref}
        legend="Admission type"
        name="a"
        className="mt-4"
      >
        <ChoiceCard value="x" title="X" />
      </ChoiceCardGroup>,
    );
    expect(ref.current).toBe(screen.getByRole('group'));
    expect(ref.current?.classList).toContain('mt-4');
  });
});

describe('ChoiceCardGroup, multiple', () => {
  it('is a set of checkbox cards over an array value', () => {
    const onValueChange = vi.fn();
    render(
      <ChoiceCardGroup
        type="multiple"
        legend="Needs"
        name="needs"
        defaultValue={['oxygen']}
        onValueChange={onValueChange}
      >
        <ChoiceCard value="oxygen" title="Oxygen" />
        <ChoiceCard value="isolation" title="Isolation" />
      </ChoiceCardGroup>,
    );
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(
      screen.getByRole<HTMLInputElement>('checkbox', { name: 'Oxygen' })
        .checked,
    ).toBe(true);
    fireEvent.click(screen.getByText('Isolation'));
    expect(onValueChange).toHaveBeenLastCalledWith(['oxygen', 'isolation']);
    fireEvent.click(screen.getByText('Oxygen'));
    expect(onValueChange).toHaveBeenLastCalledWith(['isolation']);
  });

  it('is controlled by an array', () => {
    const onValueChange = vi.fn();
    render(
      <ChoiceCardGroup
        type="multiple"
        legend="Needs"
        name="needs"
        value={[]}
        onValueChange={onValueChange}
      >
        <ChoiceCard value="oxygen" title="Oxygen" />
      </ChoiceCardGroup>,
    );
    fireEvent.click(screen.getByText('Oxygen'));
    expect(onValueChange).toHaveBeenCalledWith(['oxygen']);
    expect(
      screen.getByRole<HTMLInputElement>('checkbox', { name: 'Oxygen' })
        .checked,
    ).toBe(false);
  });
});
