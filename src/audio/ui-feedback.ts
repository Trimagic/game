// Every button and control surface answers a touch, in menus and comics as much as in games.
type TapTarget = {closest?: (selector: string) => unknown} | null;
export const isTappable = (target: unknown) =>
  !!(target as TapTarget)?.closest?.('button:not(:disabled),a[href],[role="application"]');
export function listenForTaps(
  target: {addEventListener(type: string, listener: (event: {target: unknown}) => void, options?: AddEventListenerOptions): void},
  play: () => void,
) {
  target.addEventListener('pointerdown', event => {
    if (isTappable(event.target)) play();
  }, {capture: true, passive: true});
}
