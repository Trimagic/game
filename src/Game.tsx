import {SoundButton,useSound} from './audio/useSound';
import {sound} from './audio/sound';
import { useEffect, useRef, useState } from 'react';
import { saveBest } from './best';
import { CLEAN_BONUS, course, DURATION, multiplier, phaseAt, phases, rating, speedAt, STAR_POINTS, type Spawn } from './bike/model';

type Result = { score: number; collected: number; total: number; stars: number; best: number; record: boolean; clean: boolean };
const laneX = (lane: number) => 84 + lane * 96;
const RIDER_Y = 470;

export default function Game({ onWin, onExit }: { onWin: () => void; onExit: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<{ move: (direction: number) => void; pause: (value: boolean) => void } | null>(null);
  const [round, setRound] = useState(0);
  const [state, setState] = useState<'loading' | 'playing' | 'paused' | 'lost' | 'won' | 'error'>('loading');
  const [hud, setHud] = useState({ distance: 0, lives: 3, score: 0, combo: 1 });
  const [result, setResult] = useState<Result | null>(null);
  useSound('bike',state,hud.score,hud.lives);
  useEffect(() => {
    let disposed = false;
    let game: import('phaser').Game | undefined;
    setState('loading'); setHud({ distance: 0, lives: 3, score: 0, combo: 1 }); setResult(null);
    void import('phaser').then(({ default: Phaser }) => {
      if (disposed) return;
      type Item = { spawn: Spawn; body: import('phaser').GameObjects.Image | import('phaser').GameObjects.Star | import('phaser').GameObjects.Text; arrow?: import('phaser').GameObjects.Text; dashed?: boolean };
      class BikeScene extends Phaser.Scene {
        private rider!: import('phaser').GameObjects.Image;
        private items: Item[] = [];
        private markings: import('phaser').GameObjects.Rectangle[] = [];
        private plan = course();
        private next = 0;
        private lane = 1;
        private elapsed = 0;
        private invincible = 0;
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
          this.rider = this.add.image(180, RIDER_Y, 'cast', 0).setDepth(5);
          this.rider.setScale(130 / this.rider.height);
          const move = (direction: number) => {
            if (this.done || this.scene.isPaused()) return;
            sound.cue('tap'); this.lane = Phaser.Math.Clamp(this.lane + direction, 0, 2);
            this.tweens.killTweensOf(this.rider);
            this.tweens.add({ targets: this.rider, x: laneX(this.lane), duration: 130, ease: 'Sine.easeOut' });
          };
          controls.current = { move, pause: value => value ? this.scene.pause() : this.scene.resume() };
          this.input.keyboard?.on('keydown-LEFT', (event: KeyboardEvent) => { event.preventDefault(); move(-1); });
          this.input.keyboard?.on('keydown-RIGHT', (event: KeyboardEvent) => { event.preventDefault(); move(1); });
          this.input.keyboard?.on('keydown-A', () => move(-1));
          this.input.keyboard?.on('keydown-D', () => move(1));
          // A swipe moves in its direction; a tap steers toward the tapped edge.
          this.input.on('pointerup', (pointer: import('phaser').Input.Pointer) => {
            const dx = pointer.x - pointer.downX;
            move(Math.abs(dx) > 28 ? Math.sign(dx) : pointer.x < 180 ? -1 : 1);
          });
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
        private spawn(s: Spawn) {
          const x = laneX(s.lane);
          if (s.kind === 'star') {
            const body = this.add.star(x, -40, 5, 7, 16, 0xf5cc5c).setStrokeStyle(2.5, 0x272c28).setDepth(4);
            this.items.push({ spawn: s, body });
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
        private remove(item: Item) {
          item.body.destroy(); item.arrow?.destroy();
          this.items = this.items.filter(other => other !== item);
        }
        private collect(item: Item) {
          if (item.spawn.kind === 'heart') {
            if (this.lives < 3) { this.lives++; this.float('+♥', item.body.x, item.body.y, '#ffb3a8', 26); }
            else { this.score += 50; this.float('+50', item.body.x, item.body.y, '#f5cc5c'); }
            this.cameras.main.flash(120, 255, 240, 220);
          } else {
            this.streak++; this.collected++;
            const combo = multiplier(this.streak);
            this.score += STAR_POINTS * combo;
            this.float(combo > 1 ? `+${STAR_POINTS * combo} ×${combo}` : `+${STAR_POINTS}`, item.body.x, item.body.y, '#f5cc5c', combo > 1 ? 22 : 18);
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
          setHud({ distance: 500, lives: this.lives, score: this.score, combo: multiplier(this.streak) });
          setResult({ score: this.score, collected: this.collected, total: this.total, stars: rating(this.collected, this.total, this.lives), clean, ...saved });
          setState('won');
        }
        update(_time: number, delta: number) {
          if (!this.rider || this.done) return;
          const dt = Math.min(delta, 50);
          this.elapsed += dt;
          this.invincible = Math.max(0, this.invincible - dt);
          this.rider.setAlpha(this.invincible > 0 ? (Math.floor(this.invincible / 120) % 2 ? .45 : 1) : 1);
          const speed = speedAt(this.elapsed);
          const step = speed * dt / 1000;
          for (const stripe of this.markings) { stripe.y += step; if (stripe.y > 650) stripe.y -= 720; }
          const phase = phaseAt(this.elapsed);
          if (phase !== this.phase) { this.phase = phase; this.banner(phases[phase].name, phase === 2 ? '#c4552d' : '#387c73'); }
          while (this.next < this.plan.length && this.plan[this.next].at <= this.elapsed) this.spawn(this.plan[this.next++]);
          // The finish banner is timed to cross the rider exactly at 500 m.
          if (!this.finish && this.elapsed >= DURATION - (RIDER_Y + 30) / speed * 1000) {
            const cells = Array.from({ length: 24 }, (_, i) => this.add.rectangle(-138 + (i % 12) * 23 + 11.5, (Math.floor(i / 12) - .5) * 14, 23, 14, (i + Math.floor(i / 12)) % 2 ? 0x272c28 : 0xfff6dc));
            this.finish = this.add.container(180, -30, cells).setDepth(2);
          }
          if (this.finish) this.finish.y += step;
          for (const item of [...this.items]) {
            const { body, spawn } = item;
            body.y += step;
            if (spawn.kind === 'star') body.angle += dt * .12;
            if (item.arrow) item.arrow.setPosition(body.x, body.y - 70);
            if (spawn.shift && !item.dashed && body.y > 110) {
              item.dashed = true;
              this.tweens.add({ targets: body, x: laneX(spawn.lane + spawn.shift), duration: 550, ease: 'Sine.easeInOut' });
              if (item.arrow) this.tweens.add({ targets: item.arrow, alpha: 0, duration: 450 });
            }
            const pickup = spawn.kind === 'star' || spawn.kind === 'heart';
            if (pickup && Math.abs(body.x - this.rider.x) < 40 && Math.abs(body.y - this.rider.y) < 46) { this.collect(item); continue; }
            if (!pickup && Math.abs(body.x - this.rider.x) < 42 && Math.abs(body.y - this.rider.y) < 44 && this.invincible === 0) {
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
          if (this.hudTimer > 100) { this.hudTimer = 0; setHud({ distance: Math.min(500, Math.floor(this.elapsed / 80)), lives: this.lives, score: this.score, combo: multiplier(this.streak) }); }
          if (this.elapsed >= DURATION) this.win();
        }
      }
      game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current!, width: 360, height: 600, backgroundColor: '#ede0bf', scene: BikeScene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, input: { activePointers: 2 }, render: { antialias: true } });
    }).catch(() => { if (!disposed) setState('error'); });
    return () => { disposed = true; controls.current = null; game?.destroy(true); };
  }, [round]);
  function pause() {
    const paused = state === 'playing';
    controls.current?.pause(paused);
    setState(paused ? 'paused' : 'playing');
  }
  return <section className="ride"><SoundButton/>
    <div className="ride-top"><div><span className="eyebrow">ЭТАП 01</span><h2>Первый заезд</h2></div><button className="small-button" disabled={!['playing', 'paused'].includes(state)} onClick={pause}>{state === 'paused' ? 'Продолжить' : 'Пауза'}</button></div>
    <div className="ride-hud"><b>{hud.distance} <span>/ 500 м</span></b><span className="ride-score" aria-label={`Очки: ${hud.score}`}>★ {hud.score}{hud.combo > 1 && <i>×{hud.combo}</i>}</span><span aria-label={`Осталось попыток: ${hud.lives}`}>{'♥'.repeat(hud.lives)}{'♡'.repeat(3 - hud.lives)}</span></div>
    <progress className="distance-bar" value={hud.distance} max={500} aria-label="Пройденная дистанция" />
    <div className="game-wrap"><div className="game" ref={host} aria-label="Велозаезд. Управляй стрелками влево и вправо, свайпом или кнопками под игрой." />
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
        <p>{state === 'lost' ? `Проехано ${hud.distance} м. На дорожке тесно: следи за стрелками над детьми — они сейчас свернут.` : state === 'paused' ? 'Заезд приостановлен. Продолжай, когда будешь готов.' : state === 'error' ? 'Проверь подключение и попробуй снова.' : 'Загружаем героя и парк.'}</p>
        {state === 'paused' && <button onClick={pause}>Продолжить →</button>}
        {(state === 'lost' || state === 'error') && <button onClick={() => setRound(value => value + 1)}>Попробовать снова →</button>}
        {state !== 'loading' && <button className="text-button" onClick={onExit}>К истории</button>}
      </div></div>}
    </div>
    <div className="ride-controls"><button aria-label="Повернуть влево" disabled={state !== 'playing'} onClick={() => controls.current?.move(-1)}>← <span>Влево</span></button><button aria-label="Повернуть вправо" disabled={state !== 'playing'} onClick={() => controls.current?.move(1)}><span>Вправо</span> →</button></div>
    <p className="control-hint">Стрелки ← → / A D · свайп или нажатие по краю дорожки · собирай звёзды подряд</p>
    <button className="text-button" onClick={onExit}>Выйти из заезда</button>
  </section>;
}
