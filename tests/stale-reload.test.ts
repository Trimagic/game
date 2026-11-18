import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reloadOnStaleChunks } from '../src/stale-reload.ts';

function setup(store: Map<string, string> | undefined = new Map()) {
  const target = new EventTarget();
  let reloads = 0, clock = 1_000_000;
  const storage = store && { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
  reloadOnStaleChunks(target, storage, () => reloads++, () => clock);
  const fire = () => { const e = new Event('vite:preloadError', { cancelable: true }); target.dispatchEvent(e); return e.defaultPrevented; };
  return { fire, reloads: () => reloads, tick: (ms: number) => { clock += ms; } };
}

test('A failed chapter file reloads the page and swallows the error', () => {
  const s = setup();
  assert.equal(s.fire(), true);
  assert.equal(s.reloads(), 1);
});

test('A second failure right after a reload shows the error instead of looping', () => {
  const s = setup();
  s.fire();
  s.tick(3_000);
  assert.equal(s.fire(), false);
  assert.equal(s.reloads(), 1);
  s.tick(10_000);
  assert.equal(s.fire(), true);
  assert.equal(s.reloads(), 2);
});

test('Blocked storage still reloads', () => {
  const target = new EventTarget();
  let reloads = 0;
  reloadOnStaleChunks(target, { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }, () => reloads++);
  target.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
  assert.equal(reloads, 1);
});
