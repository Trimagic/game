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
