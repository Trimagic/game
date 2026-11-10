// Phaser keeps a fixed number of touch slots. If a touch never reports its end (the app swallowed it,
// the finger left the screen edge), its slot stays taken and counts as pressed; after a few of those
// new touches find no free slot and the game stops reacting. Every new touch lists the fingers that are
// really on the screen, so any slot holding a finger not in that list is a ghost and is freed.
export type TouchSlot = { id: number; active: boolean; identifier: number; reset?: () => void };

/** Slots that hold a touch the browser no longer has. Slot 0 is the mouse and is never touched. */
export const staleSlots = (slots: TouchSlot[], live: Iterable<number>) => {
  const ids = new Set(live);
  return slots.filter(slot => slot.id > 0 && slot.active && !ids.has(slot.identifier));
};

/** Frees ghost slots at the start of each touch, before Phaser hands the new touch a slot. */
export function guardTouches(target: EventTarget, slots: () => TouchSlot[] | undefined) {
  const check = (event: Event) => {
    const list = slots();
    const touches = (event as TouchEvent).touches;
    if (!list || !touches) return;
    for (const slot of staleSlots(list, Array.from(touches, touch => touch.identifier))) slot.reset?.();
  };
  target.addEventListener('touchstart', check, { capture: true, passive: true });
  return () => target.removeEventListener('touchstart', check, { capture: true });
}
