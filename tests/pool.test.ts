import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advancePool, createPoolState, GAP_Y, PLAYER_X, ROUND_MS } from '../src/pool/model.ts';

test('swimmer responds to hold and stays inside pool', () => {
  const state = createPoolState();
  for (let i=0;i<50;i++) advancePool(state, 20, true, () => 1);
  assert.ok(Math.abs(state.y - 110) < 1e-8);
  for (let i=0;i<400;i++) advancePool(state, 20, false, () => 0);
  assert.equal(state.y,530);
});
test('boss appears at end and each wave leaves a reachable opening', () => {
  const state = createPoolState(); state.elapsed = 31_980; state.y = GAP_Y[1];
  advancePool(state, 20, false);
  assert.equal(state.wave,1); assert.equal(state.hazards.length,3);
  assert.ok(state.hazards.every(h => h.boss && h.y !== GAP_Y[1]));
  state.elapsed = 34_980; state.hazards = [];
  advancePool(state,20,false);
  assert.equal(state.gap,2); assert.equal(state.wave,2);
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
test('full round is survivable, including all four boss waves', () => {
  const state = createPoolState();
  for (let i=0;i<2251 && state.status==='playing';i++) {
    const incoming = state.hazards.filter(h => h.boss && h.x > PLAYER_X - 45);
    const target = incoming.length ? GAP_Y.find(y => !incoming.some(h => h.y === y)) ?? 255 : 255;
    advancePool(state,20,state.y > target, () => 0);
  }
  assert.equal(state.status,'won'); assert.equal(state.wave,4); assert.equal(state.lives,3);
});
