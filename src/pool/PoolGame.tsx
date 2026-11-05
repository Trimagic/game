import {SoundButton,useSound} from '../audio/useSound';
import {sound} from '../audio/sound';
import { useEffect, useRef, useState } from 'react';
import { saveBest } from '../best';
import { advancePool, BOSS_MS, createPoolState, phaseAt, phases, PLAYER_X, poolRating, PRE_BOSS_MS, ROUND_MS, SOAP_FOR_SHIELD } from './model';

type Status = 'loading' | 'playing' | 'paused' | 'lost' | 'won' | 'error';
type Result = { score: number; collected: number; spawned: number; lives: number; stars: number; best: number; record: boolean };
export default function PoolGame({ onWin, onExit }: { onWin: () => void; onExit: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<{ hold: (value: boolean) => void; pause: (value: boolean) => void } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  const [hud, setHud] = useState({ seconds: 0, lives: 3, boss: false, score: 0, charge: 0, shield: false });
  const [result, setResult] = useState<Result | null>(null);
  useSound('pool',status,hud.score,hud.lives);
  useEffect(() => {
    let disposed = false;
    let game: import('phaser').Game | undefined;
    setStatus('loading'); setHud({ seconds: 0, lives: 3, boss: false, score: 0, charge: 0, shield: false }); setResult(null);
    const clearHold = () => controls.current?.hold(false);
    const hide = () => {
      clearHold();
      if (document.hidden) { controls.current?.pause(true); setStatus(old => old === 'playing' ? 'paused' : old); }
    };
    window.addEventListener('blur', clearHold);
    document.addEventListener('visibilitychange', hide);
    void import('phaser').then(({ default: Phaser }) => {
      if (disposed) return;
      class PoolScene extends Phaser.Scene {
        private swimmer!: import('phaser').GameObjects.Image;
        private bubble!: import('phaser').GameObjects.Arc;
        private boss!: import('phaser').GameObjects.Image;
        private warning!: import('phaser').GameObjects.Text;
        private waveText!: import('phaser').GameObjects.Text;
        private foam: import('phaser').GameObjects.Arc[] = [];
        private images = new Map<number, import('phaser').GameObjects.Image>();
        private alerts = new Map<number, import('phaser').GameObjects.Text>();
        private soaps = new Map<number, import('phaser').GameObjects.Container>();
        private model = createPoolState();
        private held = false;
        private keyboard!: import('phaser').Types.Input.Keyboard.CursorKeys;
        private space!: import('phaser').Input.Keyboard.Key;
        private lastHud = 0;
        private lastWave = 0;
        private phase = 0;
        private scoreSeen = 0;
        private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        preload() {
          this.load.image('pool-cast', '/art/chapter-02-sprites.png');
          this.load.on('loaderror', () => { if (!disposed) setStatus('error'); });
        }
        create() {
          if (!this.textures.exists('pool-cast')) return;
          const texture = this.textures.get('pool-cast');
          const source = texture.getSourceImage() as HTMLImageElement;
          const regions = [[0, .12, .505, .80], [.495, .24, .163, .49], [.674, .06, .326, .87]];
          regions.forEach(([x,y,w,h], i) => texture.add(i, 0, Math.round(x * source.width), Math.round(y * source.height), Math.round(w * source.width), Math.round(h * source.height)));
          this.add.rectangle(180, 300, 360, 600, 0x087b83);
          this.add.rectangle(180, 310, 360, 500, 0x5fc7c9);
          for (let x = 0; x < 360; x += 30) {
            this.add.rectangle(x + 15, 28, 28, 26, 0xe1eee3).setStrokeStyle(1, 0x366d69);
            this.add.rectangle(x + 15, 579, 28, 26, 0xe1eee3).setStrokeStyle(1, 0x366d69);
          }
          for (const y of [75, 553]) for (let x = 8; x < 360; x += 18) this.add.circle(x, y, 6, x % 36 === 8 ? 0xffebc4 : 0xde7552).setStrokeStyle(1, 0x273e36);
          for (let i = 0; i < 22; i++) this.foam.push(this.add.circle(Phaser.Math.Between(0,360), Phaser.Math.Between(95,530), Phaser.Math.Between(2,5), 0xe1ffff, .5));
          this.add.text(14, 44, 'ДОРОЖКА № 2', { fontFamily:'sans-serif',fontSize:'10px',color:'#dcfff8' });
          this.swimmer = this.add.image(PLAYER_X, this.model.y, 'pool-cast', 0).setDepth(5);
          this.swimmer.setScale(116 / this.swimmer.width);
          this.bubble = this.add.circle(PLAYER_X, this.model.y, 50, 0xe1ffff, .28).setStrokeStyle(3, 0xffffff, .9).setDepth(6).setVisible(false);
          this.boss = this.add.image(410, 290, 'pool-cast', 2).setDepth(6);
          this.boss.setScale(110 / this.boss.width);
          this.warning = this.add.text(180, 200, 'БУЛЬК…\nКТО-ТО ПРИБЛИЖАЕТСЯ', { fontFamily:'sans-serif',fontSize:'18px',fontStyle:'bold',color:'#fff3cc',backgroundColor:'#663f70',align:'center',padding:{x:12,y:10} }).setOrigin(.5).setDepth(10).setVisible(false);
          this.waveText = this.add.text(180, 58, '', { fontFamily:'sans-serif',fontSize:'12px',fontStyle:'bold',color:'#ffe3ab' }).setOrigin(.5).setDepth(10);
          this.keyboard = this.input.keyboard!.createCursorKeys();
          this.space = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
          this.input.on('pointerdown', () => { this.held = true; });
          this.input.on('pointerup', () => { this.held = false; });
          this.input.on('pointerupoutside', () => { this.held = false; });
          this.input.on('gameout', () => { this.held = false; });
          controls.current = {
            hold: value => { this.held = value; },
            pause: value => {
              this.held = false; this.input.keyboard?.resetKeys();
              if (value) this.scene.pause(); else this.scene.resume();
            },
          };
          this.banner(phases[0].name, '#1d6f73');
          if (!disposed) setStatus('playing');
        }
        private float(text: string, x: number, y: number, color: string, size = 18) {
          const label = this.add.text(x, y, text, { fontFamily:'sans-serif',fontSize:`${size}px`,fontStyle:'bold',color,stroke:'#16393b',strokeThickness:4 }).setOrigin(.5).setDepth(11);
          this.tweens.add({ targets: label, y: y - 40, alpha: 0, duration: 700, onComplete: () => label.destroy() });
        }
        private banner(text: string, background: string) {
          const label = this.add.text(180, 150, text, { fontFamily:'sans-serif',fontSize:'22px',fontStyle:'bold',color:'#fff8e7',backgroundColor:background,padding:{x:14,y:8} }).setOrigin(.5).setDepth(12).setAngle(-3).setScale(.6);
          this.tweens.add({ targets: label, scale: 1, duration: 220, ease: 'Back.easeOut' });
          this.tweens.add({ targets: label, alpha: 0, y: 125, delay: 1300, duration: 500, onComplete: () => label.destroy() });
        }
        private makeSoap(x: number, y: number) {
          const bar = this.add.ellipse(0, 0, 40, 26, 0xf9c3d3).setStrokeStyle(2, 0x273e36);
          const shine = this.add.ellipse(-7, -5, 14, 6, 0xffffff, .8);
          const label = this.add.text(0, 3, 'мыло', { fontFamily:'sans-serif',fontSize:'9px',fontStyle:'bold',color:'#8a3c56' }).setOrigin(.5);
          const foam = [this.add.circle(14, -14, 5, 0xffffff, .85).setStrokeStyle(1, 0x7fc9c8), this.add.circle(22, -6, 3, 0xffffff, .85)];
          const soap = this.add.container(x, y, [bar, shine, label, ...foam]).setDepth(4);
          this.tweens.add({ targets: soap, angle: { from: -8, to: 8 }, yoyo: true, repeat: -1, duration: 500 });
          return soap;
        }
        private react() {
          const model = this.model;
          for (const event of model.events) {
            if (event === 'soap' && model.score > this.scoreSeen) this.float(`+${model.score - this.scoreSeen}`, PLAYER_X + 30, model.y - 35, '#ffd6e3');
            if (event === 'shield') { this.banner('Пенный щит!', '#2a8c96'); sound.cue('jump'); }
            if (event === 'block') {
              this.float('Щит лопнул!', 180, model.y - 50, '#e1ffff', 20); sound.cue('hit');
              const ring = this.add.circle(PLAYER_X, model.y, 50).setStrokeStyle(4, 0xffffff).setDepth(7);
              this.tweens.add({ targets: ring, scale: 1.9, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
            }
          }
          model.events.length = 0; this.scoreSeen = model.score;
        }
        private finish() {
          const model = this.model;
          const saved = saveBest('pool-best', model.score);
          setResult({ score: model.score, collected: model.collected, spawned: model.spawned, lives: model.lives, stars: poolRating(model), ...saved });
          setStatus('won');
        }
        update(_time: number, delta: number) {
          if (!this.swimmer || this.model.status !== 'playing') return;
          const previousLives = this.model.lives;
          const up = this.held || this.space.isDown || this.keyboard.up.isDown;
          advancePool(this.model, delta, up);
          const model = this.model;
          this.react();
          this.swimmer.y = model.y;
          this.swimmer.setAngle(up ? -9 : 7);
          this.swimmer.setAlpha(model.invincible > 0 ? .5 : 1);
          this.bubble.setPosition(PLAYER_X, model.y).setVisible(model.shield).setScale(1 + Math.sin(model.elapsed / 180) * .04);
          for (const bubble of this.foam) { bubble.x -= Math.min(delta,50) * .07; if (bubble.x < -10) bubble.x = 370; }
          const phase = phaseAt(model.elapsed);
          if (phase !== this.phase && model.elapsed < PRE_BOSS_MS) { this.phase = phase; this.banner(phases[phase].name, phase === 2 ? '#a4422d' : '#1d6f73'); }
          this.warning.setVisible(model.elapsed >= PRE_BOSS_MS && model.elapsed < BOSS_MS);
          if (model.elapsed >= BOSS_MS) {
            this.boss.x = Math.max(305, 410 - (model.elapsed - BOSS_MS) * .12);
            this.boss.y = 300 + Math.sin((model.elapsed - BOSS_MS) / 1200) * 175;
            this.waveText.setText(`КАКУН · ДО ВЫХОДА ${Math.ceil((ROUND_MS - model.elapsed) / 1000)} С`);
            if (this.lastWave !== model.wave) {
              this.lastWave = model.wave;
              this.tweens.add({ targets: this.boss, angle: 10, duration: 90, yoyo: true, repeat: 2 });
              const burp = this.add.text(this.boss.x - 35, this.boss.y - 30, 'БУЛЬК!', { fontFamily:'sans-serif',fontSize:'18px',fontStyle:'bold',color:'#633a24',backgroundColor:'#fff3cd',padding:{x:6,y:4} }).setOrigin(.5).setDepth(9);
              this.tweens.add({ targets: burp, alpha: 0, y: burp.y - 25, duration: 750, onComplete: () => burp.destroy() });
            }
          }
          const currentIds = new Set(model.hazards.map(h => h.id));
          for (const [id, sprite] of this.images) if (!currentIds.has(id)) { sprite.destroy(); this.images.delete(id); }
          for (const [id, alert] of this.alerts) if (!currentIds.has(id) || !model.hazards.find(h => h.id === id)!.warn) { alert.destroy(); this.alerts.delete(id); }
          for (const hazard of model.hazards) {
            let sprite = this.images.get(hazard.id);
            if (!sprite) {
              sprite = this.add.image(hazard.x, hazard.y, 'pool-cast', 1).setDepth(4);
              sprite.setScale((hazard.kind === 'wave' ? 52 : hazard.kind === 'dart' ? 34 : 39) / sprite.width);
              this.images.set(hazard.id, sprite);
              // Torpedoes flash a warning at the edge where they will launch.
              if (hazard.warn) {
                const alert = this.add.text(Math.min(hazard.x, 338) - 6, hazard.y, '!', { fontFamily:'sans-serif',fontSize:'34px',fontStyle:'bold',color:'#fff3cc',backgroundColor:'#a4422d',padding:{x:9,y:0} }).setOrigin(.5).setDepth(10);
                this.tweens.add({ targets: alert, alpha: .3, yoyo: true, repeat: -1, duration: 140 });
                this.alerts.set(hazard.id, alert);
              }
            }
            sprite.setPosition(hazard.x, hazard.y);
            if (hazard.kind === 'dart' && !hazard.warn) sprite.setAngle(sprite.angle - Math.min(delta, 50) * .6);
          }
          const soapIds = new Set(model.soaps.map(s => s.id));
          for (const [id, soap] of this.soaps) if (!soapIds.has(id)) { soap.destroy(); this.soaps.delete(id); }
          for (const s of model.soaps) {
            let soap = this.soaps.get(s.id);
            if (!soap) { soap = this.makeSoap(s.x, s.y); this.soaps.set(s.id, soap); }
            soap.setPosition(s.x, s.y);
          }
          if (model.lives < previousLives && !this.reducedMotion) this.cameras.main.shake(120, .006);
          if (model.elapsed - this.lastHud > 100 || model.status !== 'playing') {
            this.lastHud = model.elapsed;
            setHud({ seconds: Math.min(45, Math.floor(model.elapsed / 1000)), lives: model.lives, boss: model.elapsed >= BOSS_MS, score: model.score, charge: model.charge, shield: model.shield });
          }
          if (model.status === 'lost') setStatus('lost');
          if (model.status === 'won') this.finish();
        }
      }
      game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current!, width: 360, height: 600, backgroundColor: '#5fc7c9', scene: PoolScene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, input: { activePointers: 2 } });
    }).catch(() => { if (!disposed) setStatus('error'); });
    return () => {
      disposed = true; controls.current = null; game?.destroy(true);
      window.removeEventListener('blur', clearHold); document.removeEventListener('visibilitychange', hide);
    };
  }, [attempt]);
  function pause() {
    const value = status === 'playing'; controls.current?.pause(value); setStatus(value ? 'paused' : 'playing');
  }
  return <section className="ride pool-game"><SoundButton/>
    <div className="ride-top"><div><span className="eyebrow">ЭТАП 02</span><h2>{hud.boss ? 'Босс: Какун' : 'Заплыв с сюрпризом'}</h2></div><button className="small-button" disabled={!['playing','paused'].includes(status)} onClick={pause}>{status === 'paused' ? 'Продолжить' : 'Пауза'}</button></div>
    <div className="ride-hud"><b>{hud.seconds} <span>/ 45 с</span></b><span className="ride-score" aria-label={`Очки: ${hud.score}. ${hud.shield ? 'Щит активен' : `Мыло для щита: ${hud.charge} из ${SOAP_FOR_SHIELD}`}`}>★ {hud.score}<i>{hud.shield ? 'щит' : `${hud.charge}/${SOAP_FOR_SHIELD}`}</i></span><span aria-label={`Осталось попыток: ${hud.lives}`}>{'♥'.repeat(hud.lives)}{'♡'.repeat(3 - hud.lives)}</span></div>
    <progress className="distance-bar" value={hud.seconds} max={45} aria-label="Время заплыва" />
    <div className="game-wrap"><div className="game" ref={host} aria-label="Бассейн. Удерживай пробел или экран, чтобы плыть вверх; отпусти, чтобы опуститься." />
      {status === 'won' && result && <div className="game-overlay" role="status"><div>
        <span className="eyebrow">ВЫХОД ИЗ БАССЕЙНА · 45 С</span>
        <div className="ride-rating" aria-label={`Оценка: ${result.stars} из 3`}>{'★'.repeat(result.stars)}<span>{'★'.repeat(3 - result.stars)}</span></div>
        <h2>{result.score} очков</h2>
        <p>Мыла собрано: {result.collected} из {result.spawned}. За каждую оставшуюся жизнь: +50.<br/>{result.record ? 'Новый личный рекорд!' : `Рекорд: ${result.best}.`}</p>
        <button onClick={onWin}>Дальше →</button>
        <button className="text-button" onClick={() => setAttempt(n => n + 1)}>Ещё заплыв за рекорд</button>
      </div></div>}
      {status !== 'playing' && status !== 'won' && <div className="game-overlay" role="status"><div><span className="eyebrow">{hud.boss ? 'КАКУН НЕ ДРЕМЛЕТ' : 'АБОНЕМЕНТ БЕЗ ВОЗВРАТА'}</span><h2>{status === 'loading' ? 'Наполняем бассейн…' : status === 'paused' ? 'Перерыв на бортике' : status === 'lost' ? 'Заплыв не задался.' : 'Не удалось загрузить бассейн'}</h2><p>{status === 'lost' ? `Продержался ${hud.seconds} с. Собирай мыло: четыре куска дают пенный щит. Красный «!» у бортика — сейчас прилетит торпеда.` : status === 'paused' ? 'Всё замерло. Даже Какун.' : status === 'error' ? 'Проверь подключение и попробуй снова.' : 'Готовим пловца и его неприятности.'}</p>
      {status === 'paused' && <button onClick={pause}>Продолжить →</button>}
      {(status === 'lost' || status === 'error') && <button onClick={() => setAttempt(n => n + 1)}>Попробовать снова →</button>}
      <button className="text-button" onClick={onExit}>К истории</button></div></div>}
    </div>
    <div className="ride-controls"><button className="swim-hold" disabled={status !== 'playing'} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); controls.current?.hold(true); }} onPointerUp={() => controls.current?.hold(false)} onPointerCancel={() => controls.current?.hold(false)} onLostPointerCapture={() => controls.current?.hold(false)} onContextMenu={e => e.preventDefault()}>↑ Удерживай — плыви вверх</button></div>
    <p className="control-hint">Отпусти — вниз · Пробел / ↑ · 4 мыла = пенный щит</p>
    <button className="text-button" onClick={onExit}>Выйти из заплыва</button>
  </section>;
}
