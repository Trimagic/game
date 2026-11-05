export interface HapticApi {
  impactOccurred(style: 'light' | 'medium'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
}
type Event = 'hit' | 'good' | 'win' | 'lose' | 'error';

export class Haptics {
  private lastAt = -Infinity;
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
    if (!['hit', 'good', 'win', 'lose', 'error'].includes(event) || !this.visible()) return;
    const kind = event as Event;
    const api = this.api();
    if (!api) return;
    const at = this.now();
    const priority = kind === 'win' || kind === 'lose' ? 3 : kind === 'good' ? 1 : 2;
    // Errors and results can override a recent bonus; bonuses never obscure a hit.
    const cooldown = this.lastEvent === 'win' || this.lastEvent === 'lose' ? 1000 : 350;
    if (at - this.lastAt < cooldown && priority <= this.lastPriority) return;
    try {
      if (kind === 'hit' || kind === 'good') api.impactOccurred(kind === 'hit' ? 'medium' : 'light');
      else api.notificationOccurred(kind === 'win' ? 'success' : 'error');
      this.lastAt = at;
      this.lastPriority = priority;
      this.lastEvent = kind;
    } catch { /* Unsupported clients must not interrupt the game. */ }
  }
}

export const haptics = new Haptics();
