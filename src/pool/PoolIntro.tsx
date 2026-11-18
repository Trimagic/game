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
    <h1 id="pool-facts-title">Кал в бассейне.<br/><em>Риск кишечной инфекции.</em></h1>
    <p className="bike-intro-lead">С калом в воду могут попасть криптоспоридии, лямблии и норовирус. Если проглотить загрязнённую воду, возможны <span className="bike-underline">диарея, рвота и спазмы в животе</span>. При сильной диарее и рвоте организм теряет воду и соли, что может привести к обезвоживанию.</p>
    <span className="bike-facts-period">ДАННЫЕ ИССЛЕДОВАНИЙ И CDC</span>
    <dl className="bike-fact-list">
      <div><dt>следов кала на коже вокруг ануса</dt><dd>≈ 0,14 <small>г</small></dd><p>Средняя оценка остатков на коже, которую приводит CDC.</p></div>
      <div><dt>проб промывной воды из фильтров содержали ДНК кишечной палочки</dt><dd>58 <small>%</small></dd><p>93 из 161 пробы · 127 бассейнов в районе Атланты · лето 2012 года.</p></div>
      <div><dt>могут выживать криптоспоридии даже в правильно хлорированной воде</dt><dd>&gt; 7 <small>дней</small></dd><p>Оценка CDC для воды бассейна.</p></div>
      <div><dt>от заражения криптоспоридиями до первых симптомов</dt><dd>2–10 <small>дней</small></dd><p>Симптомы обычно длятся 1–2 недели. При ослабленном иммунитете болезнь может протекать тяжело.</p></div>
    </dl>
    <p className="bike-facts-takeaway"><strong className="bike-underline">Если в воде обнаружен кал, выйди из бассейна и сообщи персоналу.</strong><br/>Перед плаванием CDC рекомендует принять душ хотя бы 1 минуту и не глотать воду во время заплыва.</p>
    <details className="bike-facts-sources">
      <summary>Источники и подробности</summary>
      <p>Показатель 58% относится к пробам из фильтров в одном регионе. По обнаруженной ДНК нельзя определить, были ли бактерии живыми, или рассчитать вероятность заболевания.</p>
      <p><a href="https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6219a3.htm" target="_blank" rel="noopener noreferrer">CDC · исследование и оценка</a><br/><a href="https://www.cdc.gov/healthy-swimming/safety/what-you-can-do-to-stay-healthy-in-swimming-pools.html" target="_blank" rel="noopener noreferrer">CDC · душ перед плаванием</a><br/><a href="https://www.cdc.gov/healthy-swimming/response/what-to-do-when-there-is-poop-in-the-pool.html" target="_blank" rel="noopener noreferrer">CDC · загрязнение бассейна</a><br/><a href="https://www.cdc.gov/healthy-swimming/prevention/preventing-diarrheal-illnesses.html" target="_blank" rel="noopener noreferrer">CDC · кишечные инфекции при плавании</a><br/><a href="https://www.cdc.gov/cryptosporidium/about/" target="_blank" rel="noopener noreferrer">CDC · течение криптоспоридиоза</a></p>
    </details>
    <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Начать заплыв →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
  </section>;
}
