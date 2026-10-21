import { useEffect, useRef, useState } from 'react';

export default function Game({ onWin, onExit }: { onWin: () => void; onExit: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<{ move: (direction: number) => void; pause: (value: boolean) => void } | null>(null);
  const [round, setRound] = useState(0);
  const [state, setState] = useState<'loading' | 'playing' | 'paused' | 'lost' | 'error'>('loading');
  const [hud, setHud] = useState({ distance: 0, lives: 3 });
  useEffect(() => {
    let disposed = false;
    let game: import('phaser').Game | undefined;
    setState('loading'); setHud({ distance: 0, lives: 3 });
    void import('phaser').then(({ default: Phaser }) => {
      if (disposed) return;
      class BikeScene extends Phaser.Scene {
        private rider!: import('phaser').GameObjects.Image;
        private obstacles: import('phaser').GameObjects.Image[] = [];
        private markings: import('phaser').GameObjects.Rectangle[] = [];
        private lane = 1;
        private elapsed = 0;
        private spawnTimer = 0;
        private invincible = 0;
        private lives = 3;
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
          this.rider = this.add.image(180, 470, 'cast', 0).setDepth(5);
          this.rider.setScale(130 / this.rider.height);
          const move = (direction: number) => {
            if (this.done || this.scene.isPaused()) return;
            this.lane = Phaser.Math.Clamp(this.lane + direction, 0, 2);
            this.tweens.killTweensOf(this.rider);
            this.tweens.add({ targets: this.rider, x: 84 + this.lane * 96, duration: 130, ease: 'Sine.easeOut' });
          };
          controls.current = { move, pause: value => value ? this.scene.pause() : this.scene.resume() };
          this.input.keyboard?.on('keydown-LEFT', (event: KeyboardEvent) => { event.preventDefault(); move(-1); });
          this.input.keyboard?.on('keydown-RIGHT', (event: KeyboardEvent) => { event.preventDefault(); move(1); });
          this.input.keyboard?.on('keydown-A', () => move(-1));
          this.input.keyboard?.on('keydown-D', () => move(1));
          this.input.on('pointerdown', (pointer: import('phaser').Input.Pointer) => move(pointer.x < 180 ? -1 : 1));
          if (!disposed) setState('playing');
        }
        update(_time: number, delta: number) {
          if (!this.rider || this.done) return;
          const dt = Math.min(delta, 50);
          this.elapsed += dt;
          this.invincible = Math.max(0, this.invincible - dt);
          this.rider.setAlpha(this.invincible > 0 ? (Math.floor(this.invincible / 120) % 2 ? .45 : 1) : 1);
          const speed = 185 + Math.min(55, this.elapsed / 800);
          for (const stripe of this.markings) { stripe.y += speed * dt / 1000; if (stripe.y > 650) stripe.y -= 720; }
          this.spawnTimer += dt;
          if (this.spawnTimer > 1250 && this.elapsed < 37000) {
            this.spawnTimer = 0;
            const type = Phaser.Math.Between(1, 3);
            const lane = Phaser.Math.Between(0, 2);
            const obstacle = this.add.image(84 + lane * 96, -70, 'cast', type).setDepth(3);
            obstacle.setScale((type === 3 ? 55 : 105) / obstacle.height);
            this.obstacles.push(obstacle);
          }
          for (const obstacle of [...this.obstacles]) {
            obstacle.y += speed * dt / 1000;
            if (Math.abs(obstacle.x - this.rider.x) < 42 && Math.abs(obstacle.y - this.rider.y) < 44 && this.invincible === 0) {
              this.lives--; this.invincible = 1400;
              this.cameras.main.shake(140, .007);
              const text = this.add.text(180, 320, 'Осторожнее!', { fontFamily: 'sans-serif', fontSize: '25px', color: '#fff8e7', backgroundColor: '#a4422d', padding: { x: 14, y: 8 } }).setOrigin(.5).setDepth(10);
              this.tweens.add({ targets: text, alpha: 0, y: 280, duration: 1000, onComplete: () => text.destroy() });
              obstacle.destroy(); this.obstacles = this.obstacles.filter(item => item !== obstacle);
              if (this.lives === 0) { this.done = true; setState('lost'); }
            } else if (obstacle.y > 690) { obstacle.destroy(); this.obstacles = this.obstacles.filter(item => item !== obstacle); }
          }
          this.hudTimer += dt;
          if (this.hudTimer > 100 || this.done) { this.hudTimer = 0; setHud({ distance: Math.min(500, Math.floor(this.elapsed / 80)), lives: this.lives }); }
          if (!this.done && this.elapsed >= 40000) { this.done = true; setHud({ distance: 500, lives: this.lives }); onWin(); }
        }
      }
      game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current!, width: 360, height: 600, backgroundColor: '#ede0bf', scene: BikeScene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, input: { activePointers: 2 }, render: { antialias: true } });
    }).catch(() => { if (!disposed) setState('error'); });
    return () => { disposed = true; controls.current = null; game?.destroy(true); };
  }, [onWin, round]);
  function pause() {
    const paused = state === 'playing';
    controls.current?.pause(paused);
    setState(paused ? 'paused' : 'playing');
  }
  return <section className="ride">
    <div className="ride-top"><div><span className="eyebrow">ЭТАП 01</span><h2>Первый заезд</h2></div><button className="small-button" disabled={!['playing', 'paused'].includes(state)} onClick={pause}>{state === 'paused' ? 'Продолжить' : 'Пауза'}</button></div>
    <div className="ride-hud"><b>{hud.distance} <span>/ 500 м</span></b><span aria-label={`Осталось попыток: ${hud.lives}`}>{'♥'.repeat(hud.lives)}{'♡'.repeat(3 - hud.lives)}</span></div>
    <progress className="distance-bar" value={hud.distance} max={500} aria-label="Пройденная дистанция" />
    <div className="game-wrap"><div className="game" ref={host} aria-label="Велозаезд. Управляй стрелками влево и вправо или кнопками под игрой." />
      {state !== 'playing' && <div className="game-overlay" role="status"><div>
        <span className="eyebrow">ПЕРВЫЙ ШАГ — УЖЕ ПОБЕДА</span>
        <h2>{state === 'loading' ? 'Готовим велосипед…' : state === 'paused' ? 'Передохнём?' : state === 'lost' ? 'Ещё один круг?' : 'Не удалось загрузить заезд'}</h2>
        <p>{state === 'lost' ? 'На дорожке тесно. Объезжай прохожих и кожуру — у тебя всё получится.' : state === 'paused' ? 'Заезд приостановлен. Продолжай, когда будешь готов.' : state === 'error' ? 'Проверь подключение и попробуй снова.' : 'Загружаем героя и парк.'}</p>
        {state === 'paused' && <button onClick={pause}>Продолжить →</button>}
        {(state === 'lost' || state === 'error') && <button onClick={() => setRound(value => value + 1)}>Попробовать снова →</button>}
        {state !== 'loading' && <button className="text-button" onClick={onExit}>К истории</button>}
      </div></div>}
    </div>
    <div className="ride-controls"><button aria-label="Повернуть влево" disabled={state !== 'playing'} onClick={() => controls.current?.move(-1)}>← <span>Влево</span></button><button aria-label="Повернуть вправо" disabled={state !== 'playing'} onClick={() => controls.current?.move(1)}><span>Вправо</span> →</button></div>
    <p className="control-hint">Стрелки ← → / A D · или нажимай по краям дорожки</p>
    <button className="text-button" onClick={onExit}>Выйти из заезда</button>
  </section>;
}
