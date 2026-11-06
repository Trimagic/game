export const DURATION=60;
export const HERO_X=82;
export const BOOTS_TIME=8;
export const travel=(t:number)=>180*t+2*t*t/3;
export type Kind='puddle'|'bag'|'scooter'|'branch'|'double'|'barrier'|'dog'|'pigeons'|'pond';
export type Obstacle={id:number;at:number;kind:Kind;width:number;height:number;bottom:number;rush:number};
export type Pickup={id:number;at:number;kind:'boots'|'water'};
export type Course={obstacles:Obstacle[];pickups:Pickup[]};
// Each zone of the park adds something new; breath is the pause between patterns.
export const ZONES=[
  {from:0,name:'Аллея',coach:'РАЗМИНКА · «Спокойный километр», говорили они.',breath:2.2},
  {from:14,name:'Собачья площадка',coach:'СОБАКИ БЕГУТ НАВСТРЕЧУ · И ветки здесь низкие.',breath:1.7},
  {from:30,name:'Дождь',coach:'ДОЖДЬ · Лужи шире, голуби ниже. Под ними не прыгай!',breath:1.4},
  {from:45,name:'Бегом к автобусу',coach:'ФИНИШНЫЙ РЫВОК · Автобус уже подъезжает!',breath:1.1},
] as const;
export const zoneAt=(time:number)=>time>=45?3:time>=30?2:time>=14?1:0;
// A pattern is a short run of obstacles with the seconds between them.
type Step=[Kind,number];
const PATTERNS:Step[][][]=[
  [[['puddle',0]],[['bag',0]],[['scooter',0]],[['puddle',1.5],['bag',0]]],
  [[['branch',0]],[['dog',0]],[['puddle',1.3],['branch',0]],[['branch',1.2],['bag',0]],[['barrier',0]],[['dog',1.4],['puddle',0]]],
  [[['pond',0]],[['pigeons',0]],[['puddle',1.1],['pigeons',0]],[['pigeons',1],['barrier',0]],[['branch',1.1],['dog',0]],[['pond',1.3],['branch',0]],[['double',0]]],
  [[['dog',1.1],['branch',1.1],['bag',0]],[['pigeons',1],['pond',0]],[['branch',1],['double',0]],[['double',1.2],['pigeons',1],['dog',0]],[['barrier',1.1],['branch',0]],[['pond',1.2],['dog',0]]],
];
const SHAPE:Record<Kind,{width:number;height:number;bottom?:number;rush?:number}>={
  puddle:{width:58,height:7},bag:{width:30,height:28},scooter:{width:56,height:30},barrier:{width:42,height:43},double:{width:88,height:20},
  branch:{width:72,height:65,bottom:42},dog:{width:46,height:30,rush:95},pigeons:{width:60,height:24,bottom:62},pond:{width:96,height:7},
};
export function buildCourse(seed:number):Course{
  let a=seed>>>0;const random=()=>{a=(Math.imul(a,1664525)+1013904223)>>>0;return a/4294967296;};
  const obstacles:Obstacle[]=[],pickups:Pickup[]=[];let t=3.5,last=-1,id=0;
  // Finds come in the two calmest breaths after the first zone.
  const finds:Pickup['kind'][]=['boots','water'];const findAt=[22,40];
  while(t<57.5){
    const zone=zoneAt(t);const options=PATTERNS[zone];let index=Math.floor(random()*options.length);if(index===last)index=(index+1)%options.length;last=index;
    const pattern=options[index];let at=t;
    for(const [kind,gap] of pattern){if(at>58.5)break;const shape=SHAPE[kind];obstacles.push({id:id++,at,kind,width:shape.width,height:shape.height,bottom:shape.bottom??0,rush:shape.rush??0});at+=gap;}
    const breath=ZONES[zone].breath+random()*.5;
    if(finds.length&&t>=findAt[2-finds.length]){pickups.push({id:pickups.length,at:at+breath*.55+.3,kind:finds.shift()!});t=at+breath+.8;}
    else t=at+breath;
  }
  return {obstacles,pickups};
}
export const course:Obstacle[]=buildCourse(1).obstacles;
export const obstacleX=(o:Obstacle,time:number)=>HERO_X+travel(o.at)-travel(time)+(o.at-time)*o.rush;
export const pickupX=(p:Pickup,time:number)=>HERO_X+travel(p.at)-travel(time);
export type State={time:number;y:number;vy:number;duck:boolean;lives:number;shield:number;hits:number[];cleared:number;status:'playing'|'lost'|'won';message:string;course:Course;taken:number[];boots:number;airJump:boolean};
export const initial=(seed=1):State=>({time:0,y:0,vy:0,duck:false,lives:3,shield:0,hits:[],cleared:0,status:'playing',message:'Спокойный темп. Начинаем с прыжков.',course:buildCourse(seed),taken:[],boots:0,airJump:false});
export function jump(s:State):State{
  if(s.status!=='playing')return s;
  if(s.y===0)return {...s,vy:440,duck:false};
  return s.boots>0&&!s.airJump?{...s,vy:390,airJump:true}:s;
}
export function duck(s:State,down:boolean):State{return s.status==='playing'?{...s,duck:down}:s;}
const HIT_TEXT:Partial<Record<Kind,string>>={branch:'Ветки — пригибайся, не прыгай!',pigeons:'Голуби! Под ними не прыгай, просто беги.',dog:'Собака быстрее всего: прыгай чуть раньше.'};
export function step(state:State,dt:number):State{
  if(state.status!=='playing')return state;
  let s=state,remaining=Math.max(0,Math.min(dt,.1));
  while(remaining>1e-6&&s.status==='playing'){
    const h=Math.min(remaining,1/120);remaining-=h;
    const time=Math.min(DURATION,s.time+h);
    let y=s.y+s.vy*h-550*h*h,vy=s.vy-1100*h;if(y<=0){y=0;vy=0;}
    s={...s,time,y,vy,shield:Math.max(0,s.shield-h),boots:Math.max(0,s.boots-h),airJump:y===0?false:s.airJump};
    const height=s.duck&&y===0?29:58;
    const hit=s.course.obstacles.find(o=>!s.hits.includes(o.id)&&Math.abs(obstacleX(o,time)-HERO_X)<o.width/2+12&&y<o.bottom+o.height&&y+height>o.bottom);
    if(hit&&s.shield===0){s={...s,lives:s.lives-1,shield:1.4,hits:[...s.hits,hit.id],message:HIT_TEXT[hit.kind]??'Чуть раньше отталкивайся от земли.'};if(s.lives===0)s.status='lost';}
    for(const p of s.course.pickups)if(!s.taken.includes(p.id)&&Math.abs(pickupX(p,time)-HERO_X)<24){
      s=p.kind==='boots'?{...s,taken:[...s.taken,p.id],boots:BOOTS_TIME,message:'Лёгкие кроссовки: в воздухе можно прыгнуть ещё раз!'}:{...s,taken:[...s.taken,p.id],lives:Math.min(3,s.lives+1),message:s.lives<3?'Глоток воды: плюс сердце!':'Глоток воды. Сердца и так полные.'};
    }
    s.cleared=s.course.obstacles.filter(o=>obstacleX(o,time)+o.width/2<HERO_X-12&&!s.hits.includes(o.id)).length;
    if(time>=DURATION&&s.status==='playing')s={...s,status:'won',message:'Километр позади. Автобус — впереди!'};
  }
  return s;
}
