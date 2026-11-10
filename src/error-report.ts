// A small strip at the bottom of the screen names any error, so a player can report what broke.
export const describeError = (error: unknown) => {
  const text = error instanceof Error ? error.message : typeof error === 'string' ? error : (() => { try { return JSON.stringify(error); } catch { return String(error); } })();
  return (text || 'неизвестная ошибка').slice(0, 140);
};

/** Lets game code report a caught error without importing any page code. */
export function reportError(error: unknown) {
  console.error(error);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('game-error', { detail: describeError(error) }));
}

export function showErrors() {
  let strip: HTMLDivElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const show = (message: string) => {
    if (!strip) {
      strip = document.createElement('div');
      strip.setAttribute('role', 'alert');
      strip.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:200;padding:10px 12px;border:2px solid #252b29;border-radius:6px;background:#fff1e8;color:#8a2c1c;font:600 13px/1.35 system-ui,sans-serif;box-shadow:3px 3px 0 #252b29;pointer-events:none';
      document.body.appendChild(strip);
    }
    strip.textContent = `Сбой в игре: ${message}. Сделай скриншот и пришли его — так проще починить.`;
    strip.style.display = 'block';
    clearTimeout(timer);
    timer = setTimeout(() => { if (strip) strip.style.display = 'none'; }, 9000);
  };
  window.addEventListener('game-error', event => show((event as CustomEvent<string>).detail));
  window.addEventListener('error', event => show(describeError(event.error ?? event.message)));
  window.addEventListener('unhandledrejection', event => show(describeError(event.reason)));
}
