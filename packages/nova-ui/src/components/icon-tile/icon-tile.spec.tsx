import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { IconTile } from './icon-tile';

afterEach(() => cleanup());

describe('IconTile', () => {
  it('is hidden from assistive technology by default, because it sits beside a text label', () => {
    render(<IconTile>SV</IconTile>);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('SV').getAttribute('aria-hidden')).toBe('true');
  });

  it('is exposed, as visually hidden text carrying its label, when it stands alone', () => {
    render(<IconTile label="Pharmacy">Ph</IconTile>);
    const label = screen.getByText('Pharmacy');
    expect(label.classList.contains('sr-only')).toBe(true);
    const tile = label.closest('[data-tone]');
    expect(tile).toBeTruthy();
    expect(tile?.getAttribute('aria-hidden')).toBeNull();
    expect(label.getAttribute('aria-hidden')).toBeNull();
  });

  it('hides the monogram of a labelled tile, so it is not read out a second time', () => {
    render(<IconTile label="Pharmacy">Ph</IconTile>);
    expect(screen.getByText('Ph').getAttribute('aria-hidden')).toBe('true');
  });

  it('hides the glyph of a labelled tile too', () => {
    render(
      <IconTile label="Beds">
        <svg data-testid="glyph" viewBox="0 0 24 24" />
      </IconTile>,
    );
    expect(
      screen.getByTestId('glyph').closest('[aria-hidden="true"]'),
    ).toBeTruthy();
    expect(screen.getByText('Beds')).toBeTruthy();
  });

  it('can be exposed explicitly with aria-hidden={false}', () => {
    render(<IconTile aria-hidden={false}>ER</IconTile>);
    expect(screen.getByText('ER').getAttribute('aria-hidden')).toBeNull();
  });

  it('lets a label win over a stray aria-hidden', () => {
    render(
      <IconTile label="Lab" aria-hidden>
        La
      </IconTile>,
    );
    const tile = screen.getByText('Lab').closest('[data-tone]');
    expect(tile?.getAttribute('aria-hidden')).toBeNull();
  });

  it('defaults to the chrome tone at the small size', () => {
    render(<IconTile>Ph</IconTile>);
    const tile = screen.getByText('Ph');
    expect([tile.dataset['tone'], tile.dataset['size']]).toEqual([
      'chrome',
      'sm',
    ]);
  });

  it('uses the AI tokens for the ai tone and a larger box for the md size', () => {
    render(
      <IconTile tone="ai" size="md">
        AI
      </IconTile>,
    );
    const tile = screen.getByText('AI');
    expect([tile.dataset['tone'], tile.dataset['size']]).toEqual(['ai', 'md']);
    expect(tile.classList.contains('bg-ai-soft')).toBe(true);
    expect(tile.classList.contains('text-ai-deep')).toBe(true);
    expect(tile.classList.contains('size-8')).toBe(true);
  });

  it('takes its secondary colour from the chrome custom property on the chrome tone', () => {
    render(<IconTile>Ph</IconTile>);
    expect(
      screen
        .getByText('Ph')
        .classList.contains('text-(color:--nova-chrome-ink-2)'),
    ).toBe(true);
  });

  it('holds an svg glyph', () => {
    render(
      <IconTile label="Beds">
        <svg data-testid="glyph" viewBox="0 0 24 24" />
      </IconTile>,
    );
    expect(screen.getByTestId('glyph')).toBeTruthy();
  });
});
