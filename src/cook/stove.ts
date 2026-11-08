// Three burners cook at once; each dish fills up, waits in a ready window and burns if ignored.
export const DISHES = [
  { name: 'Курица', station: 'Сковорода', steps: ['Перевернуть', 'Перевернуть', 'Снять'], key: '1' },
  { name: 'Рис', station: 'Кастрюля', steps: ['Перемешать', 'Перемешать', 'Снять'], key: '2' },
  { name: 'Брокколи', station: 'Пароварка', steps: ['Встряхнуть', 'Снять'], key: '3' },
] as const;
export const READY = .7;
export const PERFECT = [.8, .92] as const;
export const BURN_RESET = .35;
export const PHONE_MS = 5;
// A flare-up doubles a pan's heat until tapped; left alone it burns the dish.
export const FLARE_MS = 1.8;
export const FLARE_FIRST = 6;
// A salt shaker flies across the stove; tapping it seasons the dinner.
export const SPICE_FLIGHT = 3.2;
export const SPICE_FIRST = 8;
export const SPICE_GAP = 9;
export type Burner = { step: number; progress: number; rate: number; delay: number; burns: number };
export type StoveEvent = { type: 'done' | 'perfect' | 'early' | 'burn' | 'finish' | 'flare' | 'putout' | 'spice' | 'seasoned'; burner: number };
export type Stove = {
  time: number; burners: Burner[]; mistakes: number; combo: number; best: number; gained: number;
  phoneAt: number; phone: 'off' | 'ringing' | 'answered' | 'missed'; feedback: string;
  status: 'cooking' | 'done' | 'lost'; events: StoveEvent[];
  flare: { burner: number; left: number } | null; nextFlare: number; flares: number; putOut: number;
  spice: { start: number } | null; nextSpice: number; spices: number;
};
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; }
/** Without a seed the stove uses fixed, readable timings; a seed varies speeds, start delays and the call. */
export function createStove(seed?: number): Stove {
  const random = seed === undefined ? () => .5 : rng(seed);
  const burners = DISHES.map((_, i) => ({ step: 0, progress: 0, rate: 1 / (4.6 + random() * 1.6), delay: i * 1.6 + random() * .8, burns: 0 }));
  const phoneAt = 9 + random() * 5;
  return { time: 0, burners, mistakes: 0, combo: 0, best: 0, gained: 0, phoneAt, phone: 'off', feedback: 'Три конфорки. Жми на ту, что подсветилась зелёным.', status: 'cooking', events: [],
    flare: null, nextFlare: FLARE_FIRST + random() * 2, flares: 0, putOut: 0, spice: null, nextSpice: SPICE_FIRST + random() * 2, spices: 0 };
}
export const finished = (s: Stove, i: number) => s.burners[i].step >= DISHES[i].steps.length;
export const ready = (s: Stove, i: number) => !finished(s, i) && s.burners[i].delay === 0 && s.burners[i].progress >= READY;
// Heat creeps up over the round so the juggling tightens.
export const heat = (time: number) => 1 + Math.min(.45, time / 40);
export function tickStove(state: Stove, dt: number): Stove {
  if (state.status !== 'cooking') return state;
  const h = Math.max(0, Math.min(dt, .25));
  let s: Stove = { ...state, time: state.time + h, events: [] };
  if (s.phone === 'off' && s.time >= s.phoneAt) s = { ...s, phone: 'ringing', feedback: 'Звонит мама! Пока не ответишь, руки заняты телефоном.' };
  if (s.phone === 'ringing' && s.time >= s.phoneAt + PHONE_MS) s = { ...s, phone: 'missed', feedback: 'Мама перезвонит позже. Обиделась немножко.' };
  // A flare-up starts on the next pan still cooking, in turn.
  if (!s.flare && s.time >= s.nextFlare) {
    const order = [0, 1, 2].map(k => (s.flares + k) % 3).filter(i => !finished(s, i) && s.burners[i].delay === 0);
    if (order.length) s = { ...s, flare: { burner: order[0], left: FLARE_MS }, flares: s.flares + 1, feedback: `${DISHES[order[0]].name}: ВСПЫШКА! Жми, чтобы потушить!`, events: [...s.events, { type: 'flare', burner: order[0] }] };
    s = { ...s, nextFlare: s.time + 7 + (s.flares % 3) * 1.5 };
  }
  if (!s.spice && s.time >= s.nextSpice) s = { ...s, spice: { start: s.time }, nextSpice: s.time + SPICE_GAP, events: [...s.events, { type: 'spice', burner: -1 }] };
  if (s.spice && s.time - s.spice.start > SPICE_FLIGHT) s = { ...s, spice: null };
  const flare = s.flare ? { ...s.flare, left: s.flare.left - h } : null;
  const burners = s.burners.map(b => ({ ...b }));
  if (flare && flare.left <= 0) {
    const b = burners[flare.burner]; b.progress = BURN_RESET; b.burns++;
    s = { ...s, flare: null, mistakes: s.mistakes + 1, combo: 0, feedback: `${DISHES[flare.burner].name} сгорело во вспышке!`, events: [...s.events, { type: 'burn', burner: flare.burner }] };
  } else s = { ...s, flare };
  burners.forEach((b, i) => {
    if (b.step >= DISHES[i].steps.length) return;
    if (b.delay > 0) { b.delay = Math.max(0, b.delay - h); return; }
    b.progress += b.rate * heat(s.time) * h * (s.flare?.burner === i ? 2 : 1);
    if (b.progress >= 1) {
      b.progress = BURN_RESET; b.burns++;
      s = { ...s, mistakes: s.mistakes + 1, combo: 0, feedback: `${DISHES[i].name} подгорает! Дым — не приправа.`, events: [...s.events, { type: 'burn', burner: i }] };
    }
  });
  s = { ...s, burners };
  if (s.mistakes >= 3) return { ...s, status: 'lost', feedback: 'Три раза подгорело. Кухня в дыму.' };
  return s;
}
export function actStove(s: Stove, i: number): Stove {
  if (s.status !== 'cooking') return s;
  // While the phone rings, a tap anywhere on the stove answers it: hands are busy anyway.
  if (s.phone === 'ringing') return answerPhone(s);
  if (s.flare && s.flare.burner === i) return { ...s, flare: null, putOut: s.putOut + 1, gained: s.gained + 15, combo: s.combo + 1, best: Math.max(s.best, s.combo + 1), feedback: `${DISHES[i].name}: потушил! +15`, events: [{ type: 'putout', burner: i }] };
  if (finished(s, i) || s.burners[i].delay > 0) return s;
  const b = s.burners[i];
  if (b.progress < READY) return { ...s, combo: 0, feedback: `${DISHES[i].name}: рано! Дождись зелёной зоны.`, events: [{ type: 'early', burner: i }] };
  const perfect = b.progress >= PERFECT[0] && b.progress <= PERFECT[1];
  const gain = perfect ? 30 : 20;
  const combo = s.combo + 1;
  const burners = s.burners.map((x, j) => j === i ? { ...x, step: x.step + 1, progress: 0 } : x);
  const next: Stove = { ...s, burners, combo, best: Math.max(s.best, combo), gained: s.gained + gain, feedback: `${DISHES[i].steps[b.step]} — ${perfect ? 'идеально! +30' : 'вовремя! +20'} · серия ${combo}`, events: [{ type: perfect ? 'perfect' : 'done', burner: i }] };
  const allDone = DISHES.every((_, j) => next.burners[j].step >= DISHES[j].steps.length);
  if (next.burners[i].step >= DISHES[i].steps.length) next.events.push({ type: 'finish', burner: i });
  return allDone ? { ...next, status: 'done', feedback: 'Всё снято с огня! Раскладываем.' } : next;
}
/** Where the shaker is on its way across the stove, 0 at the left edge to 1 at the right. */
export const spiceAt = (s: Stove) => s.spice ? (s.time - s.spice.start) / SPICE_FLIGHT : null;
export function catchSpice(s: Stove): Stove {
  return s.status === 'cooking' && s.spice ? { ...s, spice: null, spices: s.spices + 1, gained: s.gained + 15, feedback: 'Посолил вовремя! +15', events: [{ type: 'seasoned', burner: -1 }] } : s;
}
export function answerPhone(s: Stove): Stove {
  return s.status === 'cooking' && s.phone === 'ringing' ? { ...s, phone: 'answered', gained: s.gained + 10, feedback: '«Мам, готовлю! Перезвоню!» · +10' } : s;
}
