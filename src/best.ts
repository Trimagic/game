/** Per-device personal best for a chapter; storage is optional, so failures only lose the record. */
export function saveBest(key: string, score: number) {
  let best = 0;
  try { best = Number(localStorage.getItem(key)) || 0; if (score > best) localStorage.setItem(key, String(score)); } catch { /* Optional convenience. */ }
  return { best: Math.max(best, score), record: score > best };
}
