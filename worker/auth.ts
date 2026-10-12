const encoder = new TextEncoder();
async function hmac(key: Uint8Array, value: string) {
  const cryptoKey = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(value)));
}
export async function authenticate(raw: string, token: string, now = Date.now()): Promise<string | null> {
  if (!raw || raw.length > 8192) return null;
  const params = new URLSearchParams(raw);
  if (new Set(params.keys()).size !== [...params.keys()].length) return null;
  const hash = params.get('hash');
  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) return null;
  const date = Number(params.get('auth_date'));
  if (!Number.isInteger(date) || date > now / 1000 + 30 || now / 1000 - date > 86400) return null;
  params.delete('hash');
  const data = [...params.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = await hmac(encoder.encode('WebAppData'), token);
  const expected = await hmac(secret, data);
  let difference = 0;
  for (let i = 0; i < 32; i++) difference |= expected[i] ^ parseInt(hash.slice(i * 2, i * 2 + 2), 16);
  if (difference) return null;
  try {
    const user = JSON.parse(params.get('user') ?? 'null');
    return Number.isSafeInteger(user?.id) && user.id > 0 ? String(user.id) : null;
  } catch { return null; }
}
