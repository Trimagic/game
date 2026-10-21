export const WIDTH = 360;
export const HEIGHT = 500;
export const GRAVITY = 1200;
export const JUMP = 540;
export const FINISH = 3600;
export type Platform = { id: number; x: number; y: number; w: number; kind: 'solid' | 'moving' | 'spring' | 'rest' | 'finish' };
export const platforms: Platform[] = Array.from({ length: 46 }, (_, i) => ({
  id: i, x: [180, 85, 180, 275, 180][i % 5], y: i * 80,
  w: i === 0 || i === 15 || i === 30 || i === 45 ? 310 : i < 15 ? 116 : i < 30 ? 96 : 82,
  kind: i === 45 ? 'finish' : i === 15 || i === 30 ? 'rest' : i > 30 && i % 4 === 1 ? 'moving' : 'solid',
}));
// Optional spring detours can skip a step; the ordinary route is always present.
for (let i = 5; i < 40; i += 5) platforms.push({ id: 100 + i, x: i % 10 ? 335 : 25, y: i * 80 + 35, w: 46, kind: 'spring' });
export const platformX = (p: Platform, time: number) => p.x + (p.kind === 'moving' ? Math.sin(time * 1.8 + p.id) * 20 : 0);
export type Hazard = { kind: 'bag' | 'door' | 'cat'; x: number; y: number; active: boolean; warning: boolean };
export function hazards(time: number): Hazard[] {
  const result: Hazard[] = [];
  for (const row of [18, 23, 28]) {
    const p = platforms[row]; result.push({ kind: 'bag', x: p.x + 36, y: p.y + 16, active: true, warning: false });
  }
  for (const row of [17, 26, 34, 42]) {
    const phase = (time + row * 0.3) % 4;
    result.push({ kind: 'door', x: row % 2 ? 28 : 332, y: row * 80 + 35, active: phase > 2.2, warning: phase > 1.4 && phase <= 2.2 });
  }
  for (const row of [33, 38, 43]) result.push({ kind: 'cat', x: 180 + Math.sin(time * 1.6 + row) * 125, y: row * 80 + 15, active: true, warning: false });
  return result;
}
export type State = { x: number; y: number; vy: number; vx: number; camera: number; high: number; time: number; checkpoint: number; falls: number; bounces: number; invincible: number; stun: number; status: 'playing' | 'rest' | 'fallen' | 'won'; message: string; last: number };
export function initial(checkpoint = 0, falls = 0): State { return { x: 180, y: checkpoint, vy: JUMP, vx: 0, camera: Math.max(0, checkpoint - 160), high: checkpoint, time: 0, checkpoint, falls, bounces: 0, invincible: 1.2, stun: 0, status: 'playing', message: 'Лифт? Не сегодня!', last: checkpoint / 80 }; }
export function resume(s: State): State {
  if (s.status === 'rest') return { ...s, status: 'playing', vy: JUMP, invincible: 1.5 };
  if (s.status === 'fallen') return { ...initial(s.checkpoint, s.falls), high: s.high, bounces: s.bounces, message: 'Арбуз цел. Продолжаем!' };
  return s;
}
export function step(s: State, direction: number, dt: number): State {
  if (s.status !== 'playing') return s;
  // Fixed small steps keep landing detection stable on slow frames.
  let remaining = Math.max(0, Math.min(dt, 0.1));
  while (remaining > 0.00001 && s.status === 'playing') {
    const h = Math.min(remaining, 1 / 120); remaining -= h;
    const previousY = s.y;
    const vx = s.stun > 0 ? s.vx : Math.max(-1, Math.min(1, direction)) * 225;
    s = { ...s, time: s.time + h, x: Math.max(18, Math.min(WIDTH - 18, s.x + vx * h)), y: s.y + s.vy * h - GRAVITY * h * h / 2, vy: s.vy - GRAVITY * h, vx, invincible: Math.max(0, s.invincible - h), stun: Math.max(0, s.stun - h) };
    if (s.vy < 0) {
      const landing = platforms.filter(p => previousY >= p.y && s.y <= p.y && Math.abs(s.x - platformX(p, s.time)) < p.w / 2 + 10).sort((a,b) => b.y-a.y)[0];
      if (landing) {
        const checkpoint = landing.kind === 'rest' && landing.y > s.checkpoint;
        s = { ...s, y: landing.y, vy: landing.kind === 'spring' ? 735 : JUMP, last: landing.id, bounces: s.bounces + 1,
          checkpoint: checkpoint ? landing.y : s.checkpoint,
          status: landing.kind === 'finish' ? 'won' : checkpoint ? 'rest' : 'playing',
          message: landing.kind === 'spring' ? 'Срезаем путь!' : checkpoint ? 'Передышка. Арбуз тоже устал.' : landing.y >= 3200 ? 'Сосед: «Давай, дверь держу!»' : s.message };
      }
    }
    s.high = Math.max(s.high, s.y); s.camera = Math.max(s.camera, s.y - 255);
    if (s.invincible === 0 && s.status === 'playing') {
      const hit = hazards(s.time).find(o => o.active && Math.abs(s.x-o.x) < (o.kind === 'door' ? 38 : 24) && Math.abs(s.y+24-o.y) < 28);
      if (hit) s = { ...s, vx: s.x < hit.x ? -210 : 210, vy: Math.min(s.vy, 60), stun: 0.25, invincible: 1.4, message: hit.kind === 'cat' ? 'Кот: «Вообще-то это моя лестница». ' : hit.kind === 'bag' ? 'Кто оставил это на проходе?!' : 'Осторожно, дверь!' };
    }
    if (s.y < s.camera - 55) s = { ...s, status: 'fallen', falls: s.falls + 1, message: 'Поймал перила. Выдохни и попробуй ещё.' };
  }
  return s;
}
