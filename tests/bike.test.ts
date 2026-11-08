import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AIR_MS, blocked, clampLane, course, phases, DURATION, HEART_TIMES, laneAt, laneX, LAST_ROW, multiplier, phaseAt, rating, speedAt, type Spawn } from '../src/bike/model.ts';

const rows = (spawns: Spawn[]) => {
  const map = new Map<number, Spawn[]>();
  for (const s of spawns) if (!['star', 'heart', 'ramp', 'puddle', 'boost'].includes(s.kind)) map.set(s.at, [...(map.get(s.at) ?? []), s]);
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
};

test('course is deterministic for a seed and varies between seeds', () => {
  assert.deepEqual(course(7), course(7));
  assert.notDeepEqual(course(7), course(8));
});

test('every hazard row leaves a free lane and stars only mark free lanes', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const spawns = course(seed);
    const hazardRows = rows(spawns);
    for (const [at, row] of hazardRows) {
      const lanes = blocked(row);
      assert.ok(lanes.size < 3, `seed ${seed} row ${at} blocks every lane`);
      for (const s of row) if (s.shift) assert.ok(s.lane + s.shift >= 0 && s.lane + s.shift <= 2);
    }
    for (const pickup of spawns.filter(s => s.kind === 'star' || s.kind === 'heart')) {
      for (const [at, row] of hazardRows) if (Math.abs(at - pickup.at) < 300) assert.ok(!blocked(row).has(pickup.lane), `seed ${seed} pickup at ${pickup.at} sits on a hazard`);
    }
  }
});

test('rows leave enough time to cross two lanes and stop before the finish', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const times = rows(course(seed)).map(([at]) => at);
    for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= 850);
    assert.ok(times.at(-1)! <= LAST_ROW && LAST_ROW < DURATION);
  }
});

test('later phases bring walls, kid dashes and hearts', () => {
  const spawns = course(42);
  assert.ok(spawns.some(s => s.kind === 'kid' && s.shift));
  assert.ok(rows(spawns).some(([, row]) => row.length === 2));
  assert.equal(spawns.filter(s => s.kind === 'heart').length, HEART_TIMES.length);
  assert.ok(rows(spawns).filter(([at]) => phaseAt(at) === 0).every(([, row]) => row.length === 1 && !row[0].shift));
});

test('speed rises across phases, combo caps, rating rewards clean collecting', () => {
  assert.ok(speedAt(0) < speedAt(13000) && speedAt(13000) < speedAt(39000));
  assert.deepEqual([0, 3, 4, 8, 16, 30].map(multiplier), [1, 1, 2, 3, 5, 5]);
  assert.equal(rating(30, 40, 3), 3);
  assert.equal(rating(30, 40, 2), 2);
  assert.equal(rating(5, 40, 3), 1);
});

test('every hurdle has a ramp before it in its lane, and the ramp lane is otherwise clear', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const spawns = course(seed);
    for (const h of spawns.filter(s => s.kind === 'hurdle')) {
      assert.ok(spawns.some(s => s.kind === 'ramp' && s.lane === h.lane && h.at - s.at === 260), `seed ${seed}: hurdle at ${h.at} has no ramp`);
      const row = spawns.filter(s => s.at === h.at && !['star', 'heart', 'hurdle'].includes(s.kind));
      assert.ok(row.every(s => s.lane !== h.lane), `seed ${seed}: something else sits in the ramp lane`);
    }
  }
  const all = Array.from({ length: 30 }, (_, i) => course(i + 1)).flat();
  for (const kind of ['ramp', 'puddle', 'boost'] as const) assert.ok(all.some(s => s.kind === kind), kind);
  assert.ok(all.filter(s => s.kind === 'ramp').every(s => phaseAt(s.at + 260) >= 1), 'the warm-up stays simple');
  assert.equal(phases.length, 4);
});
test('touching the road picks the lane under the finger and every lane centre maps to itself', () => {
  for (const lane of [0, 1, 2]) assert.equal(laneAt(laneX(lane)), lane);
  assert.deepEqual([0, 131, 132, 227, 228, 360].map(laneAt), [0, 0, 1, 1, 2, 2]);
  assert.deepEqual([-1, 0, 2, 3].map(clampLane), [0, 0, 2, 2]);
});
test('a jump from the ramp lasts until the hurdle has passed, even at the slowest ramp speed', () => {
  // The hurdle is 260 ms behind the ramp and the hit window is 80 px tall.
  const slowest = speedAt(phases[1].from);
  assert.ok(260 + 80 / slowest * 1000 < AIR_MS - 60, String(slowest));
});
