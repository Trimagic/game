export const ROUND_MS = 45_000;
export const BOSS_MS = 30_000;
export const PRE_BOSS_MS = 27_000;
export const PLAYER_X = 78;
export const GAP_Y = [135, 255, 375, 495];
export const SOAP_FOR_SHIELD = 4;
export const DART_WARN = 750;
export const BOSS_DARTS = [33_500, 36_500, 39_500];
export const phases = [
  { from: 0, name: 'Разминка' },
  { from: 9_000, name: 'Волна качает!' },
  { from: 18_000, name: 'Осторожно: торпеды!' },
];
export type HazardKind = 'float' | 'bob' | 'dart' | 'wave';
export type PoolHazard = { id: number; x: number; y: number; boss: boolean; kind?: HazardKind; baseY?: number; warn?: number };
export type Soap = { id: number; x: number; y: number; speed: number };
export type PoolEvent = 'soap' | 'shield' | 'block' | 'hit';
export type PoolState = {
  elapsed: number; y: number; lives: number; invincible: number;
  hazards: PoolHazard[]; nextSpawn: number; nextWave: number;
  wave: number; gap: number; serial: number; status: 'playing' | 'lost' | 'won';
  soaps: Soap[]; nextSoap: number; nextDart: number; spawned: number; collected: number;
  charge: number; shield: boolean; score: number; events: PoolEvent[];
};
export function createPoolState(): PoolState {
  return {
    elapsed: 0, y: 315, lives: 3, invincible: 0, hazards: [], nextSpawn: 1800, nextWave: 32_000, wave: 0, gap: 1, serial: 0, status: 'playing',
    soaps: [], nextSoap: 2600, nextDart: 0, spawned: 0, collected: 0, charge: 0, shield: false, score: 0, events: [],
  };
}
export const phaseAt = (elapsed: number) => elapsed >= 18_000 ? 2 : elapsed >= 9_000 ? 1 : 0;
const kindOf = (hazard: PoolHazard): HazardKind => hazard.kind ?? (hazard.boss ? 'wave' : 'float');
const speedOf = (kind: HazardKind) => kind === 'wave' ? 106 : kind === 'dart' ? 280 : kind === 'bob' ? 115 : 125;
const clampY = (y: number) => Math.max(115, Math.min(515, y));

function spawnHazard(state: PoolState, random: () => number) {
  const phase = phaseAt(state.elapsed);
  const roll = random();
  const id = state.serial++;
  if (phase === 2 && roll < .35) {
    // Torpedoes aim at the swimmer, but wait at the edge long enough to dodge.
    state.hazards.push({ id, x: 380, y: clampY(state.y), boss: false, kind: 'dart', warn: DART_WARN });
  } else if (phase >= 1 && roll < .7) {
    const baseY = 165 + random() * 300;
    state.hazards.push({ id, x: 390, y: baseY, baseY, boss: false, kind: 'bob' });
  } else {
    state.hazards.push({ id, x: 390, y: 115 + random() * 400, boss: false, kind: 'float' });
  }
}

/** Soap appears in the water farthest from fresh hazards, so it is a reward, not a trap. */
function spawnSoap(state: PoolState, random: () => number) {
  const fresh = state.hazards.filter(h => h.x > 240 && kindOf(h) !== 'dart');
  const candidates = [135, 205, 275, 345, 415, 485];
  const room = (y: number) => Math.min(999, ...fresh.map(h => Math.abs((h.baseY ?? h.y) - y)));
  const best = Math.max(...candidates.map(room));
  const options = candidates.filter(y => room(y) >= best - 30);
  state.soaps.push({ id: state.serial++, x: 390, y: options[Math.floor(random() * options.length)], speed: 125 });
  state.spawned++;
}

// Bounded steps keep collision checks reliable even after a long browser frame.
export function advancePool(state: PoolState, delta: number, up: boolean, random = Math.random): void {
  if (state.status !== 'playing') return;
  const dt = Math.max(0, Math.min(delta, 50));
  state.elapsed += dt;
  state.y = Math.max(100, Math.min(530, state.y + (up ? -205 : 150) * dt / 1000));
  state.invincible = Math.max(0, state.invincible - dt);
  if (state.elapsed >= state.nextSpawn && state.elapsed < PRE_BOSS_MS) {
    spawnHazard(state, random);
    state.nextSpawn += [1300, 1150, 1000][phaseAt(state.elapsed)];
  }
  if (state.elapsed >= state.nextSoap && state.elapsed < PRE_BOSS_MS) {
    spawnSoap(state, random);
    state.nextSoap += 1500;
  }
  if (state.elapsed >= state.nextWave && state.nextWave <= 41_000) {
    // The opening moves only one lane per wave, so the next route is reachable.
    state.gap = [1, 2, 1, 0][state.wave];
    for (let lane = 0; lane < GAP_Y.length; lane++) {
      if (lane !== state.gap) state.hazards.push({ id: state.serial++, x: 300, y: GAP_Y[lane], boss: true, kind: 'wave' });
    }
    state.soaps.push({ id: state.serial++, x: 300, y: GAP_Y[state.gap], speed: 106 });
    state.spawned++;
    state.wave++; state.nextWave += 3000;
  }
  if (state.nextDart < BOSS_DARTS.length && state.elapsed >= BOSS_DARTS[state.nextDart]) {
    state.hazards.push({ id: state.serial++, x: 330, y: clampY(state.y), boss: true, kind: 'dart', warn: DART_WARN });
    state.nextDart++;
  }
  for (const hazard of state.hazards) {
    const kind = kindOf(hazard);
    if (hazard.warn) { hazard.warn = Math.max(0, hazard.warn - dt); continue; }
    hazard.x -= speedOf(kind) * dt / 1000;
    if (kind === 'bob') hazard.y = hazard.baseY! + Math.sin(state.elapsed / 280 + hazard.id) * 48;
    const dx = (hazard.x - PLAYER_X) / 48;
    const dy = (hazard.y - state.y) / (kind === 'wave' ? 39 : 31);
    if (state.invincible === 0 && dx * dx + dy * dy < 1) {
      hazard.x = -100;
      if (state.shield) { state.shield = false; state.invincible = 1000; state.events.push('block'); continue; }
      state.lives--; state.invincible = 1500; state.events.push('hit');
      if (state.lives === 0) { state.status = 'lost'; break; }
    }
  }
  for (const soap of state.soaps) {
    soap.x -= soap.speed * dt / 1000;
    const dx = (soap.x - PLAYER_X) / 42, dy = (soap.y - state.y) / 38;
    if (state.status === 'playing' && dx * dx + dy * dy < 1) {
      soap.x = -100; state.collected++;
      state.score += state.elapsed >= BOSS_MS ? 25 : 10;
      if (state.shield) state.score += 10;
      else if (++state.charge >= SOAP_FOR_SHIELD) { state.charge = 0; state.shield = true; state.events.push('shield'); }
      state.events.push('soap');
    }
  }
  state.hazards = state.hazards.filter(hazard => hazard.x > -60);
  state.soaps = state.soaps.filter(soap => soap.x > -60);
  if (state.status === 'playing' && state.elapsed >= ROUND_MS) { state.status = 'won'; state.score += state.lives * 50; }
}

export function poolRating(state: PoolState) {
  const share = state.spawned ? state.collected / state.spawned : 0;
  return share >= .7 && state.lives === 3 ? 3 : share >= .45 ? 2 : 1;
}
