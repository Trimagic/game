import { useCallback, useEffect, useState } from 'react';
import Game from './Game';
import { isTelegram, progress, telegram } from './telegram';
export default function App() {
  const [completed, setCompleted] = useState(0);
  const [level, setLevel] = useState(1);
  const [screen, setScreen] = useState<'map' | 'comic' | 'game' | 'win'>('map');
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { setCompleted(await progress()); setLoaded(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка загрузки'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { telegram?.ready(); telegram?.expand(); void load(); }, [load]);
  const win = useCallback(() => setScreen('win'), []);
  async function save() {
    setBusy(true); setError('');
    try { setCompleted(await progress(level)); setScreen('map'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка сохранения'); }
    finally { setBusy(false); }
  }
  return <main>
    <header><span className="eyebrow">ИНТЕРАКТИВНАЯ ИСТОРИЯ / ПРОТОТИП</span><h1>Между<br/><em>кадрами.</em></h1><p>Десять глав. Одна история, которую оживляешь ты.</p></header>
    <div className="status"><span>{isTelegram ? 'Telegram · облачный прогресс' : 'Демо · прогресс на этом устройстве'}</span><b>{completed} / 10</b></div>
    {error && <div role="alert" className="error">{error}{!loaded && <button onClick={() => void load()} disabled={busy}>Повторить</button>}</div>}
    {screen === 'map' && <section><h2>Твоя история</h2><p>Сейчас все главы используют тестовую мини-игру. Сюжет и механики добавим следующим этапом.</p><div className="levels">{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <button className={`level ${n <= completed ? 'done' : ''}`} key={n} disabled={busy || !loaded || n > completed + 1} onClick={() => { setLevel(n); setScreen('comic'); }}><small>ГЛАВА</small><strong>{String(n).padStart(2, '0')}</strong><span>{n <= completed ? 'Пройдена ✓' : n === completed + 1 ? 'Начать →' : 'Закрыта'}</span></button>)}</div></section>}
    {screen === 'comic' && <section className="panel"><span className="eyebrow">ГЛАВА {level} / ТЕСТОВЫЙ КОМИКС</span><div className="comic-art" aria-hidden="true">✦<span>…</span></div><h2>Сигнал из пустоты</h2><p>«Кто-то стёр краски из этого мира. Собери сигналы — и следующая страница проявится».</p><button onClick={() => setScreen('game')}>Войти в историю →</button><button className="secondary" onClick={() => setScreen('map')}>К главам</button></section>}
    {screen === 'game' && <section><Game level={level} onWin={win}/><button className="secondary" onClick={() => setScreen('map')}>Выйти без сохранения</button></section>}
    {screen === 'win' && <section className="panel"><span className="eyebrow">СИГНАЛ ВОССТАНОВЛЕН</span><h2>Глава {level} завершена!</h2><p>Сохрани результат, чтобы продолжить историю.</p><button disabled={busy} onClick={() => void save()}>{busy ? 'Сохраняем…' : 'Сохранить и продолжить →'}</button></section>}
    <footer>React + Phaser · Telegram Mini App</footer>
  </main>;
}
