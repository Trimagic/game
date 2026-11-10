export type Chapter = 1|2|3|4|5|6|7|8|9|10|11;
export const chapters = [
  ['Крути педали','Проедь парк и обойди препятствия.','Велозаезд'],
  ['Заплыв с сюрпризом','Продержись на воде. Бассейн против.','Заплыв'],
  ['Правильная закупка','Собери список и уложись в бюджет.','Покупки'],
  ['Диетический ужин','Приготовь ужин, пока всё не сгорело.','Готовка'],
  ['Качай в ритм','Поймай ритм и выдержи три подхода.','Тренировка'],
  ['Ещё пять минут','Уложи героя спать вопреки телефону.','Отбой'],
  ['Утренний бег','Добеги километр с приключениями.','Пробежка'],
  ['Всё по расписанию','Найди в неделе место для себя.','План недели'],
  ['Где пульт?','Доберись до пульта. Всё не так просто.','Поиск пульта'],
  ['Операция «Обед»','Доставь обед, сохранив самообладание.','Доставка'],
  ['Ночной маршрут','Пройди ночной маршрут до финала.','Ночной квест'],
] as const;
export function canOpenChapter(completed:number, chapter:Chapter) { return chapter <= completed + 1; }
export function resumeChapter(completed:number):Chapter { return (completed >= 11 ? 1 : completed + 1) as Chapter; }
export function chapterScreen(chapter:Chapter) { return chapter >= 9 ? 'game' as const : 'comic' as const; }
// Save before advancing: a failed or rejected save must never unlock a chapter.
export async function completeChapter(chapter:Chapter, save:(level:number)=>Promise<number>) {
  const completed = await save(chapter);
  if (completed < chapter) throw new Error('Сначала пройди предыдущую главу. Прогресс не изменён.');
  return { completed, next: chapter < 11 ? chapter + 1 as Chapter : null };
}
