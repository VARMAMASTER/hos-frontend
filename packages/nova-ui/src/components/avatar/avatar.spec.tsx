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

  it('stays a true circle despite the global squircle corners', () => {
    const { container } = render(<Avatar name="Asha Rao" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('[corner-shape:round]')).toBe(true);
  });

  it('defaults to md and exposes the size it was given', () => {
    const { container, rerender } = render(<Avatar name="Asha Rao" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset['size']).toBe('md');
    rerender(<Avatar name="Asha Rao" size="sm" />);
    expect(root.dataset['size']).toBe('sm');
  });
});
