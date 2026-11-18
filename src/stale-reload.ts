// After a deploy, a player who kept the game open still has the old page, which asks for
// chapter files under their old names. The server answers those with the HTML page, so the
// chapter fails to load. Reloading picks up the new page and new file names.
// One reload per ten seconds at most, so a real outage can't cause a reload loop.

type Store = { getItem(key: string): string | null; setItem(key: string, value: string): void };
type Target = { addEventListener(type: string, listener: (event: Event) => void): void };

const KEY = 'stale-reload-at';
const WINDOW_MS = 10_000;

export function reloadOnStaleChunks(target: Target, store: Store | undefined, reload: () => void, now: () => number = Date.now) {
  target.addEventListener('vite:preloadError', event => {
    let last = 0;
    try { last = Number(store?.getItem(KEY)) || 0; } catch { /* storage blocked */ }
    if (now() - last < WINDOW_MS) return; // already reloaded just now: let the error show instead
    try { store?.setItem(KEY, String(now())); } catch { /* storage blocked */ }
    event.preventDefault();
    reload();
  });
}
