export const ROUND_MS = 45_000;
export const BOSS_MS = 30_000;
export const PLAYER_X = 78;
export const GAP_Y = [135, 255, 375, 495];
export type PoolHazard = { id: number; x: number; y: number; boss: boolean };
export type PoolState = {
  elapsed: number; y: number; lives: number; invincible: number;
  hazards: PoolHazard[]; nextSpawn: number; nextWave: number;
  wave: number; gap: number; serial: number; status: 'playing' | 'lost' | 'won';
};
export function createPoolState(): PoolState {
  return { elapsed: 0, y: 315, lives: 3, invincible: 0, hazards: [], nextSpawn: 1800, nextWave: 32_000, wave: 0, gap: 1, serial: 0, status: 'playing' };
}
// Bounded steps keep collision checks reliable even after a long browser frame.
export function advancePool(state: PoolState, delta: number, up: boolean, random = Math.random): void {
  if (state.status !== 'playing') return;
  const dt = Math.max(0, Math.min(delta, 50));
  state.elapsed += dt;
  state.y = Math.max(100, Math.min(530, state.y + (up ? -205 : 150) * dt / 1000));
  state.invincible = Math.max(0, state.invincible - dt);
  if (state.elapsed >= state.nextSpawn && state.elapsed < 27_000) {
    state.hazards.push({ id: state.serial++, x: 390, y: 115 + random() * 400, boss: false });
    state.nextSpawn += 1250;
  }
  if (state.elapsed >= state.nextWave && state.nextWave <= 41_000) {
    // The opening moves only one lane per wave, so the next route is reachable.
    state.gap = [1, 2, 1, 0][state.wave];
    for (let lane = 0; lane < GAP_Y.length; lane++) {
      if (lane !== state.gap) state.hazards.push({ id: state.serial++, x: 300, y: GAP_Y[lane], boss: true });
    }
    state.wave++; state.nextWave += 3000;
  }
  for (const hazard of state.hazards) {
    hazard.x -= (hazard.boss ? 106 : 125) * dt / 1000;
    const dx = (hazard.x - PLAYER_X) / 48;
    const dy = (hazard.y - state.y) / (hazard.boss ? 39 : 31);
    if (state.invincible === 0 && dx * dx + dy * dy < 1) {
      state.lives--; state.invincible = 1500; hazard.x = -100;
      if (state.lives === 0) { state.status = 'lost'; break; }
    }
  }
  state.hazards = state.hazards.filter(hazard => hazard.x > -60);
  if (state.status === 'playing' && state.elapsed >= ROUND_MS) state.status = 'won';
}
