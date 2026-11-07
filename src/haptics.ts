export interface HapticApi {
  impactOccurred(style: 'light' | 'medium' | 'heavy'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged?(): void;
}
type Event = 'hit' | 'good' | 'win' | 'lose' | 'error' | 'thud';
const LIGHT_GAP = 60;
const AFTER_STRONG = 90;

export class Haptics {
  private lastAt = -Infinity;
  private lastLight = -Infinity;
  private lastPriority = 0;
  private lastEvent: Event | undefined;
  private api: () => HapticApi | undefined;
  private now: () => number;
  private visible: () => boolean;

  constructor(
    api = () => typeof window === 'undefined' ? undefined : window.Telegram?.WebApp.HapticFeedback,
    now = () => performance.now(),
    visible = () => typeof document === 'undefined' || !document.hidden,
  ) { this.api = api; this.now = now; this.visible = visible; }

  cue(event: string) {
    if (!this.visible()) return;
    // Taps and jumps are a light tick: frequent, and never in the way of something that matters.
    if (event === 'tap' || event === 'jump') {
      const api = this.api();
      if (!api) return;
      const at = this.now();
      if (at - this.lastLight < LIGHT_GAP || at - this.lastAt < AFTER_STRONG) return;
      try {
        if (event === 'tap' && api.selectionChanged) api.selectionChanged();
        else api.impactOccurred('light');
        this.lastLight = at;
      } catch { /* Unsupported clients must not interrupt the game. */ }
      return;
    }
    if (!['hit', 'good', 'win', 'lose', 'error', 'thud'].includes(event)) return;
    const kind = event as Event;
    const api = this.api();
    if (!api) return;
    const at = this.now();
    const priority = kind === 'win' || kind === 'lose' ? 3 : kind === 'good' ? 1 : 2;
    // Errors and results can override a recent bonus; bonuses never obscure a hit.
    const cooldown = this.lastEvent === 'win' || this.lastEvent === 'lose' ? 1000 : 350;
    if (at - this.lastAt < cooldown && priority <= this.lastPriority) return;
    try {
      if (kind === 'thud') api.impactOccurred('heavy');
      else if (kind === 'hit' || kind === 'good') api.impactOccurred(kind === 'hit' ? 'medium' : 'light');
      else api.notificationOccurred(kind === 'win' ? 'success' : 'error');
      this.lastAt = at;
      this.lastPriority = priority;
      this.lastEvent = kind;
    } catch { /* Unsupported clients must not interrupt the game. */ }
  }
}

export const haptics = new Haptics();
