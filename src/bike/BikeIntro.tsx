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
    <h1 id="bike-facts-title">Велосипедные травмы.<br/><em>Последствия падения.</em></h1>
    <p className="bike-intro-lead">При падении на вытянутую руку возможен <span className="bike-underline">перелом в области запястья</span>. Удар головой об асфальт может привести к сотрясению мозга или внутричерепному кровоизлиянию.</p>
    <span className="bike-facts-period">МИРОВЫЕ ОЦЕНКИ · 2021</span>
    <dl className="bike-fact-list">
      <div><dt>случаев дорожных травм у велосипедистов</dt><dd>≈ 9,8 <small>млн</small></dd><p>GBD 2021 · интервал неопределённости: 8,3–11,7 млн</p></div>
      <div><dt>велосипедистов погибли в ДТП</dt><dd>≈ 71 <small>тыс.</small></dd><p>Оценка ВОЗ</p></div>
      <div><dt>доля велосипедистов среди погибших в ДТП</dt><dd>6 <small>%</small></dd><p>Всего в мире в ДТП погибли 1,19 млн человек · ВОЗ</p></div>
      <div><dt>рост числа погибших велосипедистов с 2010 по 2021 год</dt><dd>≈ 20 <small>%</small></dd><p>За тот же период общее число погибших в ДТП снизилось на 5% · ВОЗ</p></div>
    </dl>
    <p className="bike-facts-takeaway"><strong className="bike-underline">Последствия травмы могут сохраняться после лечения.</strong><br/>После перелома возможны скованность запястья и слабость хвата, после сотрясения — головная боль, головокружение и трудности с концентрацией.</p>
    <details className="bike-facts-sources">
      <summary>Источники и подробности</summary>
      <p>Число случаев травм оценено в исследовании GBD 2021. Данные о погибших и сравнение с 2010 годом приведены в отчёте ВОЗ.</p>
      <p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11997400/" target="_blank" rel="noopener noreferrer">GBD 2021 · таблица 1</a><span aria-hidden="true"> · </span><a href="https://www.who.int/news/item/13-12-2023-despite-notable-progress-road-safety-remains-urgent-global-issue" target="_blank" rel="noopener noreferrer">ВОЗ · отчёт 2023</a></p>
      <p><a href="https://orthoinfo.aaos.org/en/diseases--conditions/distal-radius-fractures-broken-wrist/" target="_blank" rel="noopener noreferrer">AAOS · перелом в области запястья</a><span aria-hidden="true"> · </span><a href="https://www.cdc.gov/traumatic-brain-injury/signs-symptoms/index.html" target="_blank" rel="noopener noreferrer">CDC · симптомы черепно-мозговой травмы</a></p>
    </details>
    <div className="bike-intro-actions"><button className="full-button" onClick={onContinue}>Начать заезд →</button><button className="text-button" onClick={onBack}>← Как играть</button></div>
  </section>;
}
