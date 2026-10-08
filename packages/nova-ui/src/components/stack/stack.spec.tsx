import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Stack } from './stack';

afterEach(() => cleanup());

describe('Stack Component', () => {
  it('renders vertical flex stack by default with gap', () => {
    render(<Stack gap="s4"><span>1</span><span>2</span></Stack>);
    const stack = screen.getByText('1').parentElement;
    expect(stack?.className).toContain('flex');
    expect(stack?.className).toContain('flex-col');
    expect(stack?.className).toContain('gap-s4');
  });

  it('renders horizontal stack with alignment and justify', () => {
    render(
      <Stack direction="horizontal" align="center" justify="between" wrap>
        <span>A</span>
        <span>B</span>
      </Stack>,
    );
    const stack = screen.getByText('A').parentElement;
    expect(stack?.className).toContain('flex-row');
    expect(stack?.className).toContain('items-center');
    expect(stack?.className).toContain('justify-between');
    expect(stack?.className).toContain('flex-wrap');
  });

  it('supports polymorphic container tag', () => {
    render(
      <Stack as="ul">
        <li>Item</li>
      </Stack>,
    );
    const stack = screen.getByText('Item').parentElement;
    expect(stack?.tagName).toBe('UL');
  });
});
