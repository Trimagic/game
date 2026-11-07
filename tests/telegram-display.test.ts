import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeTelegramDisplay} from '../src/telegram-display.ts';

test('startup expands and requests native fullscreen on supported Telegram clients', () => {
  const calls: string[] = [];
  initializeTelegramDisplay({ready: () => calls.push('ready'), expand: () => calls.push('expand'),
    isVersionAtLeast: version => version === '8.0', requestFullscreen: () => calls.push('fullscreen')});
  assert.deepEqual(calls, ['ready', 'expand', 'fullscreen']);
});

test('browser, old clients, already fullscreen and rejected requests remain usable', () => {
  assert.doesNotThrow(() => initializeTelegramDisplay());
  let expanded = 0, requested = 0;
  const app = {ready() {}, expand() {expanded++;}, requestFullscreen() {requested++;}};
  initializeTelegramDisplay({...app, isVersionAtLeast: () => false});
  initializeTelegramDisplay({...app, isVersionAtLeast: () => true, isFullscreen: true});
  assert.equal(expanded, 2); assert.equal(requested, 0);
  assert.doesNotThrow(() => initializeTelegramDisplay({...app, isVersionAtLeast: () => true, requestFullscreen() {throw new Error('unsupported');}}));
});

test('vertical swipes are disabled from Bot API 7.7, independently of fullscreen', () => {
  const calls: string[] = [];
  const app = {ready() {}, expand() {}, disableVerticalSwipes() {calls.push('swipes');}, requestFullscreen() {calls.push('fullscreen');}};
  initializeTelegramDisplay({...app, isVersionAtLeast: version => version === '7.7'});
  assert.deepEqual(calls, ['swipes']);
  calls.length = 0;
  initializeTelegramDisplay({...app, isVersionAtLeast: () => false});
  assert.deepEqual(calls, []);
  initializeTelegramDisplay({...app, isVersionAtLeast: () => true, isFullscreen: true});
  assert.deepEqual(calls, ['swipes']);
});

test('a failure in one startup request does not cancel the other', () => {
  let fullscreen = 0;
  assert.doesNotThrow(() => initializeTelegramDisplay({ready() {}, expand() {}, isVersionAtLeast: () => true, disableVerticalSwipes() {throw new Error('unsupported');}, requestFullscreen() {fullscreen++;}}));
  assert.equal(fullscreen, 1);
});
