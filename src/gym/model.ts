export type Lane = 0 | 1;
export type Note = { id: number; lane: Lane; at: number; end?: number };
export const WINDOW = 180;
export const phases = [
  { start: 3000, bpm: 90, beats: 24, title: 'Гантели', hint: 'Левая, правая. Лови круг на линии.' },
  { start: 22000, bpm: 108, beats: 24, title: 'Приседания', hint: 'Одной держи, другой лови короткую ноту!' },
  { start: 39000, bpm: 126, beats: 32, title: 'Ещё один!', hint: 'Две ноты вместе — нажми обе кнопки.' },
];
export const chart: Note[] = phases.flatMap((p, stage) => {
  const notes: Omit<Note, 'id'>[] = [];
  for (let beat = 0; beat < p.beats; beat += stage === 1 ? 3 : 1) {
    const at = p.start + beat * 60000 / p.bpm;
    const lane = (stage === 1 ? beat / 3 : beat) % 2 as Lane;
    notes.push({ lane, at, ...(stage === 1 || (stage === 2 && beat % 8 === 6) ? { end: at + 60000 / p.bpm * (stage === 1 ? 1.5 : 0.6) } : {}) });
    if (stage === 1) notes.push({ lane: (1 - lane) as Lane, at: at + 60000 / p.bpm });
    if (stage === 2 && beat % 8 === 3) notes.push({ lane: (1 - lane) as Lane, at });
  }
  return notes;
}).map((note, id) => ({ ...note, id }));
export const END = 55500;
export type State = { windUsed: boolean; results: Record<number, number>; holding: Partial<Record<Lane, number>>; pressed: boolean[]; combo: number; best: number; energy: number; score: number; feedback: string; status: 'playing' | 'lost' | 'won' };
export const initial = (): State => ({ windUsed: false, results: {}, holding: {}, pressed: [false, false], combo: 0, best: 0, energy: 100, score: 0, feedback: 'Поймай ритм!', status: 'playing' });
export function secondWind(s: State): State {
  return s.status === 'playing' && !s.windUsed && s.combo >= 8 ? { ...s, windUsed: true, energy: Math.min(100, s.energy + 25), feedback: 'ВТОРОЕ ДЫХАНИЕ! +25 СИЛ' } : s;
}
function judge(s: State, id: number, value: number): State {
  if (id in s.results) return s;
  const combo = value ? s.combo + 1 : 0;
  const energy = Math.max(0, Math.min(100, s.energy + (value ? 2 : -12)));
  return { ...s, results: { ...s.results, [id]: value }, combo, best: Math.max(s.best, combo), energy, score: s.score + value, feedback: value === 100 ? 'В ТОЧКУ!' : value ? 'В РИТМ!' : 'МИМО!', status: energy === 0 ? 'lost' : s.status };
}
export function tick(s: State, time: number): State {
  if (s.status !== 'playing') return s;
  for (const n of chart) {
    const held = s.holding[n.lane] === n.id;
    if (!(n.id in s.results) && time > (held ? n.end! : n.at) + WINDOW) {
      s = judge(s, n.id, 0);
      if (s.status === 'lost') return s;
    }
  }
  if (time >= END) return { ...s, status: s.score / (chart.length * 100) >= 0.65 ? 'won' : 'lost' };
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
      return judge(s, id, delta <= 80 ? 100 : delta <= WINDOW ? 70 : 0);
    }
    return s;
  }
  if (s.holding[lane] !== undefined && !(s.holding[lane]! in s.results)) return s;
  const n = chart.find(n => n.lane === lane && !(n.id in s.results) && Math.abs(n.at - time) <= WINDOW);
  if (!n) return { ...s, combo: 0, energy: Math.max(0, s.energy - 3), feedback: 'НЕ СПЕШИ', status: s.energy <= 3 ? 'lost' : s.status };
  if (n.end) { s.holding[lane] = n.id; return { ...s, feedback: 'ДЕРЖИ…' }; }
  return judge(s, n.id, Math.abs(n.at - time) <= 80 ? 100 : 70);
}

