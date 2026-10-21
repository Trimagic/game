export const DURATION=60;
export const HERO_X=82;
export const travel=(t:number)=>180*t+2*t*t/3;
export type Kind='puddle'|'bag'|'scooter'|'branch'|'double'|'barrier';
export type Obstacle={id:number;at:number;kind:Kind;width:number;height:number;bottom:number};
const times=[4,7.5,11,14.5,18,21,24,27,30,33,36,39,42,44.5,47,49.5,52,54,56,58];
const types:Kind[]=['puddle','bag','puddle','scooter','bag','branch','puddle','branch','scooter','branch','barrier','puddle','branch','double','branch','barrier','double','branch','double','branch'];
export const course:Obstacle[]=times.map((at,id)=>{const kind=types[id];return{id,at,kind,width:kind==='double'?88:kind==='branch'?72:kind==='barrier'?42:kind==='scooter'?56:kind==='puddle'?58:30,height:kind==='barrier'?43:kind==='branch'?65:kind==='scooter'?30:kind==='bag'?28:kind==='double'?20:7,bottom:kind==='branch'?42:0};});
export const obstacleX=(o:Obstacle,time:number)=>HERO_X+travel(o.at)-travel(time);
export type State={time:number;y:number;vy:number;duck:boolean;lives:number;shield:number;hits:number[];cleared:number;status:'playing'|'lost'|'won';message:string};
export const initial=():State=>({time:0,y:0,vy:0,duck:false,lives:3,shield:0,hits:[],cleared:0,status:'playing',message:'Спокойный темп. Начинаем с прыжков.'});
export function jump(s:State):State{return s.status==='playing'&&s.y===0?{...s,vy:440,duck:false}:s;}
export function duck(s:State,down:boolean):State{return s.status==='playing'?{...s,duck:down}:s;}
export function step(state:State,dt:number):State{
  if(state.status!=='playing')return state;
  let s=state,remaining=Math.max(0,Math.min(dt,.1));
  while(remaining>1e-6&&s.status==='playing'){
    const h=Math.min(remaining,1/120);remaining-=h;
    const time=Math.min(DURATION,s.time+h);
    let y=s.y+s.vy*h-550*h*h,vy=s.vy-1100*h;if(y<=0){y=0;vy=0;}
    s={...s,time,y,vy,shield:Math.max(0,s.shield-h)};
    const height=s.duck&&y===0?29:58;
    const hit=course.find(o=>!s.hits.includes(o.id)&&Math.abs(obstacleX(o,time)-HERO_X)<o.width/2+12&&y<o.bottom+o.height&&y+height>o.bottom);
    if(hit&&s.shield===0){s={...s,lives:s.lives-1,shield:1.4,hits:[...s.hits,hit.id],message:hit.kind==='branch'?'Ветки — пригибайся, не прыгай!':'Чуть раньше отталкивайся от земли.'};if(s.lives===0)s.status='lost';}
    s.cleared=course.filter(o=>obstacleX(o,time)+o.width/2<HERO_X-12&&!s.hits.includes(o.id)).length;
    if(time>=DURATION&&s.status==='playing')s={...s,status:'won',message:'Километр позади. Автобус — впереди!'};
  }
  return s;
}


