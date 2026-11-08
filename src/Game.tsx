import {SoundButton,useSound} from './audio/useSound';
import {sound} from './audio/sound';
import { useEffect, useRef, useState } from 'react';
import { saveBest } from './best';
import { AIR_MS, BELLS, BOOST_MS, FAST, PEDESTRIANS, STARS_PER_BELL, clampLane, CLEAN_BONUS, course, DURATION, laneAt, laneX, multiplier, phaseAt, phases, rating, SLIP_MS, speedAt, STAR_POINTS, type Spawn } from './bike/model';

type Result = { score: number; collected: number; total: number; stars: number; best: number; record: boolean; clean: boolean };
const RIDER_Y = 470;
// Forgiving on purpose: a near miss counts as a miss, and a star just beside you is still yours.
const HIT_REACH = 36;
const PICKUP_REACH = 48;

export default function Game({ onWin, onExit }: { onWin: () => void; onExit: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<{ move: (direction: number) => void; ring: () => void; pause: (value: boolean) => void } | null>(null);
  const [round, setRound] = useState(0);
  const [state, setState] = useState<'loading' | 'playing' | 'paused' | 'lost' | 'won' | 'error'>('loading');
  const [hud, setHud] = useState({ distance: 0, lives: 3, score: 0, combo: 1, bell: BELLS });
  const [result, setResult] = useState<Result | null>(null);
  useSound('bike',state,hud.score,hud.lives);
  useEffect(() => {
    let disposed = false;
    let game: import('phaser').Game | undefined;
    setState('loading'); setHud({ distance: 0, lives: 3, score: 0, combo: 1, bell: BELLS }); setResult(null);
    void import('phaser').then(({ default: Phaser }) => {
      if (disposed) return;
      type Item = { spawn: Spawn; body: import('phaser').GameObjects.Image | import('phaser').GameObjects.Star | import('phaser').GameObjects.Text | import('phaser').GameObjects.Container; arrow?: import('phaser').GameObjects.Text; dashed?: boolean; used?: boolean; fast?: number; cleared?: boolean };
      class BikeScene extends Phaser.Scene {
        private rider!: import('phaser').GameObjects.Image;
        private items: Item[] = [];
        private markings: import('phaser').GameObjects.Rectangle[] = [];
        private plan = course();
        private next = 0;
        private lane = 1;
        private elapsed = 0;
        private invincible = 0;
        private air = 0;
        private slip = 0;
        private boost = 0;
        private bell = BELLS;
        private bellStars = 0;
        private later: { spawn: Spawn; at: number; warn: import('phaser').GameObjects.Text }[] = [];
        private shadow!: import('phaser').GameObjects.Ellipse;
        private lives = 3;
        private score = 0;
        private streak = 0;
        private collected = 0;
        private total = this.plan.filter(s => s.kind === 'star').length;
        private phase = 0;
        private finish?: import('phaser').GameObjects.Container;
        private done = false;
        private hudTimer = 0;
        preload() {
          this.load.image('cast', '/art/chapter-01-sprites.png');
          this.load.on('loaderror', () => { if (!disposed) setState('error'); });
        }
        create() {
          if (!this.textures.exists('cast')) return;
          const texture = this.textures.get('cast');
          const source = texture.getSourceImage() as HTMLImageElement;
          // Atlas regions follow the actual generated silhouettes, not uniform cells.
          const regions = [[.12, 0, .34, .60], [.58, .03, .30, .55], [.14, .60, .23, .38], [.52, .64, .41, .31]];
          regions.forEach(([x,y,w,h], i) => texture.add(i, 0, Math.round(x * source.width), Math.round(y * source.height), Math.round(w * source.width), Math.round(h * source.height)));
          this.add.rectangle(180, 300, 360, 600, 0x94b788);
          this.add.rectangle(180, 300, 294, 600, 0xede0bf).setStrokeStyle(4, 0x272c28);
          this.add.rectangle(180, 300, 276, 600, 0xd7c8a6);
          for (let y = -50; y < 650; y += 90) for (const x of [132, 228]) this.markings.push(this.add.rectangle(x, y, 3, 35, 0xfff6dc));
          for (let y = 30; y < 600; y += 125) for (const x of [9, 351]) {
            this.add.circle(x, y, 21, 0x527b59).setStrokeStyle(2, 0x34533b);
            this.add.circle(x - 5, y - 7, 9, 0x7d9c67);
          }
          this.shadow = this.add.ellipse(180, RIDER_Y + 50, 60, 16, 0x272c28, .25).setDepth(4).setVisible(false);
          this.rider = this.add.image(180, RIDER_Y, 'cast', 0).setDepth(5);
          this.rider.setScale(130 / this.rider.height);
          // Changing lane is quick and the bike leans into it, so a press is felt at once.
          const steer = (lane: number) => {
            const next = clampLane(lane);
            if (this.done || this.scene.isPaused() || next === this.lane || this.slip > 0) return false;
            const lean = next > this.lane ? 1 : -1;
            this.lane = next;
            sound.fx('whoosh');
            this.tweens.killTweensOf(this.rider);
            this.rider.setAngle(lean * 13);
            this.tweens.add({ targets: this.rider, x: laneX(next), duration: 90, ease: 'Sine.easeOut' });
            this.tweens.add({ targets: this.rider, angle: 0, delay: 70, duration: 130, ease: 'Sine.easeOut' });
            return true;
          };
          // Pushing against the edge of the path gives a small nudge instead of doing nothing.
          const move = (direction: number) => {
            if (steer(this.lane + direction) || this.done || this.scene.isPaused()) return;
            this.tweens.killTweensOf(this.rider);
            this.rider.setX(laneX(this.lane));
            this.tweens.add({ targets: this.rider, x: laneX(this.lane) + direction * 9, duration: 55, yoyo: true, ease: 'Sine.easeOut' });
          };
          controls.current = { move, ring: () => this.ring(), pause: value => value ? this.scene.pause() : this.scene.resume() };
          for (const key of ['SPACE', 'UP', 'W']) this.input.keyboard?.on(`keydown-${key}`, (event: KeyboardEvent) => { event.preventDefault(); this.ring(); });
          this.input.keyboard?.on('keydown-LEFT', (event: KeyboardEvent) => { event.preventDefault(); move(-1); });
          this.input.keyboard?.on('keydown-RIGHT', (event: KeyboardEvent) => { event.preventDefault(); move(1); });
          this.input.keyboard?.on('keydown-A', () => move(-1));
          this.input.keyboard?.on('keydown-D', () => move(1));
          // The road is the control: touch a lane to go there at once, or keep the finger down and drag.
          this.input.on('pointerdown', (pointer: import('phaser').Input.Pointer) => { steer(laneAt(pointer.x)); });
          this.input.on('pointermove', (pointer: import('phaser').Input.Pointer) => { if (pointer.isDown) steer(laneAt(pointer.x)); });
          this.banner(phases[0].name, '#387c73');
          if (!disposed) setState('playing');
        }
        private float(text: string, x: number, y: number, color: string, size = 20) {
          const label = this.add.text(x, y, text, { fontFamily: 'sans-serif', fontSize: `${size}px`, fontStyle: 'bold', color, stroke: '#272c28', strokeThickness: 4 }).setOrigin(.5).setDepth(11);
          this.tweens.add({ targets: label, y: y - 45, alpha: 0, duration: 750, onComplete: () => label.destroy() });
        }
        private banner(text: string, background: string) {
          const label = this.add.text(180, 230, text, { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#fff8e7', backgroundColor: background, padding: { x: 16, y: 9 } }).setOrigin(.5).setDepth(12).setAngle(-4).setScale(.6);
          this.tweens.add({ targets: label, scale: 1, duration: 220, ease: 'Back.easeOut' });
          this.tweens.add({ targets: label, alpha: 0, y: 200, delay: 1300, duration: 500, onComplete: () => label.destroy() });
        }
        /** The bell: pedestrians ahead in your lane step off the path. */
        private ring() {
          if (this.done || this.scene.isPaused() || this.bell <= 0) return;
          this.bell--; sound.fx('ring');
          const ahead = this.items.filter(i => PEDESTRIANS.includes(i.spawn.kind) && !i.cleared && Math.abs(i.body.x - this.rider.x) < 50 && i.body.y > RIDER_Y - 340 && i.body.y < RIDER_Y - 30);
          for (const item of ahead) {
            item.cleared = true; item.dashed = true; item.arrow?.destroy(); item.arrow = undefined;
            this.tweens.killTweensOf(item.body);
            this.tweens.add({ targets: item.body, x: item.body.x < 180 ? 18 : 342, alpha: .45, duration: 260, ease: 'Sine.easeOut' });
            this.score += 5;
          }
          this.float(ahead.length ? 'ПОСТОРОНИСЬ!' : 'ДЗЫНЬ!', this.rider.x, RIDER_Y - 90, '#fff8e7', ahead.length ? 20 : 16);
        }
        private spawn(s: Spawn) {
          const x = laneX(s.lane);
          // An oncoming cyclist waits a moment so that, at double speed, he still arrives on time; his lane flashes a warning.
          if (s.kind === 'cyclist') {
            const travel = (RIDER_Y + 70) / speedAt(this.elapsed) * 1000;
            const warn = this.add.text(x, 70, '!', { fontFamily: 'sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#c4552d', stroke: '#fff8e7', strokeThickness: 6 }).setOrigin(.5).setDepth(8);
            this.later.push({ spawn: s, at: this.elapsed + travel * (1 - 1 / FAST), warn }); sound.fx('warn');
            return;
          }
          if (s.kind === 'star') {
            const body = this.add.star(x, -40, 5, 7, 16, 0xf5cc5c).setStrokeStyle(2.5, 0x272c28).setDepth(4);
            this.items.push({ spawn: s, body });
          } else if (s.kind === 'ramp' || s.kind === 'puddle' || s.kind === 'boost' || s.kind === 'hurdle') {
            this.items.push({ spawn: s, body: this.road(s.kind, x) });
          } else if (s.kind === 'heart') {
            const body = this.add.text(x, -40, '♥', { fontFamily: 'sans-serif', fontSize: '40px', color: '#d9473a', stroke: '#272c28', strokeThickness: 4 }).setOrigin(.5).setDepth(4);
            this.tweens.add({ targets: body, scale: 1.18, yoyo: true, repeat: -1, duration: 300 });
            this.items.push({ spawn: s, body });
          } else {
            const frame = s.kind === 'granny' ? 1 : s.kind === 'kid' ? 2 : 3;
            const body = this.add.image(x, -70, 'cast', frame).setDepth(3);
            body.setScale((frame === 3 ? 55 : 105) / body.height);
            // Kids about to swerve get a warning arrow so the dash is readable.
            const arrow = s.shift ? this.add.text(x, -130, s.shift > 0 ? '→' : '←', { fontFamily: 'sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#c4552d', stroke: '#fff8e7', strokeThickness: 5 }).setOrigin(.5).setDepth(6) : undefined;
            this.items.push({ spawn: s, body, arrow });
          }
        }
        /** Road furniture drawn from shapes: a ramp, a striped hurdle, a puddle and turbo chevrons. */
        private road(kind: Spawn['kind'], x: number) {
          const g = this.add.graphics();
          if (kind === 'ramp') { g.fillStyle(0xb98a52); g.fillTriangle(-34, 22, 34, 22, 0, -26); g.fillStyle(0xd9a866); g.fillRect(-34, 16, 68, 8); g.lineStyle(3, 0x272c28); g.strokeTriangle(-34, 22, 34, 22, 0, -26); g.lineStyle(4, 0xfff8e7); g.lineBetween(-10, 6, 0, -8); g.lineBetween(0, -8, 10, 6); }
          else if (kind === 'hurdle') { g.fillStyle(0xfff8e7); g.fillRect(-38, -10, 76, 18); g.fillStyle(0xc4552d); for (let i = -38; i < 38; i += 19) g.fillRect(i, -10, 10, 18); g.lineStyle(3, 0x272c28); g.strokeRect(-38, -10, 76, 18); g.lineBetween(-30, 8, -30, 24); g.lineBetween(30, 8, 30, 24); }
          else if (kind === 'puddle') { g.fillStyle(0x6fb6c9, .85); g.fillEllipse(0, 0, 70, 30); g.fillStyle(0xd8f0f5, .9); g.fillEllipse(-12, -5, 22, 7); g.lineStyle(2, 0x3f7f92); g.strokeEllipse(0, 0, 70, 30); }
          else { g.fillStyle(0xf5cc5c, .35); g.fillRoundedRect(-34, -40, 68, 80, 10); g.lineStyle(6, 0xf0a63d); for (const y of [-22, 0, 22]) { g.lineBetween(-18, y + 12, 0, y - 6); g.lineBetween(0, y - 6, 18, y + 12); } }
          return this.add.container(x, -40, [g]).setDepth(kind === 'hurdle' ? 3 : 2);
        }
        private remove(item: Item) {
          item.body.destroy(); item.arrow?.destroy();
          this.items = this.items.filter(other => other !== item);
        }
        private collect(item: Item) {
          if (item.spawn.kind === 'heart') {
            if (this.lives < 3) { this.lives++; sound.fx('pickup'); this.float('+♥', item.body.x, item.body.y, '#ffb3a8', 26); }
            else { this.score += 50; this.float('+50', item.body.x, item.body.y, '#f5cc5c'); }
            this.cameras.main.flash(120, 255, 240, 220);
          } else {
            this.streak++; this.collected++;
            if (++this.bellStars >= STARS_PER_BELL) { this.bellStars = 0; if (this.bell < BELLS) { this.bell++; this.float('+ЗВОНОК', this.rider.x, RIDER_Y - 110, '#fff8e7', 15); } }
            const combo = multiplier(this.streak) * (this.boost > 0 ? 2 : 1);
            this.score += STAR_POINTS * combo;
            this.float(combo > 1 ? `+${STAR_POINTS * combo} ×${combo}` : `+${STAR_POINTS}`, item.body.x, item.body.y, this.boost > 0 ? '#ffb347' : '#f5cc5c', combo > 1 ? 22 : 18);
            if (this.streak % 4 === 0) {
              const ring = this.add.circle(this.rider.x, this.rider.y, 30).setStrokeStyle(4, 0xf5cc5c).setDepth(6);
              this.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
            }
          }
          this.remove(item);
        }
        private win() {
          this.done = true;
          const clean = this.lives === 3;
          if (clean) this.score += CLEAN_BONUS;
          const saved = saveBest('bike-best', this.score);
          setHud({ distance: 500, lives: this.lives, score: this.score, combo: multiplier(this.streak), bell: this.bell });
          setResult({ score: this.score, collected: this.collected, total: this.total, stars: rating(this.collected, this.total, this.lives), clean, ...saved });
          setState('won');
        }
        update(_time: number, delta: number) {
          if (!this.rider || this.done) return;
          const dt = Math.min(delta, 50);
          this.elapsed += dt;
          this.invincible = Math.max(0, this.invincible - dt);
          const wasAir = this.air > 0;
          this.air = Math.max(0, this.air - dt); this.slip = Math.max(0, this.slip - dt); this.boost = Math.max(0, this.boost - dt);
          // In the air the bike is bigger and casts a shadow; it lands with a thud.
          const lift = this.air > 0 ? Math.sin(Math.PI * (1 - this.air / AIR_MS)) : 0;
          this.rider.setScale(130 / this.rider.height * (1 + lift * .28)); this.shadow.setVisible(this.air > 0).setPosition(this.rider.x, RIDER_Y + 52).setScale(1 - lift * .3);
          if (wasAir && this.air === 0) { sound.fx('land'); this.cameras.main.shake(70, .004); }
          if (this.slip > 0) this.rider.setX(laneX(this.lane) + Math.sin(this.elapsed / 30) * 4);
          this.rider.setAlpha(this.invincible > 0 ? (Math.floor(this.invincible / 120) % 2 ? .45 : 1) : 1);
          const speed = speedAt(this.elapsed);
          const step = speed * dt / 1000;
          for (const stripe of this.markings) { stripe.y += step; if (stripe.y > 650) stripe.y -= 720; }
          const phase = phaseAt(this.elapsed);
          if (phase !== this.phase) { this.phase = phase; sound.fx('ding'); this.banner(phases[phase].name, phase === 2 ? '#c4552d' : '#387c73'); }
          while (this.next < this.plan.length && this.plan[this.next].at <= this.elapsed) this.spawn(this.plan[this.next++]);
          for (const wait of [...this.later]) {
            wait.warn.setAlpha(Math.floor(this.elapsed / 120) % 2 ? .35 : 1);
            if (this.elapsed < wait.at) continue;
            wait.warn.destroy(); this.later = this.later.filter(w => w !== wait);
            const body = this.add.image(laneX(wait.spawn.lane), -70, 'cast', 0).setDepth(3).setAngle(180).setTint(0x9fc8ff);
            body.setScale(110 / body.height);
            this.items.push({ spawn: wait.spawn, body, fast: FAST });
          }
          // The finish banner is timed to cross the rider exactly at 500 m.
          if (!this.finish && this.elapsed >= DURATION - (RIDER_Y + 30) / speed * 1000) {
            const cells = Array.from({ length: 24 }, (_, i) => this.add.rectangle(-138 + (i % 12) * 23 + 11.5, (Math.floor(i / 12) - .5) * 14, 23, 14, (i + Math.floor(i / 12)) % 2 ? 0x272c28 : 0xfff6dc));
            this.finish = this.add.container(180, -30, cells).setDepth(2);
          }
          if (this.finish) this.finish.y += step;
          for (const item of [...this.items]) {
            const { body, spawn } = item;
            body.y += step * (item.fast ?? 1);
            if (spawn.kind === 'star') body.angle += dt * .12;
            if (item.arrow) item.arrow.setPosition(body.x, body.y - 70);
            if (spawn.shift && !item.dashed && body.y > 110) {
              item.dashed = true;
              this.tweens.add({ targets: body, x: laneX(spawn.lane + spawn.shift), duration: 550, ease: 'Sine.easeInOut' });
              if (item.arrow) this.tweens.add({ targets: item.arrow, alpha: 0, duration: 450 });
            }
            const near = Math.abs(body.x - this.rider.x) < 40 && Math.abs(body.y - this.rider.y) < 40;
            if (spawn.kind === 'ramp' || spawn.kind === 'puddle' || spawn.kind === 'boost') {
              if (near && !item.used && this.air === 0) {
                item.used = true;
                if (spawn.kind === 'ramp') { this.air = AIR_MS; sound.fx('boing'); this.float('ПРЫЖОК!', this.rider.x, RIDER_Y - 80, '#fff8e7', 18); }
                else if (spawn.kind === 'puddle') { this.slip = SLIP_MS; sound.fx('splash'); this.float('СКОЛЬЗКО!', this.rider.x, RIDER_Y - 80, '#cfeaf2', 16); }
                else { this.boost = BOOST_MS; sound.fx('powerup'); this.float('ТУРБО ×2', this.rider.x, RIDER_Y - 80, '#ffb347', 22); this.remove(item); continue; }
              }
              if (body.y > 690) this.remove(item);
              continue;
            }
            const pickup = spawn.kind === 'star' || spawn.kind === 'heart';
            if (pickup && Math.abs(body.x - this.rider.x) < PICKUP_REACH && Math.abs(body.y - this.rider.y) < 50) { this.collect(item); continue; }
            if (!pickup && !item.cleared && this.air === 0 && Math.abs(body.x - this.rider.x) < HIT_REACH && Math.abs(body.y - this.rider.y) < 40 && this.invincible === 0) {
              this.lives--; this.invincible = 1400; this.streak = 0;
              this.cameras.main.shake(140, .007);
              const text = this.add.text(180, 320, 'Осторожнее!', { fontFamily: 'sans-serif', fontSize: '25px', color: '#fff8e7', backgroundColor: '#a4422d', padding: { x: 14, y: 8 } }).setOrigin(.5).setDepth(10);
              this.tweens.add({ targets: text, alpha: 0, y: 280, duration: 1000, onComplete: () => text.destroy() });
              this.remove(item);
              if (this.lives === 0) { this.done = true; setHud(hud => ({ ...hud, lives: 0, combo: 1 })); setState('lost'); return; }
              continue;
            }
            if (body.y > RIDER_Y + 50 && spawn.kind === 'star' && this.streak > 0) { this.streak = 0; this.float('серия сброшена', 180, RIDER_Y + 70, '#fff8e7', 14); }
            if (body.y > RIDER_Y + 50 && pickup) this.remove(item);
            else if (body.y > 690) this.remove(item);
          }
          this.hudTimer += dt;
          if (this.hudTimer > 100) { this.hudTimer = 0; setHud({ distance: Math.min(500, Math.floor(this.elapsed / 80)), lives: this.lives, score: this.score, combo: multiplier(this.streak), bell: this.bell }); }
          if (this.elapsed >= DURATION) this.win();
        }
      }
      game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current!, width: 360, height: 600, backgroundColor: '#ede0bf', scene: BikeScene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, input: { activePointers: 2 }, render: { antialias: true } });
    }).catch(() => { if (!disposed) setState('error'); });
    return () => { disposed = true; controls.current = null; game?.destroy(true); };
  }, [round]);
  // Buttons act the moment they are touched, not when the finger lifts. A keyboard click has detail 0.
  const steerButton = (direction: number) => ({
    onPointerDown: (event: React.PointerEvent) => { event.preventDefault(); controls.current?.move(direction); },
    onClick: (event: React.MouseEvent) => { if (event.detail === 0) controls.current?.move(direction); },
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
  });
  function pause() {
    const paused = state === 'playing';
    controls.current?.pause(paused);
    setState(paused ? 'paused' : 'playing');
  }
  return <section className="ride"><SoundButton/>
    <div className="ride-top"><div><span className="eyebrow">ЭТАП 01</span><h2>Первый заезд</h2></div><button className="small-button" disabled={!['playing', 'paused'].includes(state)} onClick={pause}>{state === 'paused' ? 'Продолжить' : 'Пауза'}</button></div>
    <div className="ride-hud"><b>{hud.distance} <span>/ 500 м</span></b><span className="ride-score" aria-label={`Очки: ${hud.score}`}>★ {hud.score}{hud.combo > 1 && <i>×{hud.combo}</i>}</span><span aria-label={`Осталось попыток: ${hud.lives}`}>{'♥'.repeat(hud.lives)}{'♡'.repeat(3 - hud.lives)}</span></div>
    <progress className="distance-bar" value={hud.distance} max={500} aria-label="Пройденная дистанция" />
    <div className="game-wrap"><div className="game" ref={host} aria-label="Велозаезд. Коснись полосы или веди по дороге пальцем, управляй стрелками или кнопками под игрой." />
      {state === 'won' && result && <div className="game-overlay" role="status"><div>
        <span className="eyebrow">ФИНИШ · 500 М</span>
        <div className="ride-rating" aria-label={`Оценка: ${result.stars} из 3`}>{'★'.repeat(result.stars)}<span>{'★'.repeat(3 - result.stars)}</span></div>
        <h2>{result.score} очков</h2>
        <p>Звёзд собрано: {result.collected} из {result.total}.{result.clean && ` Без единого ушиба: +${CLEAN_BONUS}.`}<br/>{result.record ? 'Новый личный рекорд!' : `Рекорд: ${result.best}.`}</p>
        <button onClick={onWin}>Дальше →</button>
        <button className="text-button" onClick={() => setRound(value => value + 1)}>Ещё заезд за рекорд</button>
      </div></div>}
      {state !== 'playing' && state !== 'won' && <div className="game-overlay" role="status"><div>
        <span className="eyebrow">ПЕРВЫЙ ШАГ — УЖЕ ПОБЕДА</span>
        <h2>{state === 'loading' ? 'Готовим велосипед…' : state === 'paused' ? 'Передохнём?' : state === 'lost' ? 'Ещё один круг?' : 'Не удалось загрузить заезд'}</h2>
        <p>{state === 'lost' ? `Проехано ${hud.distance} м. Следи за стрелками над детьми — они сейчас свернут. Полосатый барьер перепрыгивают только с трамплина, в луже руль не слушается, а турбо удваивает звёзды. «!» вверху — сейчас примчится встречный велосипедист. Звонок убирает пешеходов с твоей полосы.` : state === 'paused' ? 'Заезд приостановлен. Продолжай, когда будешь готов.' : state === 'error' ? 'Проверь подключение и попробуй снова.' : 'Загружаем героя и парк.'}</p>
        {state === 'paused' && <button onClick={pause}>Продолжить →</button>}
        {(state === 'lost' || state === 'error') && <button onClick={() => setRound(value => value + 1)}>Попробовать снова →</button>}
        {state !== 'loading' && <button className="text-button" onClick={onExit}>К истории</button>}
      </div></div>}
    </div>
    <div className="ride-controls"><button aria-label="Повернуть влево" disabled={state !== 'playing'} {...steerButton(-1)}>← <span>Влево</span></button><button className="ride-bell" aria-label={`Звонок, осталось ${hud.bell}`} disabled={state !== 'playing' || hud.bell === 0} onPointerDown={event => { event.preventDefault(); controls.current?.ring(); }} onClick={event => { if (event.detail === 0) controls.current?.ring(); }} onContextMenu={event => event.preventDefault()}>🔔<span>{hud.bell}</span></button><button aria-label="Повернуть вправо" disabled={state !== 'playing'} {...steerButton(1)}><span>Вправо</span> →</button></div>
    <p className="control-hint">Коснись полосы или веди пальцем по дороге · кнопки или ← → / A D · звонок — пробел · собирай звёзды подряд</p>
    <button className="text-button" onClick={onExit}>Выйти из заезда</button>
  </section>;
}
