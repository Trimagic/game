import { BELLS, DURATION } from './model';
import './bike-intro.css';

type BriefProps = { onContinue: () => void; onComic: () => void };

export function BikeBrief({ onContinue, onComic }: BriefProps) {
  return <section className="paper-panel bike-intro" aria-labelledby="bike-brief-title">
    <header className="bike-intro-heading"><span className="eyebrow">01 / КРУТИ ПЕДАЛИ</span><span className="bike-intro-step">Как играть · 1/2</span></header>
    <h1 id="bike-brief-title">Первый круг.<br/><em>Поехали?</em></h1>
    <p className="bike-intro-lead">Доберись до финиша и собери побольше звёзд.</p>
    <dl className="bike-ride-stats" aria-label="Условия заезда">
      <div><dt>Дистанция</dt><dd>500 <small>м</small></dd></div>
      <div><dt>Время</dt><dd>{DURATION / 1000} <small>сек</small></dd></div>
      <div><dt>Запас жизней</dt><dd>3 <small aria-label="сердца">♥</small></dd></div>
    </dl>
    <ul className="bike-quick-rules">
      <li><span className="bike-rule-icon" aria-hidden="true">↔</span><div><strong>Меняй полосу</strong><p>Коснись полосы или жми ← → на экране или клавиатуре.</p></div></li>
      <li><span className="bike-rule-icon" aria-hidden="true">!</span><div><strong>Смотри вперёд</strong><p>Объезжай прохожих, кожуру и встречных. Потеряешь все жизни — начнёшь заново.</p></div></li>
      <li><span className="bike-rule-icon" aria-hidden="true">♪</span><div><strong>Звони заранее</strong><p>Жми звонок или пробел — прохожие уступят. В запасе {BELLS} звонка.</p></div></li>
    </ul>
    <div className="bike-pickup-tip"><span aria-hidden="true">★</span><p><strong>Звёзды — очки, серия — множитель.</strong><br/>Сердце вернёт потерянную жизнь.</p></div>
    <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Дальше: перед заездом →</button><button className="text-button" onClick={onComic}>Перечитать комикс</button></div>
  </section>;
}

export function BikeFacts({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return <section className="paper-panel bike-intro bike-facts" aria-labelledby="bike-facts-title">
    <header className="bike-intro-heading"><span className="eyebrow">ПЕРЕД ЗАЕЗДОМ</span><span className="bike-intro-step">Коротко о важном · 2/2</span></header>
    <h1 id="bike-facts-title">Смотри вперёд.<br/><em>Береги себя.</em></h1>
    <p className="bike-intro-lead">В парке будет весело. Но у этой истории есть <span className="bike-underline">реальная сторона.</span></p>
    <span className="bike-facts-period">ВЕЛОСИПЕДИСТЫ · ВЕСЬ МИР · 2021</span>
    <dl className="bike-fact-list">
      <div><dt>случаев дорожных травм</dt><dd>≈ 9,8 <small>млн</small></dd><p>Оценка исследования GBD 2021</p></div>
      <div><dt>погибших на дорогах</dt><dd>≈ 71 <small>тыс.</small></dd><p>По данным ВОЗ</p></div>
    </dl>
    <p className="bike-facts-takeaway">В игре есть запасные сердца.<br/><strong className="bike-underline">В жизни — береги своё.</strong></p>
    <details className="bike-facts-sources"><summary>Откуда цифры</summary><p>Мировые оценки за 2021 год из разных источников. Для травм диапазон оценки — 8,3–11,7 млн случаев; это не число всех падений с велосипеда.</p><p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11997400/" target="_blank" rel="noopener noreferrer">GBD 2021 · таблица 1</a><span aria-hidden="true"> · </span><a href="https://www.who.int/news/item/13-12-2023-despite-notable-progress-road-safety-remains-urgent-global-issue" target="_blank" rel="noopener noreferrer">ВОЗ · отчёт 2023</a></p></details>
    <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Начать заезд →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
  </section>;
}
