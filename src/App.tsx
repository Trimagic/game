import MainMenu from './MainMenu';
import { canOpenChapter, chapterScreen, completeChapter, type Chapter } from './chapters';
import { BikeBrief, BikeFacts } from './bike/BikeIntro';
import BikeComic from './bike/BikeComic';
import NightChapter from './night/NightChapter';
import DeliveryChapter from './delivery/DeliveryChapter';
import RemoteChapter from './remote/RemoteChapter';
import ScheduleGame from './schedule/ScheduleGame';
import { ScheduleBrief, ScheduleFacts } from './schedule/ScheduleIntro';
import ScheduleComic from './schedule/ScheduleComic';
import { useCallback, useEffect, useRef, useState } from 'react';
import Game from './Game';
import PoolGame from './pool/PoolGame';
import ShopGame from './shop/ShopGame';
import RunGame from './run/RunGame';
import { RunBrief, RunFacts } from './run/RunIntro';
import RunComic from './run/RunComic';
import SleepGame from './sleep/SleepGame';
import { SleepBrief, SleepFacts } from './sleep/SleepIntro';
import SleepComic from './sleep/SleepComic';
import GymGame from './gym/GymGame';
import { GymBrief, GymFacts } from './gym/GymIntro';
import GymComic from './gym/GymComic';
import CookGame from './cook/CookGame';
import { CookBrief, CookFacts } from './cook/CookIntro';
import CookComic from './cook/CookComic';
import { ShopBrief, ShopFacts } from './shop/ShopIntro';
import ShopComic from './shop/ShopComic';
import { PoolBrief, PoolFacts } from './pool/PoolIntro';
import PoolComic from './pool/PoolComic';
import { isTelegram, progress } from './telegram';

export default function App({initialChapter}:{initialChapter?:1|2|3|4|5|6|7|8|9|10|11}={}) {
  const [chapter, setChapter] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11>(initialChapter ?? 1);
  const [completed, setCompleted] = useState(0);
  const [screen, setScreen] = useState<'map' | 'comic' | 'brief' | 'facts' | 'game' | 'win'>(initialChapter ? initialChapter >= 9 ? 'game' : 'comic' : 'map');
  const [busy, setBusy] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { setCompleted(await progress()); setLoaded(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка загрузки'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [screen, chapter]);
  const saving = useRef(false);
  const win = () => { void save(); };
  function openChapter(id:Chapter) {
    if (busy || !loaded || !canOpenChapter(completed,id)) return;
    setError(''); setChapter(id); setScreen(chapterScreen(id));
  }
  const exit = useCallback(() => { setError(''); setScreen('map'); }, []);
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true); setError(''); setScreen('win');
    try {
      const result = await completeChapter(chapter, progress);
      setCompleted(result.completed);
      if (result.next) { setChapter(result.next); setScreen(chapterScreen(result.next)); }
      else setScreen('map');
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Ошибка сохранения'); }
    finally { saving.current = false; setBusy(false); }
  }
  return <main className={screen === 'game' ? 'playing-page' : ''}>
    <nav className="masthead"><button className="wordmark game-wordmark" onClick={exit}><span>ЕЩЁ ОДИН</span><strong>ГОДИК</strong></button><span>ИНТЕРАКТИВНЫЙ<br/>ИМЕНИННЫЙ КВЕСТ</span><span className="issue">ВЫПУСК {String(chapter).padStart(2, '0')}</span></nav>
    {error && <div role="alert" className="error">{error}{!loaded && <button onClick={() => void load()} disabled={busy}>Повторить</button>}</div>}
    {screen === 'map' && <MainMenu completed={completed} busy={busy || !loaded} isTelegram={isTelegram} onOpen={openChapter}/>}
    {screen === 'comic' && chapter === 1 && <BikeComic onContinue={() => setScreen('brief')} onExit={exit}/>}
    {screen === 'comic' && chapter === 2 && <PoolComic onContinue={() => setScreen('brief')} onExit={exit}/>}
    {screen === 'comic' && chapter === 3 && <ShopComic onContinue={() => setScreen('brief')} onExit={exit}/>}
    {screen === 'comic' && chapter === 4 && <CookComic onContinue={() => setScreen('brief')} onExit={exit}/>}
    {screen === 'comic' && chapter === 5 && <GymComic onContinue={() => setScreen('brief')} onExit={exit}/>}
    {screen === 'comic' && chapter === 6 && <SleepComic onContinue={() => setScreen('brief')} onExit={exit}/>}
    {screen === 'comic' && chapter === 7 && <RunComic onContinue={() => setScreen('brief')} onExit={exit}/>}
    {screen === 'comic' && chapter === 8 && <ScheduleComic onContinue={() => setScreen('brief')} onExit={exit}/>}
    {screen === 'brief' && chapter === 8 && <ScheduleBrief onContinue={() => setScreen('facts')} onComic={() => { setScreen('comic'); }}/> }
    {screen === 'brief' && chapter === 7 && <RunBrief onContinue={() => setScreen('facts')} onComic={() => { setScreen('comic'); }}/> }
    {screen === 'brief' && chapter === 6 && <SleepBrief onContinue={() => setScreen('facts')} onComic={() => { setScreen('comic'); }}/> }
    {screen === 'brief' && chapter === 5 && <GymBrief onContinue={() => setScreen('facts')} onComic={() => { setScreen('comic'); }}/> }
    {screen === 'brief' && chapter === 4 && <CookBrief onContinue={() => setScreen('facts')} onComic={() => { setScreen('comic'); }}/>}
    {screen === 'brief' && chapter === 3 && <ShopBrief onContinue={() => setScreen('facts')} onComic={() => { setScreen('comic'); }}/>}
    {screen === 'brief' && chapter === 2 && <PoolBrief onContinue={() => setScreen('facts')} onComic={() => { setScreen('comic'); }}/>}
    {screen === 'brief' && chapter === 1 && <BikeBrief onContinue={() => setScreen('facts')} onComic={() => { setScreen('comic'); }}/>}
    {screen === 'facts' && chapter === 8 && <ScheduleFacts onContinue={() => setScreen('game')} onBack={() => setScreen('brief')}/>}
    {screen === 'facts' && chapter === 7 && <RunFacts onContinue={() => setScreen('game')} onBack={() => setScreen('brief')}/>}
    {screen === 'facts' && chapter === 6 && <SleepFacts onContinue={() => setScreen('game')} onBack={() => setScreen('brief')}/>}
    {screen === 'facts' && chapter === 5 && <GymFacts onContinue={() => setScreen('game')} onBack={() => setScreen('brief')}/>}
    {screen === 'facts' && chapter === 4 && <CookFacts onContinue={() => setScreen('game')} onBack={() => setScreen('brief')}/>}
    {screen === 'facts' && chapter === 3 && <ShopFacts onContinue={() => setScreen('game')} onBack={() => setScreen('brief')}/>}
    {screen === 'facts' && chapter === 2 && <PoolFacts onContinue={() => setScreen('game')} onBack={() => setScreen('brief')}/>}
    {screen === 'facts' && chapter === 1 && <BikeFacts onContinue={() => setScreen('game')} onBack={() => setScreen('brief')}/>}
    {screen === 'game' && (chapter === 11 ? <NightChapter onComplete={() => void save()} onExit={exit} busy={busy}/> : chapter === 10 ? <DeliveryChapter onComplete={() => void save()} onExit={exit} busy={busy}/> : chapter === 9 ? <RemoteChapter onComplete={() => void save()} onExit={exit} busy={busy}/> : chapter === 8 ? <ScheduleGame onWin={win} onExit={exit}/> : chapter === 7 ? <RunGame onWin={win} onExit={exit}/> : chapter === 6 ? <SleepGame onWin={win} onExit={exit}/> : chapter === 5 ? <GymGame onWin={win} onExit={exit}/> : chapter === 4 ? <CookGame onWin={win} onExit={exit}/> : chapter === 3 ? <ShopGame onWin={win} onExit={exit}/> : chapter === 2 ? <PoolGame onWin={win} onExit={exit}/> : <Game onWin={win} onExit={exit}/>)}
    {screen === 'win' && <section className="chapter-transition" aria-live="polite"><span className="eyebrow">ГЛАВА {String(chapter).padStart(2,'0')}</span><h1>{busy?'Есть! Двигаемся дальше…':'Сохраним твою победу'}</h1><p>{busy?'Сохраняем результат и открываем следующую страницу.':'Не удалось сохранить результат. Повтори — проходить задание заново не нужно.'}</p>{!busy && <button onClick={()=>void save()}>Повторить сохранение →</button>}</section>}
    {screen !== 'game' && <footer><b className="wordmark game-wordmark"><span>ЕЩЁ ОДИН</span><strong>ГОДИК</strong></b><span>ПРОДОЛЖЕНИЕ СЛЕДУЕТ…</span></footer>}
  </main>;
}








