// Nova's shared prop vocabulary. A component that has a size, a tone or a status takes its values
// from here (narrowed with Extract where it supports fewer), so the same word means the same thing on
// every component and a new value is added in one place. consistency.spec.ts checks that no component
// declares its own copy of these unions.

// A control's size, on the control tokens (h-control-sm | md, px-/py-control-sm | md). md is the
// default everywhere.
export type Size = 'sm' | 'md';

// The status tones: each has a colour, a -soft fill and a -deep ink, and is always carried by a word
// or a glyph too, never by colour alone.
export type StatusTone = 'good' | 'warn' | 'crit' | 'info';

// Every tone a component may take: the statuses, neutral (no status), ai (AI output), highlight (the
// theme's highlight family) and brand (the hospital's primary colour). A component supports the subset
// it can draw: Extract<Tone, 'good' | 'warn' | 'crit'>.
export type Tone = StatusTone | 'neutral' | 'ai' | 'highlight' | 'brand';
