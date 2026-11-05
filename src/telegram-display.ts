export interface TelegramDisplay {
  ready(): void;
  expand(): void;
  isVersionAtLeast?(version: string): boolean;
  isFullscreen?: boolean;
  requestFullscreen?(): void;
  setHeaderColor?(color: string): void;
}

/** Called once at startup, outside React's repeated development effects. */
export function initializeTelegramDisplay(app?: TelegramDisplay) {
  if (!app) return;
  app.ready();
  app.expand();
  try {
    app.setHeaderColor?.('#f4eddd');
    if (app.isVersionAtLeast?.('8.0') && !app.isFullscreen) app.requestFullscreen?.();
  } catch { /* Expanded mode remains usable on unsupported clients. */ }
}
