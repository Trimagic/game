import PagedPanel from '../PagedPanel';
export const poolPanels = [
  { title: 'Новый день. Новый абонемент.', words: 'В бассейне хотя бы никто не бросает банановую кожуру.', position: '0% 0%' },
  { title: 'Вода с характером.', words: 'Стоп. Это точно не шоколадный батончик?', position: '100% 0%' },
  { title: 'Кардио пошло по плану.', words: 'Я хотел плавать для здоровья. Теперь — ради спасения.', position: '0% 100%' },
  { title: 'У каждой дорожки есть хозяин.', words: 'Какун. Абонемент «всё включено». Даже то, что не просили.', position: '100% 100%' },
];

export function PoolBrief({ onContinue, onComic }: { onContinue: () => void; onComic: () => void }) {
  return <PagedPanel className="paper-panel pool-intro">
    <span className="eyebrow">ЭТАП 02 / ЗАПЛЫВ С СЮРПРИЗОМ</span>
    <h1>Не всё золото,<br/><em>что плывёт.</em></h1>
    <div className="pool-cast"><svg viewBox="0 0 2172 724" role="img" aria-label="Наш пловец, коричневое препятствие и босс Какун"><image href="/art/chapter-02-sprites.png" width="2172" height="724" /></svg></div>
    <p>Продержись 45 секунд в самом гостеприимном бассейне города. Обходи коричневые сюрпризы и доберись до выхода.</p>
    <div className="rules"><b>↑ ↓</b><p><strong>Удерживай</strong> кнопку, экран, пробел или ↑ — плыви вверх. <strong>Отпусти</strong> — опускайся. Три столкновения — новая попытка.</p></div>
    <div className="boss-notice"><b>ФИНАЛЬНЫЙ БОСС: КАКУН</b><p>С 30-й секунды он лично пополняет бассейн. Ищи свободный проход между волнами. Выдержишь последние 15 секунд — победа!</p></div>
    <button className="full-button" onClick={onContinue}>Дальше →</button>
    <button className="text-button" onClick={onComic}>Прочитать комикс</button>
  </PagedPanel>;
}

export function PoolFacts({ onContinue }: { onContinue: () => void }) {
  return <PagedPanel className="paper-panel facts pool-intro" aria-labelledby="pool-facts-title">
    <span className="eyebrow">ПЕРЕД ЗАПЛЫВОМ / ВОЗ И CDC</span>
    <h1 id="pool-facts-title">Прозрачная вода.<br/><em>Не всё так ясно.</em></h1>
    <dl className="facts-numbers"><div><dt>Остатки кала на коже одного человека</dt><dd>≈ 0,14 г</dd><p>CDC приводит такую среднюю оценку для области вокруг ануса. Эти остатки могут смываться в воду, если не принять душ с мылом перед плаванием.</p></div></dl>
    <p className="facts-note">Это оценка на коже, а не измеренное количество в бассейне. Цифра приведена CDC в 2013 году со ссылкой на исследование 2000 года; это не статистика ВОЗ.</p>
    <div className="who-note"><strong>Что говорит ВОЗ</strong><p>Душ перед плаванием помогает удалять следы кала и другие загрязнения. При попадании кала в бассейн купание прекращают до обеззараживания.</p></div>
    <p className="facts-note">В игре — сатира. В жизни при таком загрязнении выйди из воды и сообщи персоналу.</p>
    <div className="facts-sources">Источники: <a href="https://www.cdc.gov/mmwr/preview/mmwrhtml/mm6219a3.htm" target="_blank" rel="noopener noreferrer">CDC, MMWR, 2013</a> · <a href="https://www.who.int/publications/i/item/9241546808" target="_blank" rel="noopener noreferrer">ВОЗ, руководство по бассейнам, 2006 (раздел 5.1 и резюме)</a></div>
    <button className="full-button" onClick={onContinue}>Продолжить →</button>
  </PagedPanel>;
}

