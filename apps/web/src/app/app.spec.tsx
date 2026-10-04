import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { App } from './app';

afterEach(() => cleanup());

describe('App', () => {
  it('renders the HOS heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'HOS' })).toBeTruthy();
  });
});
