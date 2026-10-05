// Joins class names, dropping the falsy parts conditional classes produce. Every component merges
// its own classes with a caller's className through this one function.
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
