export type Lane = 0 | 1;
export type Note = { id: number; lane: Lane; at: number; end?: number; bonus?: boolean };
export const WINDOW = 180;
export const phases = [
  { start: 3000, bpm: 90, beats: 24, title: 'Гантели', hint: 'Левая, правая. Лови круг на линии.' },
  { start: 22000, bpm: 108, beats: 24, title: 'Приседания', hint: 'Одной держи, другой лови короткую ноту!' },
  { start: 39000, bpm: 126, beats: 32, title: 'Ещё один!', hint: 'Две ноты вместе — нажми обе кнопки.' },
];
// The coach's "one more" reps fill each rest: optional golden notes worth a lot.
export const bonusSets = [
  [{ lane: 0, at: 19500 }, { lane: 1, at: 20100 }, { lane: 0, at: 20700 }, { lane: 1, at: 20700 }],
  [{ lane: 0, at: 35900 }, { lane: 1, at: 36450 }, { lane: 0, at: 37000 }, { lane: 1, at: 37550 }],
  [{ lane: 0, at: 54800 }, { lane: 1, at: 55350 }, { lane: 0, at: 55900 }, { lane: 1, at: 55900 }],
] as const;
const base: Omit<Note, 'id'>[] = phases.flatMap((p, stage) => {
  const notes: Omit<Note, 'id'>[] = [];
  for (let beat = 0; beat < p.beats; beat += stage === 1 ? 3 : 1) {
    const at = p.start + beat * 60000 / p.bpm;
    const lane = (stage === 1 ? beat / 3 : beat) % 2 as Lane;
    notes.push({ lane, at, ...(stage === 1 || (stage === 2 && beat % 8 === 6) ? { end: at + 60000 / p.bpm * (stage === 1 ? 1.5 : 0.6) } : {}) });
    if (stage === 1) notes.push({ lane: (1 - lane) as Lane, at: at + 60000 / p.bpm });
    if (stage === 2 && beat % 8 === 3) notes.push({ lane: (1 - lane) as Lane, at });
  }
  return notes;
});
export const chart: Note[] = [...base, ...bonusSets.flat().map(n => ({ lane: n.lane as Lane, at: n.at, bonus: true }))].sort((a, b) => a.at - b.at).map((note, id) => ({ ...note, id }));
export const regular = chart.filter(n => !n.bonus);
export const END = 57000;
export const FEVER_STREAK = 20;
export const FEVER_MS = 6000;
export const BONUS_POINTS = 150;
export const multiplier = (combo: number) => Math.min(4, 1 + Math.floor(combo / 10));
export type State = { windUsed: boolean; results: Record<number, number>; holding: Partial<Record<Lane, number>>; pressed: boolean[]; combo: number; best: number; energy: number; score: number; points: number; feverUntil: number; fevers: number; bonusHits: number; feedback: string; status: 'playing' | 'lost' | 'won' };
export const initial = (): State => ({ windUsed: false, results: {}, holding: {}, pressed: [false, false], combo: 0, best: 0, energy: 100, score: 0, points: 0, feverUntil: 0, fevers: 0, bonusHits: 0, feedback: 'Поймай ритм!', status: 'playing' });
export const accuracy = (s: State) => s.score / (regular.length * 100);
export const gymRating = (s: State) => accuracy(s) >= .9 ? 3 : accuracy(s) >= .78 ? 2 : 1;
export function secondWind(s: State): State {
  return s.status === 'playing' && !s.windUsed && s.combo >= 8 ? { ...s, windUsed: true, energy: Math.min(100, s.energy + 25), feedback: 'ВТОРОЕ ДЫХАНИЕ! +25 СИЛ' } : s;
}
function judge(s: State, id: number, value: number, time: number): State {
  if (id in s.results) return s;
  const fever = time < s.feverUntil;
  if (chart[id].bonus) {
    // Skipping a bonus rep is allowed: no lost energy, no broken streak.
    if (!value) return { ...s, results: { ...s.results, [id]: 0 }, feedback: 'ЛАДНО, ХВАТИТ…' };
    const combo = s.combo + 1;
    const gain = BONUS_POINTS * multiplier(combo) * (fever ? 2 : 1);
    return { ...s, results: { ...s.results, [id]: value }, combo, best: Math.max(s.best, combo), points: s.points + gain, bonusHits: s.bonusHits + 1, feedback: `ЕЩЁ ОДИН! +${gain}` };
  }
  const combo = value ? s.combo + 1 : 0;
  const energy = Math.max(0, Math.min(100, s.energy + (value ? 2 : -12)));
  const startFever = value > 0 && combo % FEVER_STREAK === 0;
  return {
    ...s, results: { ...s.results, [id]: value }, combo, best: Math.max(s.best, combo), energy, score: s.score + value,
    points: s.points + value * multiplier(combo) * (fever ? 2 : 1),
    feverUntil: startFever ? time + FEVER_MS : value ? s.feverUntil : 0, fevers: s.fevers + (startFever ? 1 : 0),
    feedback: startFever ? 'РЕЖИМ ЗВЕРЯ! ×2' : value === 100 ? 'В ТОЧКУ!' : value ? 'В РИТМ!' : 'МИМО!', status: energy === 0 ? 'lost' : s.status,
  };
}
export function tick(s: State, time: number): State {
  if (s.status !== 'playing') return s;
  for (const n of chart) {
    const held = s.holding[n.lane] === n.id;
    if (!(n.id in s.results) && time > (held ? n.end! : n.at) + WINDOW) {
      s = judge(s, n.id, 0, time);
      if (s.status === 'lost') return s;
    }
  }
  if (time >= END) return { ...s, status: accuracy(s) >= 0.65 ? 'won' : 'lost' };
  return s;
}
export function input(state: State, lane: Lane, down: boolean, time: number): State {
  let s = tick(state, time);
  if (s.status !== 'playing' || s.pressed[lane] === down) return s;
  s = { ...s, pressed: s.pressed.map((v, i) => i === lane ? down : v), holding: { ...s.holding } };
  if (!down) {
    const id = s.holding[lane];
    delete s.holding[lane];
    if (id !== undefined) {
      const delta = Math.abs(time - chart[id].end!);
      return judge(s, id, delta <= 80 ? 100 : delta <= WINDOW ? 70 : 0, time);
    }
    return s;
  }
  if (s.holding[lane] !== undefined && !(s.holding[lane]! in s.results)) return s;
  const n = chart.find(n => n.lane === lane && !(n.id in s.results) && Math.abs(n.at - time) <= WINDOW);
  if (!n) return { ...s, combo: 0, feverUntil: 0, energy: Math.max(0, s.energy - 3), feedback: 'НЕ СПЕШИ', status: s.energy <= 3 ? 'lost' : s.status };
  if (n.end) { s.holding[lane] = n.id; return { ...s, feedback: 'ДЕРЖИ…' }; }
  return judge(s, n.id, Math.abs(n.at - time) <= 80 ? 100 : 70, time);
}
