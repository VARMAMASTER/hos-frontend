import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Avatar } from './avatar';

afterEach(() => cleanup());

function initialsShown(container: HTMLElement) {
  return container.querySelector('[aria-hidden="true"]')?.textContent;
}

describe('Avatar', () => {
  it.each([
    ['Ramesh', 'R'],
    ['Asha Rao', 'AR'],
    ['asha rao', 'AR'],
    ['  Asha   Rao  ', 'AR'],
    ['Ramesh Kumar Singh', 'RS'],
    ['Mary-Jane Watson', 'MW'],
    // In a hospital nearly every clinician's name carries a title; the title is not the person.
    ['Dr. Meera Iyer', 'MI'],
    ['Dr Meera Iyer', 'MI'],
    ['Prof. Arun Shah', 'AS'],
    ['Mrs. Lakshmi', 'L'],
    ['Dr.', 'D'],
  ])('derives the initials of %j as %j', (name, initials) => {
    const { container } = render(<Avatar name={name} />);
    expect(initialsShown(container)).toBe(initials);
  });

  it('falls back to a placeholder when the name has nothing to take initials from', () => {
    const { container } = render(<Avatar name="   " />);
    expect(initialsShown(container)).toBe('?');
  });

  it("exposes the person's name once, not their two letters", () => {
    render(<Avatar name="Asha Rao" />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Asha Rao' })).toBeTruthy();
    expect(screen.getByText('AR').getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the image, named by alt, when src is given', () => {
    const { container } = render(
      <Avatar name="Asha Rao" src="/photos/asha.png" />,
    );
    const image = screen.getByRole('img', { name: 'Asha Rao' });
    expect(image.tagName).toBe('IMG');
    expect(image.getAttribute('src')).toBe('/photos/asha.png');
    expect(image.getAttribute('alt')).toBe('Asha Rao');
    expect(screen.queryByText('AR')).toBeNull();
    expect(container.querySelectorAll('[role="img"], img')).toHaveLength(1);
  });

  it('falls back to the initials when the image cannot be loaded', () => {
    const { container } = render(
      <Avatar name="Asha Rao" src="/photos/missing.png" />,
    );
    fireEvent.error(screen.getByRole('img', { name: 'Asha Rao' }));
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByRole('img', { name: 'Asha Rao' })).toHaveLength(1);
    expect(screen.getByText('AR')).toBeTruthy();
  });

  it('tries again when src changes after a failure', () => {
    const { container, rerender } = render(
      <Avatar name="Asha Rao" src="/photos/missing.png" />,
    );
    fireEvent.error(screen.getByRole('img', { name: 'Asha Rao' }));
    expect(container.querySelector('img')).toBeNull();
    rerender(<Avatar name="Asha Rao" src="/photos/asha.png" />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/photos/asha.png',
    );
  });

  it('is a circle with a plain border-radius, as every prototype corner is', () => {
    const { container } = render(<Avatar name="Asha Rao" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('rounded-full')).toBe(true);
    expect(root.className).not.toMatch(/corner-shape/);
  });

  it('defaults to md and exposes the size it was given', () => {
    const { container, rerender } = render(<Avatar name="Asha Rao" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset['size']).toBe('md');
    rerender(<Avatar name="Asha Rao" size="sm" />);
    expect(root.dataset['size']).toBe('sm');
  });

  it.each([
    ['xs', 'size-avatar-xs'],
    ['sm', 'size-avatar-sm'],
    ['md', 'size-avatar-md'],
    ['lg', 'size-avatar-lg'],
  ] as const)('draws the %s size as %s (20 / 32 / 40 / 48px)', (size, box) => {
    const { container } = render(<Avatar name="Asha Rao" size={size} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset['size']).toBe(size);
    expect(root.classList.contains(box)).toBe(true);
  });

  // The prototype's .avatar: initials at 700 in the display face, tracked .01em.
  it('fills with the soft surface and sets the initials bold in the display face, in muted ink', () => {
    const { container } = render(<Avatar name="Asha Rao" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset['tone']).toBe('surface');
    expect([...root.classList]).toEqual(
      expect.arrayContaining([
        'bg-surface-2',
        'text-ink-2',
        'font-bold',
        'font-display',
      ]),
    );
  });

  it('draws the chrome tone as the prototype top-bar avatar: a faint white fill and rim, light initials', () => {
    const { container } = render(
      <Avatar name="Swapna Reddy" size="sm" tone="chrome" />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset['tone']).toBe('chrome');
    expect([...root.classList]).toEqual(
      expect.arrayContaining([
        'size-avatar-sm',
        'text-body-sm',
        'bg-chrome-ink/15',
        'border-chrome-ink/35',
        'text-chrome-ink',
      ]),
    );
  });

  it('marks a verified person with a primary glyph and says so in words', () => {
    const { container, rerender } = render(<Avatar name="Asha Rao" />);
    expect(container.querySelector('[data-verified]')).toBeNull();
    expect(screen.queryByText('Verified')).toBeNull();
    rerender(<Avatar name="Asha Rao" verified />);
    const glyph = container.querySelector('[data-verified]');
    expect(glyph?.getAttribute('aria-hidden')).toBe('true');
    expect(glyph?.classList.contains('text-primary')).toBe(true);
    expect(screen.getByText('Verified').classList.contains('sr-only')).toBe(
      true,
    );
    // The name is still announced once, by itself.
    expect(screen.getByRole('img', { name: 'Asha Rao' })).toBeTruthy();
  });

  it('keeps the photo a circle when the frame no longer clips it', () => {
    const { container } = render(
      <Avatar name="Asha Rao" src="/photos/asha.png" verified />,
    );
    const image = container.querySelector('img') as HTMLImageElement;
    expect([...image.classList]).toEqual(
      expect.arrayContaining(['rounded-full', 'object-cover']),
    );
  });
});
