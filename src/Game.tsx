import { useEffect, useRef } from 'react';
export default function Game({ level, onWin }: { level: number; onWin: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let game: import('phaser').Game | undefined;
    void import('phaser').then(({ default: Phaser }) => {
      if (disposed) return;
      class SignalScene extends Phaser.Scene {
        create() {
          let hits = 0;
          const total = 4 + level;
          this.add.text(180, 38, 'Собери сигналы', { fontFamily: 'sans-serif', fontSize: '25px', color: '#ffffff' }).setOrigin(0.5);
          const counter = this.add.text(180, 76, `0 / ${total}`, { fontSize: '18px', color: '#b2a7ed' }).setOrigin(0.5);
          const target = this.add.circle(180, 210, 30, 0xc8fa78).setInteractive({ useHandCursor: true });
          target.on('pointerdown', () => {
            hits++;
            counter.setText(`${hits} / ${total}`);
            if (hits === total) { target.disableInteractive(); onWin(); return; }
            target.setPosition(Phaser.Math.Between(45, 315), Phaser.Math.Between(130, 330));
          });
          this.add.text(180, 380, 'Нажимай на зелёный круг', { fontFamily: 'sans-serif', fontSize: '16px', color: '#c2bdd8' }).setOrigin(0.5);
        }
      }
      game = new Phaser.Game({ type: Phaser.AUTO, parent: host.current!, width: 360, height: 420, backgroundColor: '#202037', scene: SignalScene, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH } });
    });
    return () => { disposed = true; game?.destroy(true); };
  }, [level, onWin]);
  return <div className="game" ref={host} />;
}
