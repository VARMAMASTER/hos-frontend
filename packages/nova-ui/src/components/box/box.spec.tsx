import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Box } from './box';

afterEach(() => cleanup());

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
