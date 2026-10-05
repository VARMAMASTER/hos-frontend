// The one keyboard-focus indicator for every interactive Nova element. focus-visible, not focus,
// so a mouse click does not light the ring but a Tab key always does. Its colour is the
// --nova-focus-ring token where a surface sets one (the dark chrome and the brand hero turn it
// white, because the brand ring is ~2:1 there and a focus indicator needs 3:1), and the brand
// primary everywhere else.
export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nova-focus-ring,var(--nova-color-primary))]';
