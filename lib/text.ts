/** Split a title into two balanced lines (shortest longest-line wins). */
export function balance(title: string, max = 12): string[] {
  const words = title.split(" ");
  if (title.length <= max || words.length < 2) return [title];
  let best: string[] = [title];
  let bestLen = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const len = Math.max(a.length, b.length);
    if (len < bestLen) {
      bestLen = len;
      best = [a, b];
    }
  }
  return best;
}
