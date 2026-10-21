export type Task = { id:string; name:string; icon:string; duration:number; earliest:number; latest:number; tone:string; fixed?:number };
export type Plan = Record<string,number>;
export const days=['Понедельник','Среда','Пятница'];
export const hour=(slot:number)=>`${String(slot+6).padStart(2,'0')}:00`;
export function tasksFor(day:number, event=0):Task[]{
  const tasks:Task[]=[
    {id:'breakfast',name:'Завтрак',icon:'☀',duration:1,earliest:0,latest:3,tone:'yellow'},
    {id:'work',name:event>=2?'Работа + «пять минут»':'Работа',icon:'▣',duration:event>=2?5:4,earliest:3,latest:10,tone:'blue',...(day===1?{fixed:4}:{})},
    {id:'lunch',name:'Обед',icon:'◒',duration:1,earliest:6,latest:10,tone:'yellow'},
    {id:'exercise',name:'Движение',icon:'↗',duration:2,earliest:1,latest:14,tone:'orange'},
    {id:'dinner',name:'Готовка и ужин',icon:'♨',duration:2,earliest:11,latest:16,tone:'yellow'},
    {id:'rest',name:'Ничего не делать',icon:'♡',duration:2,earliest:10,latest:16,tone:'green'},
  ];
  if(day===1)tasks.push({id:'out',name:'Дорога в офис',icon:'→',duration:1,earliest:2,latest:4,tone:'blue'},{id:'back',name:'Дорога домой',icon:'←',duration:1,earliest:8,latest:11,tone:'blue'});
  if(day===2&&event>=1)tasks.push({id:'delivery',name:'Ждать доставку',icon:'▧',duration:1,earliest:10,latest:11,fixed:10,tone:'pink'});
  return tasks;
}
export function canPlace(tasks:Task[],plan:Plan,id:string,start:number):boolean{
  const task=tasks.find(t=>t.id===id);
  if(!task||!Number.isInteger(start)||start<task.earliest||start+task.duration>task.latest||start<0||start+task.duration>16||(task.fixed!==undefined&&start!==task.fixed))return false;
  return tasks.every(other=>other.id===id||plan[other.id]===undefined||start+task.duration<=plan[other.id]||start>=plan[other.id]+other.duration);
}
export function complete(tasks:Task[],plan:Plan){return tasks.every(t=>plan[t.id]!==undefined&&canPlace(tasks,plan,t.id,plan[t.id]));}
export function reconcile(tasks:Task[],plan:Plan):Plan{
  const next:Plan={};
  // Reserve newly fixed appointments first; displaced tasks return to the tray.
  for(const t of [...tasks].sort((a,b)=>Number(b.fixed!==undefined)-Number(a.fixed!==undefined))){
    const start=t.fixed??plan[t.id];
    if(start!==undefined&&canPlace(tasks,next,t.id,start))next[t.id]=start;
  }
  return next;
}
