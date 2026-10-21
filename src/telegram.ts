declare global { interface Window { Telegram?: { WebApp: { initData: string; ready(): void; expand(): void } } } }
export const telegram = window.Telegram?.WebApp;
export const isTelegram = Boolean(telegram?.initData);
export async function progress(level?: number): Promise<number> {
  if (!isTelegram) {
    const stored = Number(localStorage.getItem('demo-progress') ?? 0);
    const current = Number.isInteger(stored) && stored >= 0 && stored <= 11 ? stored : 0;
    const next = level !== undefined && level <= 11 && level === current + 1 ? level : current;
    localStorage.setItem('demo-progress', String(next));
    return next;
  }
  const response = await fetch('/api/progress', {
    method: level === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': telegram!.initData },
    body: level === undefined ? undefined : JSON.stringify({ level }),
  });
  const data = await response.json() as { completed: number; error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Ошибка подключения');
  return data.completed;
}
