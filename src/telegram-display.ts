export interface TelegramDisplay {
  ready(): void;
  expand(): void;
  isVersionAtLeast?(version: string): boolean;
  isFullscreen?: boolean;
  requestFullscreen?(): void;
  disableVerticalSwipes?(): void;
  setHeaderColor?(color: string): void;
}

/** Called once at startup, outside React's repeated development effects. */
export function initializeTelegramDisplay(app?: TelegramDisplay) {
  if (!app) return;
  app.ready();
  app.expand();
  // Games are played with vertical drags, which must not minimize the app even in fullscreen.
  try {
    if (app.isVersionAtLeast?.('7.7')) app.disableVerticalSwipes?.();
  } catch { /* Older clients simply keep their swipe gesture. */ }
  try {
    app.setHeaderColor?.('#f4eddd');
    if (app.isVersionAtLeast?.('8.0') && !app.isFullscreen) app.requestFullscreen?.();
  } catch { /* Expanded mode remains usable on unsupported clients. */ }
}
