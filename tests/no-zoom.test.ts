import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lockGestures} from '../src/no-zoom.ts';

function setup() {
  const handlers = new Map<string, (event: never) => void>();
  let clock = 0;
  lockGestures({addEventListener: (type, listener, options) => {
    assert.equal(options?.passive, false, `${type} must be able to cancel`);
    handlers.set(type, listener);
  }}, () => clock);
  const fire = (type: string, event: object = {}) => {
    let stopped = false;
    handlers.get(type)!({preventDefault() {stopped = true;}, ...event} as never);
    return stopped;
  };
  return {fire, wait: (ms: number) => {clock += ms;}};
}
const plain = {closest: () => null};
const button = {closest: () => ({})};

test('Pinch gestures, selection, the long-press menu and double clicks are cancelled', () => {
  const {fire} = setup();
  for (const type of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'selectstart', 'dragstart', 'contextmenu'])
    assert.equal(fire(type), true, type);
});
test('Only two fingers moving is a pinch; one finger still scrolls', () => {
  const {fire} = setup();
  assert.equal(fire('touchmove', {touches: {length: 1}}), false);
  assert.equal(fire('touchmove', {touches: {length: 2}}), true);
  assert.equal(fire('touchmove', {touches: {length: 2}, cancelable: false}), false, 'a running scroll cannot be cancelled');
});
test('A quick second tap is cancelled, a slow one is not, and buttons keep every click', () => {
  const {fire, wait} = setup();
  const tap = (target: object, touches = 0) => fire('touchend', {touches: {length: touches}, target});
  assert.equal(tap(plain), false);
  wait(100);
  assert.equal(tap(plain), true);
  wait(500);
  assert.equal(tap(plain), false);
  wait(100);
  assert.equal(tap(button), false);
  wait(100);
  assert.equal(tap(plain, 1), false, 'a finger is still down: the thumbs are playing');
});
test('Keyboard and trackpad zoom are cancelled, ordinary keys are not', () => {
  const {fire} = setup();
  assert.equal(fire('wheel', {ctrlKey: true}), true);
  assert.equal(fire('wheel', {ctrlKey: false}), false);
  assert.equal(fire('keydown', {ctrlKey: true, metaKey: false, key: '+'}), true);
  assert.equal(fire('keydown', {ctrlKey: false, metaKey: true, key: '-'}), true);
  assert.equal(fire('keydown', {ctrlKey: false, metaKey: false, key: '-'}), false);
  assert.equal(fire('keydown', {ctrlKey: true, metaKey: false, key: 'c'}), false);
});
