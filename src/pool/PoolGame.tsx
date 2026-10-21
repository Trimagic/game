import { useEffect, useRef, useState } from 'react';
import { advancePool, BOSS_MS, createPoolState, PLAYER_X, ROUND_MS } from './model';

type Status = 'loading' | 'playing' | 'paused' | 'lost' | 'error';
export default function PoolGame({ onWin, onExit }: { onWin: () => void; onExit: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<{ hold: (value: boolean) => void; pause: (value: boolean) => void } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  const [hud, setHud] = useState({ seconds: 0, lives: 3, boss: false });
  useEffect(() => {
    let disposed = false;
    let game: import('phaser').Game | undefined;
    setStatus('loading'); setHud({ seconds: 0, lives: 3, boss: false });
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
        private boss!: import('phaser').GameObjects.Image;
        private warning!: import('phaser').GameObjects.Text;
        private waveText!: import('phaser').GameObjects.Text;
        private foam: import('phaser').GameObjects.Arc[] = [];
        private images = new Map<number, import('phaser').GameObjects.Image>();
        private model = createPoolState();
        private held = false;
        private keyboard!: import('phaser').Types.Input.Keyboard.CursorKeys;
        private space!: import('phaser').Input.Keyboard.Key;
        private lastHud = 0;
        private lastWave = 0;
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
          if (!disposed) setStatus('playing');
        }
        update(_time: number, delta: number) {
          if (!this.swimmer || this.model.status !== 'playing') return;
          const previousLives = this.model.lives;
          advancePool(this.model, delta, this.held || this.space.isDown || this.keyboard.up.isDown);
          const model = this.model;
          this.swimmer.y = model.y;
          this.swimmer.setAngle(this.held || this.space.isDown || this.keyboard.up.isDown ? -9 : 7);
          this.swimmer.setAlpha(model.invincible > 0 ? .5 : 1);
          for (const bubble of this.foam) { bubble.x -= Math.min(delta,50) * .07; if (bubble.x < -10) bubble.x = 370; }
          this.warning.setVisible(model.elapsed >= 27_000 && model.elapsed < BOSS_MS);
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
          for (const hazard of model.hazards) {
            let sprite = this.images.get(hazard.id);
            if (!sprite) {
              sprite = this.add.image(hazard.x, hazard.y, 'pool-cast', 1).setDepth(4);
              sprite.setScale((hazard.boss ? 52 : 39) / sprite.width);
              this.images.set(hazard.id, sprite);
            }
            sprite.setPosition(hazard.x, hazard.y);
          }
          if (model.lives < previousLives && !this.reducedMotion) this.cameras.main.shake(120, .006);
          if (model.elapsed - this.lastHud > 100 || model.status !== 'playing') {
            this.lastHud = model.elapsed;
            setHud({ seconds: Math.min(45, Math.floor(model.elapsed / 1000)), lives: model.lives, boss: model.elapsed >= BOSS_MS });
          }
          if (model.status === 'lost') setStatus('lost');
          if (model.status === 'won') onWin();
        }
      }
      game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current!, width: 360, height: 600, backgroundColor: '#5fc7c9', scene: PoolScene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, input: { activePointers: 2 } });
    }).catch(() => { if (!disposed) setStatus('error'); });
    return () => {
      disposed = true; controls.current = null; game?.destroy(true);
      window.removeEventListener('blur', clearHold); document.removeEventListener('visibilitychange', hide);
    };
  }, [attempt, onWin]);
  function pause() {
    const value = status === 'playing'; controls.current?.pause(value); setStatus(value ? 'paused' : 'playing');
  }
  return <section className="ride pool-game">
    <div className="ride-top"><div><span className="eyebrow">ЭТАП 02</span><h2>{hud.boss ? 'Босс: Какун' : 'Заплыв с сюрпризом'}</h2></div><button className="small-button" disabled={!['playing','paused'].includes(status)} onClick={pause}>{status === 'paused' ? 'Продолжить' : 'Пауза'}</button></div>
    <div className="ride-hud"><b>{hud.seconds} <span>/ 45 с</span></b><span aria-label={`Осталось попыток: ${hud.lives}`}>{'♥'.repeat(hud.lives)}{'♡'.repeat(3 - hud.lives)}</span></div>
    <progress className="distance-bar" value={hud.seconds} max={45} aria-label="Время заплыва" />
    <div className="game-wrap"><div className="game" ref={host} aria-label="Бассейн. Удерживай пробел или экран, чтобы плыть вверх; отпусти, чтобы опуститься." />
      {status !== 'playing' && <div className="game-overlay" role="status"><div><span className="eyebrow">{hud.boss ? 'КАКУН НЕ ДРЕМЛЕТ' : 'АБОНЕМЕНТ БЕЗ ВОЗВРАТА'}</span><h2>{status === 'loading' ? 'Наполняем бассейн…' : status === 'paused' ? 'Перерыв на бортике' : status === 'lost' ? 'Заплыв не задался.' : 'Не удалось загрузить бассейн'}</h2><p>{status === 'lost' ? 'Кажется, абонемент был с подвохом. Попробуй пройти по свободной воде.' : status === 'paused' ? 'Всё замерло. Даже Какун.' : status === 'error' ? 'Проверь подключение и попробуй снова.' : 'Готовим пловца и его неприятности.'}</p>
      {status === 'paused' && <button onClick={pause}>Продолжить →</button>}
      {(status === 'lost' || status === 'error') && <button onClick={() => setAttempt(n => n + 1)}>Попробовать снова →</button>}
      <button className="text-button" onClick={onExit}>К истории</button></div></div>}
    </div>
    <div className="ride-controls"><button className="swim-hold" disabled={status !== 'playing'} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); controls.current?.hold(true); }} onPointerUp={() => controls.current?.hold(false)} onPointerCancel={() => controls.current?.hold(false)} onLostPointerCapture={() => controls.current?.hold(false)} onContextMenu={e => e.preventDefault()}>↑ Удерживай — плыви вверх</button></div>
    <p className="control-hint">Отпусти — вниз · Пробел / ↑ на клавиатуре</p>
    <button className="text-button" onClick={onExit}>Выйти из заплыва</button>
  </section>;
}
