import { BOSS_MS, ROUND_MS, SOAP_FOR_SHIELD } from './model';
import '../bike/bike-intro.css';
import './pool-intro.css';

export function PoolBrief({ onContinue, onComic }: { onContinue: () => void; onComic: () => void }) {
  return <section className="paper-panel bike-intro pool-brief" aria-labelledby="pool-brief-title">
    <header className="bike-intro-heading"><span className="eyebrow">02 / ЗАПЛЫВ С СЮРПРИЗОМ</span><span className="bike-intro-step">Как играть · 1/2</span></header>
    <h1 id="pool-brief-title">Плыви к выходу.<br/><em>Без лишних встреч.</em></h1>
    <p className="bike-intro-lead">Продержись до конца заплыва.</p>
    <dl className="bike-ride-stats" aria-label="Условия заплыва"><div><dt>До выхода</dt><dd>{ROUND_MS / 1000} <small>сек</small></dd></div><div><dt>Запас жизней</dt><dd>3 <small aria-label="сердца">♥</small></dd></div><div><dt>Мыло → щит</dt><dd>{SOAP_FOR_SHIELD} <small>шт.</small></dd></div></dl>
    <ul className="bike-quick-rules">
      <li><span className="bike-rule-icon" aria-hidden="true">↕</span><div><strong>Зажми — вверх. Отпусти — вниз.</strong><p>Экран, кнопка «↑» или пробел. Не касайся бортиков.</p></div></li>
      <li><span className="bike-rule-icon" aria-hidden="true">⚡</span><div><strong>Рывок — кнопка «⚡» или X.</strong><p>Разбивает игрушки и медуз. Торпеды и волны обходи.</p></div></li>
      <li><span className="bike-rule-icon" aria-hidden="true">!</span><div><strong>На {BOSS_MS / 1000}-й секунде — Какун.</strong><p>Ищи просвет в волнах. Красный «!» — скоро торпеда.</p></div></li>
    </ul>
    <div className="bike-pickup-tip"><span aria-hidden="true">◈</span><p><strong>{SOAP_FOR_SHIELD} мыла = щит на одно столкновение.</strong><br/>Через центр круга — бонус.</p></div>
    <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Дальше: перед заплывом →</button><button className="text-button" onClick={onComic}>Перечитать комикс</button></div>
  </section>;
}

export function PoolFacts({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return <section className="paper-panel bike-intro pool-brief pool-facts" aria-labelledby="pool-facts-title">
    <header className="bike-intro-heading"><span className="eyebrow">ПЕРЕД ЗАПЛЫВОМ</span><span className="bike-intro-step">Коротко о важном · 2/2</span></header>
    <h1 id="pool-facts-title">Вода общая.<br/><em>Забота — тоже.</em></h1>
    <p className="bike-intro-lead">Какун — выдумка. А вот <span className="bike-underline">душ перед бассейном</span> нужен по-настоящему.</p>
    <dl className="bike-fact-list">
      <div><dt>следов кала на коже вокруг ануса</dt><dd>≈ 0,14 <small>г</small></dd><p>Средняя оценка, которую приводит CDC. Это не количество в воде бассейна.</p></div>
      <div><dt>минимум под душем перед плаванием</dt><dd>1 <small>минута</small></dd><p>Рекомендация CDC: смыть грязь и загрязнения с тела.</p></div>
    </dl>
    <p className="bike-facts-takeaway">В игре — уворачивайся.<br/><strong className="bike-underline">В жизни — выйди и сообщи персоналу.</strong></p>
    <details className="bike-facts-sources"><summary>Источники и подробности</summary><p>0,14 г — оценка на коже человека, а не результат замера воды. CDC приводит её в публикации 2013 года со ссылкой на исследование 2000 года. Душ с мылом помогает смыть такие следы перед плаванием. Если в бассейне обнаружен кал, нужно выйти из воды и сообщить персоналу.</p><p><a href="https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6219a3.htm" target="_blank" rel="noopener noreferrer">CDC · исследование и оценка</a><br/><a href="https://www.cdc.gov/healthy-swimming/safety/what-you-can-do-to-stay-healthy-in-swimming-pools.html" target="_blank" rel="noopener noreferrer">CDC · душ перед плаванием</a><br/><a href="https://www.cdc.gov/healthy-swimming/response/what-to-do-when-there-is-poop-in-the-pool.html" target="_blank" rel="noopener noreferrer">CDC · загрязнение бассейна</a></p></details>
    <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Начать заплыв →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
  </section>;
}
