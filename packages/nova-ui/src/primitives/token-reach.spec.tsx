// Changing a token changes the component. The four reference components (Button, TextField, Card,
// Chip) are rendered and each element's padding, height, radius and type worked out the way the
// browser would, from the compiled token layer (test/token-css.ts: a class that is not a token has no
// style at all). It then overrides the scale, a component token, the radius scale and a type role, and
// checks that the computed values follow.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { Button } from '../components/button/button';
import { Card, CardBody, CardHeader } from '../components/card/card';
import { Chip } from '../components/chip/chip';
import { TextField } from '../components/text-field/text-field';
import { computed, declared, resolve, rootTokens } from '../test/token-css';

afterEach(() => cleanup());

const mount = (ui: ReactElement) => render(ui).container;
const one = (container: HTMLElement, selector: string): Element => {
  const element = container.querySelector(selector);
  if (element === null) throw new Error(`no ${selector}`);
  return element;
};

describe('changing a token changes the component (the reference components)', () => {
  const parts = () => {
    const button = one(mount(<Button>Save</Button>), 'button');
    const small = one(mount(<Button size="sm">Save</Button>), 'button');
    const field = mount(<TextField label="Ward" />);
    const card = mount(
      <Card>
        <CardHeader title="Vitals" />
        <CardBody>Ramesh</CardBody>
      </Card>,
    );
    const chip = one(mount(<Chip tone="good">Stable</Chip>), 'span');
    return {
      button,
      small,
      input: one(field, 'input'),
      label: one(field, 'label'),
      card: one(card, '[data-surface]'),
      head: one(card, '.nova-card-head'),
      heading: one(card, 'h2'),
      body: one(card, '[data-surface] > div:last-child'),
      chip,
    };
  };

  it('renders the prototype values from the tokens as they are', () => {
    const p = parts();
    expect(computed(p.button, 'padding-inline')).toBe('16px');
    expect(computed(p.button, 'padding-block')).toBe('8px');
    expect(computed(p.button, 'font-size')).toBe('13px');
    expect(computed(p.button, 'line-height')).toBe('1.55');
    expect(computed(p.button, 'border-radius')).toBe('8px');
    expect(computed(p.button, 'min-height')).toBe('38.15px');
    expect(computed(p.small, 'padding-inline')).toBe('10px');
    expect(computed(p.small, 'padding-block')).toBe('6px');
    expect(computed(p.small, 'font-size')).toBe('12px');
    expect(computed(p.input, 'padding-left')).toBe('10px');
    expect(computed(p.input, 'padding-right')).toBe('10px');
    expect(computed(p.input, 'height')).toBe('38.15px');
    expect(computed(p.input, 'font-size')).toBe('13.5px');
    expect(computed(p.input, 'border-radius')).toBe('8px');
    expect(computed(p.label, 'font-size')).toBe('12px');
    expect(computed(p.card, 'border-radius')).toBe('12px');
    expect(computed(p.body, 'padding')).toBe('16px');
    expect(computed(p.head, 'padding-inline')).toBe('16px');
    expect(computed(p.head, 'padding-block')).toBe('12px');
    expect(computed(p.heading, 'font-size')).toBe('17px');
    expect(computed(p.chip, 'padding-inline')).toBe('8px');
    expect(computed(p.chip, 'padding-block')).toBe('2px');
    expect(computed(p.chip, 'gap')).toBe('6px');
    expect(computed(p.chip, 'font-size')).toBe('11.5px');
    expect(computed(p.chip, 'border-radius')).toBe('999px');
  });

  it('follows the spacing scale: --nova-space-* moves every padding built on it', () => {
    const p = parts();
    const scale = {
      '--nova-space-0': '3px',
      '--nova-space-2': '7px',
      '--nova-space-3': '11px',
      '--nova-space-4': '13px',
      '--nova-space-5': '15px',
      '--nova-space-6': '30px',
    };
    expect(computed(p.button, 'padding-inline', scale)).toBe('30px');
    expect(computed(p.button, 'padding-block', scale)).toBe('11px');
    // The height is built on the padding, so it moves with it.
    expect(computed(p.button, 'min-height', scale)).toBe('44.15px');
    expect(computed(p.input, 'height', scale)).toBe('44.15px');
    expect(computed(p.small, 'padding-inline', scale)).toBe('13px');
    expect(computed(p.input, 'padding-left', scale)).toBe('13px');
    expect(computed(p.body, 'padding', scale)).toBe('30px');
    expect(computed(p.head, 'padding-inline', scale)).toBe('30px');
    expect(computed(p.head, 'padding-block', scale)).toBe('15px');
    expect(computed(p.chip, 'padding-inline', scale)).toBe('11px');
    expect(computed(p.chip, 'padding-block', scale)).toBe('3px');
    expect(computed(p.chip, 'gap', scale)).toBe('7px');
  });

  it('follows a component token: one control height and padding for the button and the field', () => {
    const p = parts();
    const control = {
      '--nova-control-h-md': '50px',
      '--nova-control-px-md': '21px',
      '--nova-field-px': '14px',
    };
    expect(computed(p.button, 'min-height', control)).toBe('50px');
    expect(computed(p.input, 'height', control)).toBe('50px');
    expect(computed(p.button, 'padding-inline', control)).toBe('21px');
    expect(computed(p.input, 'padding-left', control)).toBe('14px');
  });

  it('follows the radius scale and the radius roles', () => {
    const p = parts();
    const scale = {
      '--nova-radius-sm': '3px',
      '--nova-radius-md': '9px',
      '--nova-radius-full': '40px',
    };
    expect(computed(p.button, 'border-radius', scale)).toBe('3px');
    expect(computed(p.input, 'border-radius', scale)).toBe('3px');
    expect(computed(p.card, 'border-radius', scale)).toBe('9px');
    expect(computed(p.chip, 'border-radius', scale)).toBe('40px');
    const role = {
      '--nova-radius-control': '5px',
      '--nova-radius-card': '1px',
    };
    expect(computed(p.button, 'border-radius', role)).toBe('5px');
    expect(computed(p.input, 'border-radius', role)).toBe('5px');
    expect(computed(p.card, 'border-radius', role)).toBe('1px');
  });

  it('follows the type roles: size and line height', () => {
    const p = parts();
    const type = {
      '--nova-text-control': '15px',
      '--nova-text-label': '11px',
      '--nova-text-input': '16px',
      '--nova-text-caption': '12px',
      '--nova-text-title': '19px',
      '--nova-leading-body': '2',
    };
    expect(computed(p.button, 'font-size', type)).toBe('15px');
    expect(computed(p.button, 'line-height', type)).toBe('2');
    expect(computed(p.small, 'font-size', type)).toBe('11px');
    expect(computed(p.label, 'font-size', type)).toBe('11px');
    expect(computed(p.input, 'font-size', type)).toBe('16px');
    expect(computed(p.chip, 'font-size', type)).toBe('12px');
    expect(computed(p.heading, 'font-size', type)).toBe('19px');
    // The control height is built on the label's type role too.
    expect(computed(p.button, 'min-height', type)).toBe(
      `${8 * 2 + 15 * 2 + 2}px`,
    );
  });

  it('would catch a component that bypasses the tokens: a scale name or a literal has no style', () => {
    const element = document.createElement('div');
    element.className = 'rounded-md p-4 text-[13px]';
    expect(declared(element)).not.toHaveProperty('border-radius');
    expect(declared(element)).not.toHaveProperty('padding');
    // A literal compiles, but no token moves it.
    expect(
      resolve(declared(element)['font-size'] ?? '', {
        ...rootTokens,
        '--nova-text-control': '15px',
      }),
    ).toBe('13px');
  });
});
