import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createNovaTheme } from './create-theme';
import { applyNovaTheme, NovaThemeProvider } from './theme-provider';

afterEach(() => cleanup());

const teal = createNovaTheme({
  name: 'Teal Care',
  brand: {
    primary: '#0F766E',
    primaryStrong: '#115E59',
    primarySoft: '#CCFBF1',
  },
});

describe('NovaThemeProvider', () => {
  it('scopes a tenant theme to its own subtree', () => {
    render(
      <NovaThemeProvider theme={teal}>
        <p>inside</p>
      </NovaThemeProvider>,
    );
    const wrapper = screen.getByText('inside').parentElement as HTMLElement;
    expect(wrapper.dataset['novaTheme']).toBe('Teal Care');
    expect(wrapper.style.getPropertyValue('--nova-color-primary')).toBe(
      '#0F766E',
    );
  });

  it('marks the default theme when none is given', () => {
    render(
      <NovaThemeProvider>
        <p>plain</p>
      </NovaThemeProvider>,
    );
    expect(
      (screen.getByText('plain').parentElement as HTMLElement).dataset[
        'novaTheme'
      ],
    ).toBe('default');
  });
});

describe('applyNovaTheme', () => {
  it('themes <html> so portalled content inherits it, and the cleanup restores the previous state', () => {
    const cleanupTheme = applyNovaTheme(teal);
    expect(
      document.documentElement.style.getPropertyValue('--nova-color-primary'),
    ).toBe('#0F766E');
    expect(document.documentElement.dataset['novaTheme']).toBe('Teal Care');
    cleanupTheme();
    expect(
      document.documentElement.style.getPropertyValue('--nova-color-primary'),
    ).toBe('');
    expect(document.documentElement.dataset['novaTheme']).toBeUndefined();
  });
});
