import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { authenticate } from '../worker/auth.ts';
const token = 'test-token';
const now = 1800000000000;
function signed(date = now / 1000) {
  const params = new URLSearchParams({ auth_date: String(date), user: JSON.stringify({ id: 1234567 }), query_id: 'test' });
  const data = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  params.set('hash', createHmac('sha256', secret).update(data).digest('hex'));
  return params.toString();
}
test('accepts authentic Telegram user', async () => assert.equal(await authenticate(signed(), token, now), '1234567'));
test('rejects modified user and wrong bot token', async () => {
  assert.equal(await authenticate(signed().replace('1234567', '7654321'), token, now), null);
  assert.equal(await authenticate(signed(), 'wrong', now), null);
});
test('rejects expired, future and duplicate parameters', async () => {
  assert.equal(await authenticate(signed(now / 1000 - 86401), token, now), null);
  assert.equal(await authenticate(signed(now / 1000 + 60), token, now), null);
  assert.equal(await authenticate(`${signed()}&auth_date=1`, token, now), null);
});
test('rejects missing or malformed hash', async () => {
  assert.equal(await authenticate('', token, now), null);
  assert.equal(await authenticate('hash=xyz', token, now), null);
});
