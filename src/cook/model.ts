export const COOK_MS = 42_000;
export const PREP = [
  { name: 'Помидоры', product: 3, hint: 'Два разреза для салата.' },
  { name: 'Брокколи', product: 2, hint: 'Раздели на небольшие соцветия.' },
  { name: 'Курица', product: 0, hint: 'Овощи готовы. Теперь отдельная доска для курицы.' },
] as const;
export const TASKS = [
  { id: 'pan-first', station: 'pan', at: 7000, until: 13000, label: 'Перевернуть курицу', success: 'Первая сторона готова. Хороший цвет!' },
  { id: 'rice-stir', station: 'pot', at: 12000, until: 18000, label: 'Перемешать рис', success: 'Рис перемешан. Крышку на место.' },
  { id: 'pan-second', station: 'pan', at: 21000, until: 27000, label: 'Перевернуть ещё раз', success: 'Курица подрумянилась с обеих сторон.' },
  { id: 'rice-off', station: 'pot', at: 27000, until: 34000, label: 'Снять рис и брокколи', success: 'Гарнир снят с огня. Успели!' },
  { id: 'pan-off', station: 'pan', at: 34000, until: 41000, label: 'Снять курицу', success: 'Сковорода снята. Можно выдохнуть.' },
] as const;
export type Station = 'pan' | 'pot';
export type CookState = {
  stage: 'prep' | 'ready' | 'stove' | 'plate' | 'won' | 'lost';
  cuts: number; elapsed: number; mistakes: number;
  results: Record<string, 'done' | 'missed'>;
  dismissed: boolean; plated: number[]; notice: string;
};
export type CookAction = {type:'cut'} | {type:'start'} | {type:'tick'; delta:number} | {type:'act'; station:Station} | {type:'dismiss'} | {type:'plate'; part:number} | {type:'serve'};
export function createCookState(): CookState {
  return { stage:'prep', cuts:0, elapsed:0, mistakes:0, results:{}, dismissed:false, plated:[], notice:'Проведи сверху вниз по пунктирной линии.' };
}
export const phoneActive = (state: CookState) => state.stage==='stove' && !state.dismissed && state.elapsed>=26_000 && state.elapsed<31_000;
export const nextTask = (state: CookState, station: Station) => TASKS.find(task=>task.station===station && !state.results[task.id]);
export function validCut(from:{x:number;y:number}, to:{x:number;y:number}, line:number):boolean {
  return Math.min(from.y,to.y)<=.25 && Math.max(from.y,to.y)>=.75 && Math.abs(from.x-line)<=.18 && Math.abs(to.x-line)<=.18;
}
export function cookReducer(state:CookState, action:CookAction):CookState {
  if(state.stage==='won'||state.stage==='lost') return state;
  if(action.type==='cut' && state.stage==='prep') {
    const cuts=state.cuts+1;
    return {...state,cuts,stage:cuts===6?'ready':'prep',notice:cuts===6?'Нарезка готова. Включаем плиту?':cuts%2===0?'Готово! Следующий ингредиент.':'Хорошо. Ещё один разрез.'};
  }
  if(action.type==='start' && state.stage==='ready') return {...state,stage:'stove',notice:'Курица на сковороде с маслом. Рис и брокколи — в кастрюле. Следи за подсказками.'};
  if(action.type==='dismiss' && phoneActive(state)) return {...state,dismissed:true,notice:'«Мам, почти поел!» Вернёмся к плите.'};
  if(action.type==='tick' && state.stage==='stove') {
    const elapsed=Math.min(COOK_MS,state.elapsed+Math.max(0,Math.min(action.delta,250)));
    const results={...state.results}; let mistakes=state.mistakes; let notice=state.notice;
    for(const task of TASKS) if(!results[task.id] && elapsed>task.until) {
      results[task.id]='missed'; mistakes++; notice=`Не успели: ${task.label.toLowerCase()}. ${mistakes<3?'Продолжаем, ужин ещё можно спасти.':'Пора начать заново.'}`;
    }
    return {...state,elapsed,results,mistakes,notice,stage:mistakes>=3?'lost':elapsed===COOK_MS?'plate':'stove'};
  }
  if(action.type==='act' && state.stage==='stove' && !phoneActive(state)) {
    const task=nextTask(state,action.station);
    if(!task) return state;
    if(state.elapsed<task.at) return {...state,notice:'Пока рано. Дождись зелёной подсказки на конфорке.'};
    if(state.elapsed>task.until) return state;
    return {...state,results:{...state.results,[task.id]:'done'},notice:task.success};
  }
  if(action.type==='plate' && state.stage==='plate' && Number.isInteger(action.part) && action.part>=0 && action.part<3 && !state.plated.includes(action.part)) return {...state,plated:[...state.plated,action.part],notice:'Ещё немного — и можно к столу.'};
  if(action.type==='serve' && state.stage==='plate' && state.plated.length===3) return {...state,stage:'won'};
  return state;
}
