import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advancePool, BOSS_DARTS, createPoolState, DART_WARN, GAP_Y, PLAYER_X, poolRating, TOP, BOTTOM, WALL_BOUNCE, ROUND_MS, SOAP_FOR_SHIELD, type PoolState } from '../src/pool/model.ts';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
}

// Lookahead player: tries holding or releasing for a while, then hovering, and keeps the safest plan.
const hover = (frame: number) => frame % 7 < 3;
const plans = [true, false].flatMap(dir => [0, 5, 10, 15, 20, 25].map(k => (frame: number) => frame < k ? dir : hover(frame)));
function bot(state: PoolState) {
  let best = plans[0], bestScore = -Infinity;
  for (const plan of plans) {
    const s = structuredClone(state);
    for (let frame = 0; frame < 30 && s.status === 'playing'; frame++) advancePool(s, 40, plan(frame), () => .5);
    const score = s.lives * 1000 + s.collected * 5 - (s.status === 'lost' ? 5000 : 0) - Math.abs(s.y - 315) * .01;
    if (score > bestScore) { bestScore = score; best = plan; }
  }
  return best(0);
}

test('touching either pool edge costs a life and bounces the swimmer back', () => {
  const top = createPoolState();
  for (let i=0;i<100&&top.lives===3;i++) advancePool(top, 20, true, () => 1);
  assert.equal(top.lives,2); assert.equal(top.y,TOP+WALL_BOUNCE); assert.ok(top.events.includes('wall')); assert.equal(top.invincible,1500);
  const bottom = createPoolState();
  for (let i=0;i<100&&bottom.lives===3;i++) advancePool(bottom, 20, false, () => 0);
  assert.equal(bottom.lives,2); assert.equal(bottom.y,BOTTOM-WALL_BOUNCE);
  // While still blinking, the edge only stops the swimmer.
  for (let i=0;i<20;i++) advancePool(bottom, 20, false, () => 0);
  assert.equal(bottom.lives,2); assert.ok(bottom.y<=BOTTOM);
});
test('the bubble shield absorbs a wall hit and the third hit loses', () => {
  const s = { ...createPoolState(), shield: true, y: TOP + 1 };
  advancePool(s, 20, true, () => 1); assert.equal(s.lives,3); assert.equal(s.shield,false); assert.ok(s.events.includes('block'));
  const last = { ...createPoolState(), lives: 1, y: BOTTOM - 1 };
  advancePool(last, 20, false, () => 0); assert.equal(last.status,'lost');
});
test('boss appears at end, each wave leaves a reachable opening with soap in it', () => {
  const state = createPoolState(); state.elapsed = 31_980; state.y = GAP_Y[1];
  advancePool(state, 20, false);
  assert.equal(state.wave,1); assert.equal(state.hazards.length,3);
  assert.ok(state.hazards.every(h => h.boss && h.y !== GAP_Y[1]));
  assert.ok(state.soaps.some(s => s.y === GAP_Y[1] && Math.abs(s.x - 300) < 5));
  state.elapsed = 34_980; state.hazards = [];
  advancePool(state,20,false);
  assert.equal(state.gap,2); assert.equal(state.wave,2);
});
test('torpedoes aim at the swimmer and wait before launching', () => {
  const state = createPoolState(); state.elapsed = BOSS_DARTS[0] - 10; state.y = 400; state.nextWave = 99_000;
  advancePool(state, 20, false);
  const dart = state.hazards.find(h => h.kind === 'dart')!;
  assert.equal(dart.y, state.y); assert.equal(dart.warn, DART_WARN - 20);
  const x = dart.x;
  advancePool(state, 20, false); assert.equal(dart.x, x);
  for (let t = 0; t < DART_WARN + 40; t += 20) advancePool(state, 20, false);
  assert.ok(dart.x < x);
});
test('soap charges a shield that absorbs exactly one hit', () => {
  const state = createPoolState();
  for (let i = 0; i < SOAP_FOR_SHIELD; i++) { state.soaps.push({ id: 100 + i, x: PLAYER_X, y: state.y, speed: 0 }); advancePool(state, 1, false); }
  assert.equal(state.shield, true); assert.equal(state.collected, SOAP_FOR_SHIELD); assert.ok(state.score > 0);
  state.hazards = [{ id: 0, x: PLAYER_X, y: state.y, boss: false }];
  advancePool(state, 16, false);
  assert.equal(state.lives, 3); assert.equal(state.shield, false); assert.ok(state.events.includes('block'));
  state.invincible = 0; state.hazards = [{ id: 1, x: PLAYER_X, y: state.y, boss: false }];
  advancePool(state, 16, false); assert.equal(state.lives, 2);
});
test('collision grace period prevents multiple lost lives in one hit', () => {
  const state = createPoolState();
  state.hazards = [0,1,2].map(id => ({id,x:PLAYER_X,y:state.y,boss:false}));
  advancePool(state,16,false);
  assert.equal(state.lives,2); assert.equal(state.status,'playing');
  advancePool(state,16,false); assert.equal(state.lives,2);
});
test('third hit loses; loss cannot become victory', () => {
  const state = createPoolState(); state.elapsed = ROUND_MS - 10; state.lives = 1;
  state.hazards = [{id:0,x:PLAYER_X,y:state.y,boss:false}];
  advancePool(state,20,false); assert.equal(state.status,'lost');
  const elapsed = state.elapsed; advancePool(state,1000,false); assert.equal(state.elapsed,elapsed);
});
test('full round with every hazard type is survivable across seeds', () => {
  for (let seed = 1; seed <= 6; seed++) {
    const state = createPoolState(); const random = rng(seed);
    for (let i = 0; i < 2300 && state.status === 'playing'; i++) advancePool(state, 20, bot(state), random);
    assert.equal(state.status, 'won', `seed ${seed} lost at ${state.elapsed}`);
    assert.equal(state.wave, 4); assert.ok(state.lives >= 2);
    assert.ok(state.collected >= state.spawned / 2 && state.spawned >= state.collected);
    assert.ok(poolRating(state) >= 2);
  }
});
