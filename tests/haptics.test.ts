import test from 'node:test';
import assert from 'node:assert/strict';
import {Haptics} from '../src/haptics.ts';
import {Soundtrack} from '../src/audio/sound.ts';

test('haptics throttle repeated collisions and bonuses, but prioritize errors and final results', () => {
  let now = 0;
  const calls: string[] = [];
  const h = new Haptics(() => ({impactOccurred: value => calls.push(value), notificationOccurred: value => calls.push(value)}), () => now);
  h.cue('good'); h.cue('hit'); h.cue('hit'); h.cue('good');
  assert.deepEqual(calls, ['light', 'medium']);
  now = 351; h.cue('error'); h.cue('lose'); h.cue('lose');
  assert.deepEqual(calls, ['light', 'medium', 'error', 'error']);
  now = 700; h.cue('good'); assert.equal(calls.length, 4);
  now = 1400; h.cue('win'); assert.equal(calls.at(-1), 'success');
  h.cue('tap'); h.cue('jump'); assert.equal(calls.length, 5);
});

test('missing or failing Telegram SDK and background tabs never interrupt play', () => {
  assert.doesNotThrow(() => new Haptics(() => undefined).cue('hit'));
  assert.doesNotThrow(() => new Haptics(() => ({impactOccurred() {throw new Error('unsupported');}, notificationOccurred() {throw new Error('unsupported');}})).cue('hit'));
  let calls = 0;
  const h = new Haptics(() => ({impactOccurred() {calls++;}, notificationOccurred() {calls++;}}), () => 0, () => false);
  h.cue('hit'); h.cue('win'); assert.equal(calls, 0);
});

test('game cues still trigger haptics with sound muted, but stop while suspended', () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const calls: string[] = [];
  Object.defineProperty(globalThis, 'window', {configurable: true, value: {Telegram: {WebApp: {HapticFeedback: {
    impactOccurred: (value: string) => calls.push(value), notificationOccurred: (value: string) => calls.push(value),
  }}}}});
  try {
    const sound = new Soundtrack(); sound.enabled = false;
    sound.cue('win'); assert.deepEqual(calls, ['success']);
    sound.suspend(); sound.cue('hit'); assert.equal(calls.length, 1);
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});
