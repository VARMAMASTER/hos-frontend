import { useId, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { cx } from '../../primitives/cx';
import { Avatar } from '../avatar/avatar';

export interface PhoneFrameProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  // Whoever the chat is with, in the header: the patient (the hospital's view), or the hospital (the
  // patient's). It names the frame.
  name: string;
  // In place of the initials avatar (a photo, the hospital's mark).
  avatar?: ReactNode;
  // Under the name: a phone number, "online".
  subtitle?: ReactNode;
  // A tag at the right of the header (the AI mark and "AI Assistant"): the prototype's .tag-offline.
  status?: ReactNode;
  // A notice at the top of the chat ("Front desk closed · 11:47 PM · AI handling solo").
  badge?: ReactNode;
  // The chat itself.
  children?: ReactNode;
  // The body: WhatsAppThread makes it the conversation log.
  bodyProps?: HTMLAttributes<HTMLDivElement>;
  bodyRef?: Ref<HTMLDivElement>;
  // After the body, inside the frame: a live region, a composer.
  footer?: ReactNode;
}

// The prototype's WhatsApp phone (hos.css .phone, .phone-h, .phone-b): a 320px shell with WhatsApp's
// header green and its dotted wallpaper, from the WhatsApp brand tokens (tokens/whatsapp.ts), never
// the hospital's theme. Inside it, focus rings in the WhatsApp accent, which holds 3:1 on the wall
// and on both bubbles in either scheme.
export function PhoneFrame({
  name,
  avatar,
  subtitle,
  status,
  badge,
  children,
  bodyProps,
  bodyRef,
  footer,
  className,
  ...rest
}: PhoneFrameProps) {
  const nameId = useId();
  return (
    <div
      role="group"
      aria-labelledby={nameId}
      data-phone-frame=""
      className={cx(
        'w-full max-w-xs overflow-hidden rounded-hero border border-border-strong bg-wa-wall shadow-md [--nova-focus-ring:var(--nova-wa-accent)]',
        className,
      )}
      {...rest}
    >
      <div
        data-slot="phone-header"
        // .phone-h: 13px semibold, 10px by 16px, 8px between its parts.
        className="flex items-center gap-s3 bg-wa-header px-s6 py-s4 text-control font-semibold text-wa-header-ink"
      >
        {avatar ?? <Avatar name={name} size="sm" tone="chrome" />}
        <div className="min-w-0 flex-1">
          <span id={nameId} className="block break-words">
            {name}
          </span>
          {subtitle !== undefined && subtitle !== null ? (
            <span className="block break-words text-meta font-normal">
              {subtitle}
            </span>
          ) : null}
        </div>
        {status !== undefined && status !== null ? (
          <span
            data-slot="phone-status"
            // .tag-offline: 10.5px mono on the chrome's darkest stop.
            className="ml-auto shrink-0 rounded-tag bg-chrome-1 px-tag py-tag font-mono text-overline text-chrome-ink"
          >
            {status}
          </span>
        ) : null}
      </div>
      <div
        ref={bodyRef}
        data-slot="phone-body"
        {...bodyProps}
        className={cx(
          // .phone-b: 12px of padding, 8px between messages, at least 200px tall.
          'nova-wa-wall flex min-h-(--nova-phone-wall-min-h) flex-col gap-s3 p-s5',
          bodyProps?.className,
        )}
      >
        {badge !== undefined && badge !== null ? (
          <p
            data-slot="phone-badge"
            className="self-center rounded-card bg-wa-in px-s4 py-s1 text-center text-meta text-wa-ink-2 shadow-sm"
          >
            {badge}
          </p>
        ) : null}
        {children}
      </div>
      {footer}
    </div>
  );
}
