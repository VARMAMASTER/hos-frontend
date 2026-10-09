// Rupee amounts as the prototype writes them: "₹1,77,500" (Indian digit grouping).

export function rupee(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// "₹76,000" back to 76000; 0 when there is no figure in it.
export function rupeeValue(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? Number.parseInt(digits, 10) : 0;
}
