import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const gameUrl = process.argv[2];
if (!gameUrl || new URL(gameUrl).protocol !== 'https:') throw new Error('Pass the deployed HTTPS game URL as the first argument');
const vars = await readFile(new URL('../.dev.vars', import.meta.url), 'utf8');
const token = vars.match(/^BOT_TOKEN=(\d+:[A-Za-z0-9_-]+)\s*$/m)?.[1];
if (!token) throw new Error('BOT_TOKEN is missing or invalid in .dev.vars');

async function botApi(method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(`Telegram ${method} failed`);
  return result.result;
}

const bot = await botApi('getMe');
console.log(`Telegram bot: @${bot.username}`);

await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'secret', 'put', 'BOT_TOKEN'], {
    cwd: new URL('..', import.meta.url),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  child.on('error', () => reject(new Error('Failed to start Wrangler')));
  child.on('close', code => code === 0 ? resolve() : reject(new Error('Wrangler could not save BOT_TOKEN')));
  child.stdin.end(`${token}\n`);
});
console.log('Cloudflare BOT_TOKEN secret saved');

await botApi('setChatMenuButton', {
  menu_button: { type: 'web_app', text: 'Играть', web_app: { url: gameUrl } },
});
const menu = await botApi('getChatMenuButton');
if (menu.type !== 'web_app' || menu.web_app?.url !== gameUrl) throw new Error('Telegram menu verification failed');
console.log(`Telegram menu verified: ${menu.text} → ${menu.web_app.url}`);
