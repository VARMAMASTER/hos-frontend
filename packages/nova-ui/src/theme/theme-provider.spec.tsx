import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createNovaTheme } from './create-theme';
import {
  applyNovaMaterial,
  applyNovaTheme,
  NovaThemeProvider,
} from './theme-provider';

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

describe('material', () => {
  const solidHospital = createNovaTheme({
    name: 'Old PCs',
    material: 'solid',
  });

  const wrapperOf = (text: string) =>
    screen.getByText(text).parentElement as HTMLElement;

  it('sets no material attribute when nobody chooses one, so the CSS default (glass) applies', () => {
    render(
      <NovaThemeProvider theme={teal}>
        <p>default material</p>
      </NovaThemeProvider>,
    );
    expect(wrapperOf('default material').dataset['novaMaterial']).toBe(
      undefined,
    );
  });

  it('applies the product-wide material given to the provider', () => {
    render(
      <NovaThemeProvider material="solid">
        <p>product solid</p>
      </NovaThemeProvider>,
    );
    expect(wrapperOf('product solid').dataset['novaMaterial']).toBe('solid');
  });

  it("lets a hospital's theme override the product-wide material", () => {
    render(
      <NovaThemeProvider material="glass" theme={solidHospital}>
        <p>hospital override</p>
      </NovaThemeProvider>,
    );
    expect(wrapperOf('hospital override').dataset['novaMaterial']).toBe(
      'solid',
    );
  });

  it("applyNovaTheme sets the hospital's material on <html> and the cleanup restores it", () => {
    document.documentElement.dataset['novaMaterial'] = 'glass';
    try {
      const restore = applyNovaTheme(solidHospital);
      expect(document.documentElement.dataset['novaMaterial']).toBe('solid');
      restore();
      expect(document.documentElement.dataset['novaMaterial']).toBe('glass');
    } finally {
      delete document.documentElement.dataset['novaMaterial'];
    }
  });

  it('applyNovaMaterial switches the whole product and the cleanup removes the attribute it added', () => {
    try {
      const restore = applyNovaMaterial('solid');
      expect(document.documentElement.dataset['novaMaterial']).toBe('solid');
      restore();
      expect(document.documentElement.dataset['novaMaterial']).toBe(undefined);
    } finally {
      delete document.documentElement.dataset['novaMaterial'];
    }
  });
});
