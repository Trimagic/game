import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHmac } from 'node:crypto';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

// Run after npm run build. Uses the real Workers runtime and an isolated D1 database.
const token = 'integration-test-token';
const mf = new Miniflare(convertV4MiniflareOptions({ modules: true, scriptPath: 'dist/telegram_comic_game/index.js', compatibilityDate: '2026-10-12', d1Databases: ['DB'], bindings: { BOT_TOKEN: token } }));
function auth(id) {
  const params = new URLSearchParams({ auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify({ id }) });
  const data = [...params].sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n');
  const key = createHmac('sha256', 'WebAppData').update(token).digest();
  params.set('hash', createHmac('sha256', key).update(data).digest('hex'));
  return params.toString();
}
async function request(id, level) {
  const response = await mf.dispatchFetch('https://game.test/api/progress', { method: level === undefined ? 'GET' : 'POST', headers: { 'X-Telegram-Init-Data': auth(id) }, body: level === undefined ? undefined : JSON.stringify({ level }) });
  return { status: response.status, data: await response.json() };
}
try {
  const db = await mf.getD1Database('DB');
  await db.prepare(await readFile('migrations/0001_progress.sql', 'utf8')).run();
  assert.equal((await mf.dispatchFetch('https://game.test/api/progress')).status, 401);
  assert.equal((await request(101)).data.completed, 0);
  assert.equal((await request(101, 2)).status, 409);
  assert.equal((await request(101, -1)).status, 400);
  const concurrent = await Promise.all([request(101, 1), request(101, 1)]);
  assert.ok(concurrent.every(r => r.status === 200 && r.data.completed === 1));
  assert.equal((await request(101, 2)).data.completed, 2);
  assert.equal((await request(101, 1)).data.completed, 2);
  assert.equal((await request(202)).data.completed, 0);
  for (let level = 3; level <= 10; level++) assert.equal((await request(101, level)).data.completed, level);
  assert.equal((await request(101, 11)).status, 400);
  console.log('PASS: authentication, D1 persistence, sequential unlocks, concurrency, replay, user isolation, ten levels');
} finally { await mf.dispose(); }
