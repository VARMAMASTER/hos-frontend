// WhatsApp's brand colours, for a thread drawn as the patient sees it on their phone (WhatsAppThread,
// ChatBubble's whatsapp palette). They are the one exception to "theme tokens only": another
// company's brand, so a hospital's theme never moves them. They live here and in one marked block at
// the end of theme.css (whatsapp.spec.ts compares the two), and reach components as bg-wa-* and
// text-wa-*, never as literals.
//
// Light is the prototype (hos.css .phone, .phone-h, .phone-b, .wa-in, .wa-out, .wa-time, .wa-btn;
// sim.css .wa-typing), except where a contrast proof holds a value (WHATSAPP_HELD_BY_A_PROOF). Dark
// is WhatsApp's own dark theme, with the same exceptions.

export type WhatsAppColour =
  | '--nova-wa-wall'
  | '--nova-wa-wall-dot'
  | '--nova-wa-header'
  | '--nova-wa-header-ink'
  | '--nova-wa-in'
  | '--nova-wa-out'
  | '--nova-wa-ink'
  | '--nova-wa-ink-2'
  | '--nova-wa-accent'
  | '--nova-wa-hover'
  | '--nova-wa-dot';

export interface SchemeColour {
  light: string;
  dark: string;
}

export const WHATSAPP_COLOURS: Readonly<Record<WhatsAppColour, SchemeColour>> =
  {
    // The chat wallpaper and its dot texture.
    '--nova-wa-wall': { light: '#EFE7DC', dark: '#0B141A' },
    '--nova-wa-wall-dot': { light: '#E4DACB', dark: '#172229' },
    // The header: WhatsApp's darker brand green (white reads about 7.7:1 on it; the brand teal
    // #128C7E only 4.1:1, which is why the prototype chose this one).
    '--nova-wa-header': { light: '#075E54', dark: '#202C33' },
    '--nova-wa-header-ink': { light: '#FFFFFF', dark: '#E9EDEF' },
    // Incoming and outgoing bubbles.
    '--nova-wa-in': { light: '#FFFFFF', dark: '#202C33' },
    '--nova-wa-out': { light: '#D9FDD3', dark: '#005C4B' },
    // Message text, and the secondary ink of the time stamp, gloss, speaker and notices.
    '--nova-wa-ink': { light: '#1A1730', dark: '#E9EDEF' },
    '--nova-wa-ink-2': { light: '#5A6B63', dark: '#C2CDC9' },
    // Quick-reply text, the "Read" mark and, inside the phone, the focus ring.
    '--nova-wa-accent': { light: '#0270A3', dark: '#8AD3F2' },
    // A quick reply under the pointer.
    '--nova-wa-hover': { light: '#F0F7FF', dark: '#2A3942' },
    // The typing dots (decoration: the words say who is typing).
    '--nova-wa-dot': { light: '#9AA79F', dark: '#8696A0' },
  };

// The values a contrast proof moved from the prototype (light) or from WhatsApp's own dark theme,
// and why. whatsapp.spec.ts proves each original fails and each held value passes.
export const WHATSAPP_HELD_BY_A_PROOF: Readonly<
  Partial<Record<WhatsAppColour, { prototype?: string; dark?: string }>>
> = {
  // The prototype's #027EB5 is 4.07:1 on the outgoing bubble and 4.18:1 on the hover fill.
  // WhatsApp's dark #53BDEB is 3.74:1 on its own dark outgoing bubble.
  '--nova-wa-accent': { prototype: '#027EB5', dark: '#53BDEB' },
  // WhatsApp's dark secondary ink #8696A0 is 2.61:1 on its own dark outgoing bubble.
  '--nova-wa-ink-2': { dark: '#8696A0' },
};
