// iOS ignores user-scalable=no, so pinch and double-tap zoom have to be stopped by hand too.
// Each listener below narrows its own event.
type Listener = (event: any) => void;
export interface GestureTarget {
  addEventListener(type: string, listener: Listener, options?: AddEventListenerOptions): void;
}
type Cancelable = {preventDefault(): void; cancelable?: boolean};
type TouchLike = Cancelable & {touches: {length: number}; target: unknown};
type WheelLike = Cancelable & {ctrlKey: boolean};
type KeyLike = Cancelable & {ctrlKey: boolean; metaKey: boolean; key: string};

const DOUBLE_TAP_MS = 320;
const ZOOM_KEYS = new Set(['+', '=', '-', '_', '0']);
const stop = (event: Cancelable) => {
  if (event.cancelable !== false) event.preventDefault();
};
// Buttons keep their clicks however fast they are tapped; touch-action already stops zoom on them.
const keepsClick = (target: unknown) =>
  !!(target as {closest?: (selector: string) => unknown} | null)?.closest?.('button,a,label,[role="button"]');

export function lockGestures(target: GestureTarget, now: () => number = () => Date.now()) {
  const active = {passive: false, capture: true};
  for (const type of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'selectstart', 'dragstart'])
    target.addEventListener(type, stop as Listener, active);
  // The long-press menu and callout on images.
  target.addEventListener('contextmenu', stop as Listener, active);
  // Two fingers moving is a pinch to the browser. Games still get their pointer events.
  target.addEventListener('touchmove', ((event: TouchLike) => {
    if (event.touches.length > 1) stop(event);
  }) as Listener, active);
  let lastTap = -Infinity;
  target.addEventListener('touchend', ((event: TouchLike) => {
    if (event.touches.length > 0) return;
    const time = now();
    if (time - lastTap < DOUBLE_TAP_MS && !keepsClick(event.target)) stop(event);
    lastTap = time;
  }) as Listener, active);
  // Pinch on a trackpad and Ctrl +/- in the desktop client.
  target.addEventListener('wheel', ((event: WheelLike) => {
    if (event.ctrlKey) stop(event);
  }) as Listener, active);
  target.addEventListener('keydown', ((event: KeyLike) => {
    if ((event.ctrlKey || event.metaKey) && ZOOM_KEYS.has(event.key)) stop(event);
  }) as Listener, active);
}
