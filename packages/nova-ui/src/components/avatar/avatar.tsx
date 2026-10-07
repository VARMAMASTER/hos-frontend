import { useState, type HTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import type { Size } from '../../primitives/types';
import { VisuallyHidden } from '../../primitives/visually-hidden';

// The shared sizes plus the two an avatar truly has beyond them: xs (a 20px face in a dense row) and
// lg (a 48px profile header).
export type AvatarSize = 'xs' | Size | 'lg';
// Not a status Tone: the ground the avatar sits on. surface is for light content; chrome is the
// prototype's .avatar on the dark top bar or sidebar.
export type AvatarTone = 'surface' | 'chrome';

export interface AvatarProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  // Required: it is the image's alt text, or the accessible name of the initials.
  name: string;
  src?: string;
  size?: AvatarSize;
  // A verified person: a primary seal glyph at the corner, and the word for assistive tech.
  verified?: boolean;
  tone?: AvatarTone;
  // A 2px highlight ring (brand into highlight) a hair outside the circle: emphasis, such as the
  // clinician on call. The ring is a shape, present or not; say what it means with highlightLabel.
  highlight?: boolean;
  // Announced after the name ("On call"), for a ring that means something.
  highlightLabel?: string;
}

// 20 (inline), 32 (the prototype's .avatar, initials at 12.5px), 40 and 48 (a list card): the
// --nova-avatar-* tokens.
const sizes: Record<AvatarSize, string> = {
  xs: 'size-avatar-xs text-badge',
  sm: 'size-avatar-sm text-body-sm',
  md: 'size-avatar-md text-body',
  lg: 'size-avatar-lg text-subtitle',
};

const tones: Record<AvatarTone, string> = {
  surface: 'bg-surface-2 text-ink-2',
  chrome: 'border border-chrome-ink/35 bg-chrome-ink/15 text-chrome-ink',
};

const glyphSizes: Record<AvatarSize, string> = {
  xs: 'size-avatar-glyph-xs',
  sm: 'size-avatar-glyph-sm',
  md: 'size-avatar-glyph-md',
  lg: 'size-avatar-glyph-lg',
};

function firstLetter(word: string): string {
  return Array.from(word)[0] ?? '';
}

// Titles are not the person: in a hospital nearly every clinician's name starts with one.
const HONORIFIC = /^(?:dr|prof|mr|mrs|ms|miss|sr|sri|smt|shri)\.?$/i;

// The first letter of the first and last words, after any leading titles: "Asha Rao" is AR,
// "Ramesh" is R, "Dr. Meera Iyer" is MI. A name that is only a title keeps it rather than go blank.
function initialsOf(name: string): string {
  const all = name.trim().split(/\s+/).filter(Boolean);
  const firstName = all.findIndex((word) => !HONORIFIC.test(word));
  const words = firstName === -1 ? all : all.slice(firstName);
  if (words.length === 0) return '?';
  const first = firstLetter(words[0] ?? '');
  const last =
    words.length > 1 ? firstLetter(words[words.length - 1] ?? '') : '';
  return (first + last).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 'md',
  verified = false,
  tone = 'surface',
  highlight = false,
  highlightLabel,
  className,
  ...rest
}: AvatarProps) {
  // Remember the src that failed rather than a flag, so a new src gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string>();
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <span
      data-size={size}
      data-tone={tone}
      className={cx(
        // The prototype's .avatar: a circle, initials at 700 in the display face. The frame does not
        // clip, so the verified glyph can sit on its edge; the photo rounds itself.
        'relative inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-bold tracking-initials',
        sizes[size],
        tones[tone],
        highlight && 'nova-highlight-ring',
        className,
      )}
      {...rest}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="size-full rounded-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        // The name is announced once, by the label; the two letters are only for the eye.
        <span role="img" aria-label={name}>
          <span aria-hidden="true">{initialsOf(name)}</span>
        </span>
      )}
      {verified ? (
        <>
          <svg
            data-verified=""
            viewBox="0 0 20 20"
            aria-hidden="true"
            focusable="false"
            className={cx(
              'absolute -right-s0 -bottom-s0 text-primary',
              glyphSizes[size],
            )}
          >
            {/* A seal (twelve soft points) with a white tick, ringed in white so it reads on any
                photo. */}
            <path
              fill="currentColor"
              className="stroke-surface"
              strokeWidth="1.5"
              d="M10 1.2l2.2 1.6 2.7-.2.9 2.6 2.3 1.4-.8 2.6.8 2.6-2.3 1.4-.9 2.6-2.7-.2L10 18.8l-2.2-1.6-2.7.2-.9-2.6-2.3-1.4.8-2.6-.8-2.6 2.3-1.4.9-2.6 2.7.2z"
            />
            <path
              d="M6.6 10.2l2.3 2.3 4.5-4.8"
              fill="none"
              className="stroke-on-primary"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <VisuallyHidden>Verified</VisuallyHidden>
        </>
      ) : null}
      {highlight && highlightLabel ? (
        <VisuallyHidden>{highlightLabel}</VisuallyHidden>
      ) : null}
    </span>
  );
}
