import { useState, type HTMLAttributes } from 'react';

export type AvatarSize = 'sm' | 'md';

export interface AvatarProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  // Required: it is the image's alt text, or the accessible name of the initials.
  name: string;
  src?: string;
  size?: AvatarSize;
}

// The same two steps as Button: sm is 32px, md is 40px.
const sizes: Record<AvatarSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
};

function firstLetter(word: string): string {
  return Array.from(word)[0] ?? '';
}

// The first letter of the first and last words: "Asha Rao" is AR, "Ramesh" is R.
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
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
  className,
  ...rest
}: AvatarProps) {
  // Remember the src that failed rather than a flag, so a new src gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string>();
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <span
      data-size={size}
      className={[
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-primary-soft font-medium text-primary-strong',
        sizes[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        // The name is announced once, by the label; the two letters are only for the eye.
        <span role="img" aria-label={name}>
          <span aria-hidden="true">{initialsOf(name)}</span>
        </span>
      )}
    </span>
  );
}
