// What a link in a clinical note may point at: http, https and mailto, nothing else. This is the
// editor's one gate for a URL, used when a person types one and again when Tiptap reads an href back
// from pasted HTML or stored JSON, so a javascript:, data: or vbscript: link never reaches the page.
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

// Whitespace and control characters never belong in a URL; browsers silently strip some of them
// ("java\nscript:"), which is how a filter that only looks at the raw text gets bypassed.
function hasUnsafeChar(text: string): boolean {
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x20 || (code >= 0x7f && code <= 0x9f)) return true;
  }
  return false;
}
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const EMAIL = /^[^\s@/:?#,<>]+@[^\s@/:?#,<>]+\.[^\s@/:?#,<>]+$/;
const MAILTO_TARGET = /^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+(?:\?.*)?$/;

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

// True for an absolute URL whose protocol is allowed. Tiptap's `isAllowedUri` hook uses it.
export function isAllowedLinkUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const parsed = parse(url.trim());
  return parsed !== null && ALLOWED_PROTOCOLS.includes(parsed.protocol);
}

// What a person typed into the link field, as the URL to store, or null when it must be refused.
// A bare address gets https:// and a bare e-mail address gets mailto:.
export function normalizeLinkUrl(input: string): string | null {
  const text = input.trim();
  if (text === '' || hasUnsafeChar(text)) return null;
  // Relative and scheme-relative links point somewhere the note cannot know.
  if (text.startsWith('/')) return null;

  const scheme = SCHEME.exec(text);
  if (scheme) {
    const protocol = `${(scheme[1] ?? '').toLowerCase()}:`;
    if (!ALLOWED_PROTOCOLS.includes(protocol)) return null;
    if (protocol === 'mailto:') {
      const target = text.slice(scheme[0].length);
      return MAILTO_TARGET.test(target) ? `mailto:${target}` : null;
    }
    const parsed = parse(text);
    return parsed?.hostname ? parsed.href : null;
  }

  if (EMAIL.test(text)) return `mailto:${text}`;
  const parsed = parse(`https://${text}`);
  // A host with no dot ("hello") is a typo, not an address.
  return parsed?.hostname.includes('.') ? parsed.href : null;
}
