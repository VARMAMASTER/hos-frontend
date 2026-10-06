import { useState, type HTMLAttributes } from 'react';
import { cx } from '../../primitives/cx';
import { VisuallyHidden } from '../../primitives/visually-hidden';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  // Required: it is the image's alt text, or the accessible name of the initials.
  name: string;
  src?: string;
  size?: AvatarSize;
  // A verified person: a primary seal glyph at the corner, and the word for assistive tech.
  verified?: boolean;
}

// 20 (inline), 32, 40 and 48 (a list card), each with its initials on the ramp.
const sizes: Record<AvatarSize, string> = {
  xs: 'size-5 text-micro',
  sm: 'size-8 text-caption',
  md: 'size-10 text-callout',
  lg: 'size-12 text-body',
};

const glyphSizes: Record<AvatarSize, string> = {
  xs: 'size-2.5',
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-4.5',
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
  className,
  ...rest
}: AvatarProps) {
  // Remember the src that failed rather than a flag, so a new src gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string>();
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <span
      data-size={size}
      className={cx(
        // A true circle: the soft surface fill, initials at 600 in muted ink. The frame does not
        // clip, so the verified glyph can sit on its edge; the photo rounds itself.
        'relative inline-flex shrink-0 select-none items-center justify-center rounded-full [corner-shape:round] bg-surface-2 font-semibold text-ink-2',
        sizes[size],
        className,
      )}
      {...rest}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="size-full rounded-full object-cover [corner-shape:round]"
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
              'absolute -right-0.5 -bottom-0.5 text-primary',
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
    </span>
  );
}
