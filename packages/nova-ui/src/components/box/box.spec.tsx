import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { computed } from '../../test/token-css';
import { Box } from './box';

afterEach(() => cleanup());

// A resolved var() chain comes back bracketed: (#FFFFFF).
const background = (element: Element) =>
  computed(element, 'background-color').replace(/^\(+|\)+$/g, '');

// Each surface paints a real colour from the token layer (test/token-css.ts resolves the compiled
// class the way a browser would). A class naming a colour theme.css does not define compiles to
// nothing, and the box draws no background at all.
describe('Box surfaces resolve to a token colour', () => {
  it.each([
    ['base', '#FFFFFF'],
    ['elevated', '#FFFFFF'],
    // The prototype's --panel-2: the quiet inner panel (a toolbar, a code chip).
    ['inset', '#F8F7FD'],
    // The prototype's --bg: the canvas, a step below the panel (a loading placeholder).
    ['sunken', '#F0EFF9'],
  ] as const)('%s paints %s', (surface, colour) => {
    render(<Box surface={surface}>Ward 3</Box>);
    expect(background(screen.getByText('Ward 3'))).toBe(colour);
  });
});

describe('Box Component', () => {
  it('renders div with token padding and surface', () => {
    render(
      <Box padding="s4" surface="base">
        Content
      </Box>,
    );
    const box = screen.getByText('Content');
    expect(box.tagName).toBe('DIV');
    expect(box.className).toContain('p-s4');
    expect(box.className).toContain('bg-surface');
  });

  it('renders requested polymorphic element with border and radius', () => {
    render(
      <Box as="section" border="bottom" radius="card">
        Section
      </Box>,
    );
    const section = screen.getByText('Section');
    expect(section.tagName).toBe('SECTION');
    expect(section.className).toContain('border-b');
    expect(section.className).toContain('rounded-card');
  });

  it('supports directional paddingX and paddingY', () => {
    render(
      <Box paddingX="s6" paddingY="s2">
        Directional
      </Box>,
    );
    const el = screen.getByText('Directional');
    expect(el.className).toContain('px-s6');
    expect(el.className).toContain('py-s2');
  });
});
