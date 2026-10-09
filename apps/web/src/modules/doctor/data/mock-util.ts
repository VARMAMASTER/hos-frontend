import type { ChatReply } from './types';

// Results are copies, so a caller editing what it got back cannot change the source's state.
export function copy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// The state the mock's areas share. openToken is whose chart is open: patient-scoped tabs read it,
// and only the queue changes it. The rest is what the doctor has signed, so a later tab shows it.
export interface MockState {
  openToken: string;
  // Lakshmi Devi's consultation note has been signed (the Progress Notes list shows it filed).
  consultNoteSigned: boolean;
}

// The chart the clinical tabs hold is Lakshmi Devi's (T-12); any other patient has none prepared.
export const CHART_TOKEN = 'T-12';

export function chartIsOpen(state: MockState): boolean {
  return state.openToken === CHART_TOKEN;
}

// One answer the mock's AI can give, and the words that bring it up.
export interface BankEntry {
  keywords: string[];
  reply: ChatReply;
}

// The sample "model": the entry whose keywords the question hits most (the first wins a tie), else
// the fallback that says what it can answer. It reads the question only to pick a canned answer; the
// question is never stored or logged.
export function matchReply(
  question: string,
  bank: BankEntry[],
  fallback: ChatReply,
): ChatReply {
  if (question.trim() === '') throw new Error('Ask a question first.');
  const words = question.toLowerCase();
  let best: BankEntry | undefined;
  let bestScore = 0;
  for (const entry of bank) {
    const score = entry.keywords.filter((keyword) =>
      words.includes(keyword),
    ).length;
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return copy((best ?? { reply: fallback }).reply);
}
