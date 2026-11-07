export type Cell={x:number;y:number};
export type Direction='up'|'down'|'left'|'right';
export const directions:Record<Direction,Cell>={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
export type Patrol={role:'nurse'|'doctor'|'guard'|'camera';route:Cell[];offset:number};
// Floor marks in the room plans: o seasoning, h potted plant to hide in, w wet floor, n spare noise charge.
export const NOISE_TIME=2.6,START_NOISE=2,ALARM=.6,GLANCE_EVERY=5,GLANCE_FOR=.9,GLANCE_WARN=.8,CAMERA_TURN=2.2;
export const RANGE={nurse:3.6,doctor:4.8,guard:3.6,camera:4.2};
export type Location={name:string;hint:string;rows:string[];start:Cell;exit:Cell;patrols:Patrol[]};
const line=(x:number,y:number,dx:number,dy:number,n:number):Cell[]=>{
 const points=Array.from({length:n},(_,i)=>({x:x+dx*i,y:y+dy*i}));
 return [...points,...points.slice(1,-1).reverse()];
};
export const locations:Location[]=[
 {name:'Столовая',hint:'Обходи столы: они закрывают обзор.',start:{x:1,y:9},exit:{x:9,y:1},
 rows:['###########','#o........#','######....#','#h....o...#','#....######','#....o...h#','######....#','#h........#','#..##.##..#','#...o.....#','###########'],
 patrols:[{role:'nurse',route:line(2,3,1,0,7),offset:0},{role:'nurse',route:line(2,7,1,0,7),offset:6}]},
 {name:'Коридор',hint:'Врач смотрит вперёд. Пропусти его за перегородкой.',start:{x:1,y:9},exit:{x:9,y:1},
 rows:['###########','#.o.......#','######....#','#n.......h#','#....######','#h...w..o.#','######....#','#...w...o.#','#....###..#','#..o......#','###########'],
 patrols:[{role:'doctor',route:line(3,3,1,0,6),offset:3},{role:'nurse',route:line(2,7,1,0,7),offset:0},{role:'doctor',route:line(3,5,1,0,6),offset:4}]},
 {name:'Вестибюль',hint:'Курьер у зелёной двери. За стойками тебя не видно.',start:{x:1,y:9},exit:{x:9,y:1},
 rows:['###########','#o..w.....#','#######...#','#....w..h.#','#...#######','#h...o....#','#######...#','#o..w...h.#','#....###..#','#.......o.#','###########'],
 patrols:[{role:'guard',route:line(2,3,1,0,7),offset:2},{role:'doctor',route:line(2,5,1,0,7),offset:7},{role:'nurse',route:line(2,7,1,0,7),offset:4},{role:'camera',route:[{x:5,y:4}],offset:0}]},
];
export type Flash={text:string;cell:Cell;good:boolean};
export type DeliveryState={level:number;hero:Cell;time:number;cooldown:number;suspicion:number;status:'playing'|'between'|'lost'|'ending'|'done';ending:number;staffTime:number;noise:number;charges:number;lives:number;score:number;found:string[];clock:number;slide:Direction|null;caught:number;flashes:Flash[]};
/** Every two losses in a row buy one spare heart, so the story never gets stuck. */
export const spareHearts=(losses:number)=>Math.min(2,Math.floor(losses/2));
export const initial=(spare=0):DeliveryState=>({level:0,hero:{...locations[0].start},time:0,cooldown:0,suspicion:0,status:'playing',ending:0,staffTime:0,noise:0,charges:START_NOISE,lives:3+spare,score:0,found:[],clock:0,slide:null,caught:0,flashes:[]});
export const tileAt=(map:Location,c:Cell)=>map.rows[c.y]?.[c.x]??'#';
const itemId=(level:number,c:Cell)=>level+':'+c.x+','+c.y;
export const itemsIn=(map:Location,mark:string)=>map.rows.flatMap((row,y)=>[...row].flatMap((cell,x)=>cell===mark?[{x,y}]:[]));
export const TOTAL_COINS=locations.reduce((n,map)=>n+itemsIn(map,'o').length,0);
export const hidden=(map:Location,c:Cell)=>tileAt(map,c)==='h';
export const walkable=(map:Location,c:Cell)=>map.rows[c.y]?.[c.x]!==undefined&&map.rows[c.y][c.x]!=='#';
export function guards(map:Location,time:number){
 return map.patrols.map(p=>{
  const index=(Math.floor((time+1e-7)/.7)+p.offset)%p.route.length;
  const at=p.route[index],next=p.route[(index+1)%p.route.length];
  // The camera swings between the two corridors it overlooks.
  if(p.role==='camera'){const phase=time%(CAMERA_TURN*2);return {...at,role:p.role,facing:{x:0,y:phase<CAMERA_TURN?1:-1},warn:phase%CAMERA_TURN>CAMERA_TURN-GLANCE_WARN};}
  let facing={x:next.x-at.x,y:next.y-at.y};
  // The guard glances over his shoulder at regular intervals, after a visible warning.
  const beat=time%GLANCE_EVERY;const glance=p.role==='guard'&&beat>GLANCE_EVERY-GLANCE_FOR;
  if(glance)facing={x:-facing.x,y:-facing.y};
  return {...at,role:p.role,facing,warn:p.role==='guard'&&!glance&&beat>GLANCE_EVERY-GLANCE_FOR-GLANCE_WARN};
 });
}
export function sees(map:Location,g:Cell&{facing:Cell;role?:keyof typeof RANGE},hero:Cell){
 const dx=hero.x-g.x,dy=hero.y-g.y,forward=dx*g.facing.x+dy*g.facing.y;
 if(dx===0&&dy===0)return true;
 if(forward<=0||Math.abs(dx*g.facing.y-dy*g.facing.x)>forward||Math.hypot(dx,dy)>RANGE[g.role??'nurse'])return false;
 const steps=Math.max(Math.abs(dx),Math.abs(dy))*4;
 for(let i=1;i<steps;i++)if(!walkable(map,{x:Math.round(g.x+dx*i/steps),y:Math.round(g.y+dy*i/steps)}))return false;
 return true;
}
export function nextLocation(s:DeliveryState):DeliveryState{
 if(s.status!=='between')return s;
 const level=s.level+1;
 return {...s,level,hero:{...locations[level].start},time:0,cooldown:0,suspicion:0,staffTime:0,noise:0,slide:null,status:'playing'};
}
/** A racket down the hall: for a moment nobody moves or looks. */
export function makeNoise(s:DeliveryState):DeliveryState{
 if(s.status!=='playing'||s.charges<=0||s.noise>0)return s;
 return {...s,charges:s.charges-1,noise:NOISE_TIME,flashes:[...s.flashes,{text:'ГРОХОТ НА КУХНЕ!',cell:s.hero,good:true}]};
}
export function tick(state:DeliveryState,dt:number,input:Direction|null):DeliveryState{
 if(['lost','done','between'].includes(state.status))return state;
 let s:DeliveryState={...state,flashes:[]},remaining=Math.min(.1,Math.max(0,dt));
 while(remaining>1e-7){
  const h=Math.min(.025,remaining);remaining-=h;
  if(s.status==='ending'){const ending=s.ending+h;s={...s,ending,status:ending>=3?'done':'ending'};continue;}
  if(s.status!=='playing')break;
  const map=locations[s.level];let hero=s.hero,cooldown=Math.max(0,s.cooldown-h),slide=s.slide,score=s.score,charges=s.charges,found=s.found;const flashes=[...s.flashes];
  const wanted=slide??input;
  if(wanted&&cooldown<=1e-6){
   const d=directions[wanted],target={x:hero.x+d.x,y:hero.y+d.y};
   slide=null;
   if(walkable(map,target)){
    hero=target;cooldown=wanted===s.slide?.1:.17;
    if(tileAt(map,target)==='w'&&walkable(map,{x:target.x+d.x,y:target.y+d.y})){slide=wanted;cooldown=.08;flashes.push({text:'СКОЛЬЗКО!',cell:target,good:false});}
    const id=itemId(s.level,target),mark=tileAt(map,target);
    if((mark==='o'||mark==='n')&&!found.includes(id)){found=[...found,id];if(mark==='o'){score+=20;flashes.push({text:'+20 ПРИПРАВА',cell:target,good:true});}else{charges++;flashes.push({text:'+1 ШУМ',cell:target,good:true});}}
   }else cooldown=.1;
  }
  const noise=Math.max(0,s.noise-h);
  // Staff freeze during a noise and hurry once suspicion runs high.
  const staffTime=s.staffTime+(s.noise>0?0:h*(s.suspicion>=ALARM?1.45:1));
  const time=s.time+h,staff=guards(map,staffTime);
  const visible=s.noise===0&&!hidden(map,hero)&&staff.some(g=>sees(map,g,hero));
  const suspicion=Math.max(0,Math.min(1,s.suspicion+h*(visible?1.4:-1.1)));
  const bumped=staff.some(g=>g.role!=='camera'&&g.x===hero.x&&g.y===hero.y);
  const exit=hero.x===map.exit.x&&hero.y===map.exit.y;
  let next:DeliveryState={...s,hero,cooldown,time,suspicion,noise,staffTime,slide,score,charges,found,flashes,clock:s.clock+h,status:exit?(s.level===locations.length-1?'ending':'between'):'playing'};
  if(exit)next={...next,score:next.score+50};
  else if(bumped||suspicion>=1){
   const lives=s.lives-1;
   // A heart sends you back to the door of this room, not to the first one.
   next=lives<=0?{...next,lives,status:'lost'}:{...next,lives,caught:s.caught+1,hero:{...map.start},suspicion:0,cooldown:.25,slide:null,staffTime:staffTime+1.4,flashes:[...flashes,{text:'«А вы куда?» Назад!',cell:map.start,good:false}]};
  }
  s=next;
 }
 return s;
}
export const finalScore=(s:DeliveryState)=>s.score+Math.max(0,s.lives)*30+Math.max(0,Math.round(120-s.clock));
export function deliveryRating(s:DeliveryState){
 if(s.status==='lost')return 0;
 const coins=s.found.filter(id=>{const [level,at]=id.split(':');const [x,y]=at.split(',').map(Number);return tileAt(locations[Number(level)],{x,y})==='o';}).length/TOTAL_COINS;
 return coins>=.7&&s.lives>=2?3:coins>=.4||s.lives>=2?2:1;
}
