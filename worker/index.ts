import { authenticate } from './auth';
interface Env { DB: D1Database; ASSETS: Fetcher; BOT_TOKEN?: string }
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (url.pathname !== '/api/progress') return json({ error: 'Not found' }, 404);
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
    if (!env.BOT_TOKEN) return json({ error: 'Telegram authentication is not configured' }, 503);
    const user = await authenticate(request.headers.get('X-Telegram-Init-Data') ?? '', env.BOT_TOKEN);
    if (!user) return json({ error: 'Открой игру заново через Telegram.' }, 401);
    try {
      await env.DB.prepare('INSERT OR IGNORE INTO progress (user_id) VALUES (?)').bind(user).run();
      if (request.method === 'POST') {
        const text = await request.text();
        if (text.length > 1024) return json({ error: 'Payload too large' }, 413);
        let level: unknown;
        try { level = JSON.parse(text).level; } catch { return json({ error: 'Invalid JSON' }, 400); }
        if (typeof level !== 'number' || !Number.isInteger(level) || level < 1 || level > 10) return json({ error: 'Invalid level' }, 400);
        // Atomic, sequential and idempotent: concurrent requests cannot skip chapters.
        await env.DB.prepare('UPDATE progress SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND completed = ?').bind(level, user, level - 1).run();
        const row = await env.DB.prepare('SELECT completed FROM progress WHERE user_id = ?').bind(user).first<{ completed: number }>();
        if (!row || row.completed < level) return json({ error: 'Previous chapter is incomplete' }, 409);
        return json(row);
      }
      const row = await env.DB.prepare('SELECT completed FROM progress WHERE user_id = ?').bind(user).first();
      return json(row);
    } catch (error) {
      console.error('Progress storage failed', error instanceof Error ? error.message : 'unknown');
      return json({ error: 'Не удалось сохранить прогресс. Попробуй ещё раз.' }, 503);
    }
  },
} satisfies ExportedHandler<Env>;
