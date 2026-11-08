// Pure course model for chapter 01: deterministic waves, pickups and scoring.
export type Hazard = 'granny' | 'kid' | 'banana' | 'hurdle';
export type Kind = Hazard | 'star' | 'heart' | 'ramp' | 'puddle' | 'boost';
export type Spawn = { at: number; lane: number; kind: Kind; shift?: -1 | 1 };
export type Phase = { from: number; name: string; speed: number; gap: number };

export const DURATION = 40000;
export const LAST_ROW = 36000;
export const LANES = 3;
export const laneX = (lane: number) => 84 + lane * 96;
/** The lane under a finger: the road is split evenly between lanes, so touching a lane is enough. */
export const laneAt = (x: number) => (x < 132 ? 0 : x < 228 ? 1 : 2);
export const clampLane = (lane: number) => Math.max(0, Math.min(LANES - 1, lane));
export const phases: Phase[] = [
  { from: 0, name: 'Разминка', speed: 180, gap: 1300 },
  { from: 12000, name: 'Парк оживает!', speed: 210, gap: 1100 },
  { from: 24000, name: 'Финишная прямая!', speed: 245, gap: 950 },
  { from: 31500, name: 'Под горку!', speed: 280, gap: 860 },
];
export const HEART_TIMES = [16000, 29000];
// Things on the path that are not obstacles: a ramp throws you over a hurdle, a puddle locks the wheel, turbo doubles stars.
export const AIR_MS = 800;
export const SLIP_MS = 380;
export const BOOST_MS = 4000;
const passable: Kind[] = ['star', 'heart', 'ramp', 'puddle', 'boost', 'hurdle'];

export function phaseAt(time: number) {
  let index = 0;
  phases.forEach((phase, i) => { if (time >= phase.from) index = i; });
  return index;
}
export function speedAt(time: number) {
  const phase = phases[phaseAt(time)];
  return phase.speed + Math.min(20, (time - phase.from) / 600);
}

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hazards: Hazard[] = ['granny', 'kid', 'banana'];
/** Lanes a row occupies by the time it reaches the rider, kid dashes included. */
export function blocked(row: Spawn[]) {
  const lanes = new Set<number>();
  for (const s of row) if (!passable.includes(s.kind)) { lanes.add(s.lane); if (s.shift) lanes.add(s.lane + s.shift); }
  return lanes;
}

/** Builds the whole ride. Every row leaves at least one lane free and stars mark a safe route. */
export function course(seed = Date.now()) {
  const random = rng(seed);
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  const spawns: Spawn[] = [];
  let at = 1200;
  let lastFree = 1;
  let rampRow = false;
  let nextBoost = 9000;
  while (at <= LAST_ROW) {
    const phase = phaseAt(at);
    const row: Spawn[] = [];
    const roll = random();
    // A ramp row: two lanes are blocked, the third has a hurdle that only a jump from the ramp clears.
    const ramp: boolean = phase >= 1 && !rampRow && random() < .18;
    rampRow = ramp;
    if (ramp) {
      const free = pick([0, 1, 2].filter(lane => lane !== lastFree));
      for (const lane of [0, 1, 2]) if (lane !== free) row.push({ at, lane, kind: pick(hazards) });
      row.push({ at, lane: free, kind: 'hurdle' }, { at: at - 260, lane: free, kind: 'ramp' });
    } else if (phase >= 1 && roll < .3) {
      // Kid dash: starts in one lane and swerves into its neighbour.
      const lane = pick([0, 1, 2]);
      const shift: -1 | 1 = lane === 0 ? 1 : lane === 2 ? -1 : pick([-1, 1] as const);
      row.push({ at, lane, kind: 'kid', shift });
    } else if (phase >= 1 && roll < (phase === 2 ? .85 : .65)) {
      // Wall: two hazards, the free lane differs from the previous one to force a move.
      const free = pick([0, 1, 2].filter(lane => lane !== lastFree));
      for (const lane of [0, 1, 2]) if (lane !== free) row.push({ at, lane, kind: pick(hazards) });
    } else {
      row.push({ at, lane: pick([0, 1, 2]), kind: pick(hazards) });
    }
    const open = [0, 1, 2].filter(lane => !blocked(row).has(lane));
    const free = open.includes(lastFree) && random() < .5 ? lastFree : pick(open);
    lastFree = free;
    // A short star trail rewards whoever threads the free lane.
    for (const offset of [-220, 0, 220]) row.push({ at: at + offset, lane: free, kind: 'star' });
    // A puddle just past a row: whoever rides through it cannot steer for a moment.
    if (phase >= 1 && !ramp && random() < .3) row.push({ at: at + 140, lane: pick([0, 1, 2]), kind: 'puddle' });
    // Turbo sits off the safe route between rows: a risk worth taking.
    if (at >= nextBoost) { const lane = pick([0, 1, 2].filter(l => l !== free)); row.push({ at: at + Math.floor(phases[phase].gap / 2), lane, kind: 'boost' }); nextBoost = at + 7000; }
    spawns.push(...row);
    at += phases[phase].gap + Math.floor(random() * 250);
  }
  // Hearts take the place of a star, so they always sit on the safe route.
  for (const time of HEART_TIMES) {
    const stars = spawns.filter(s => s.kind === 'star');
    const nearest = stars.reduce((best, s) => Math.abs(s.at - time) < Math.abs(best.at - time) ? s : best, stars[0]);
    if (nearest) nearest.kind = 'heart';
  }
  return spawns.sort((a, b) => a.at - b.at);
}

export const multiplier = (streak: number) => Math.min(5, 1 + Math.floor(streak / 4));
export const STAR_POINTS = 10;
export const CLEAN_BONUS = 100;

export function rating(collected: number, total: number, lives: number) {
  const share = total ? collected / total : 0;
  return share >= .75 && lives === 3 ? 3 : share >= .5 ? 2 : 1;
}
