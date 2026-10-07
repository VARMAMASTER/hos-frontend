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
    expect(tile.classList.contains('size-s9')).toBe(true);
  });

  // The prototype's .ic glyph is --chrome-ink-2, which falls below 4.5:1 over the tile's own white
  // lift on the sidebar's lightest point, so the glyph takes the full chrome ink.
  it('sets the chrome tone as the prototype .ic: a faint white lift and rim, the glyph in the chrome ink', () => {
    render(<IconTile>Ph</IconTile>);
    expect([...screen.getByText('Ph').classList]).toEqual(
      expect.arrayContaining([
        'bg-chrome-ink/5',
        'border-chrome-ink/15',
        'text-chrome-ink',
        'size-tile',
        'text-badge',
        'font-bold',
      ]),
    );
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
