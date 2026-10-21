export type Cell={x:number;y:number};
export type Direction='up'|'down'|'left'|'right';
export const directions:Record<Direction,Cell>={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
export type Patrol={role:'nurse'|'doctor'|'guard';route:Cell[];offset:number};
export type Location={name:string;hint:string;rows:string[];start:Cell;exit:Cell;patrols:Patrol[]};
const line=(x:number,y:number,dx:number,dy:number,n:number):Cell[]=>{
 const points=Array.from({length:n},(_,i)=>({x:x+dx*i,y:y+dy*i}));
 return [...points,...points.slice(1,-1).reverse()];
};
export const locations:Location[]=[
 {name:'Столовая',hint:'Обходи столы: они закрывают обзор.',start:{x:1,y:9},exit:{x:9,y:1},
 rows:['###########','#.........#','######....#','#.........#','#....######','#.........#','######....#','#.........#','#..##.##..#','#.........#','###########'],
 patrols:[{role:'nurse',route:line(2,3,1,0,7),offset:0},{role:'nurse',route:line(2,7,1,0,7),offset:6}]},
 {name:'Коридор',hint:'Врач смотрит вперёд. Пропусти его за перегородкой.',start:{x:1,y:9},exit:{x:9,y:1},
 rows:['###########','#.........#','######....#','#.........#','#....######','#.........#','######....#','#.........#','#....###..#','#.........#','###########'],
 patrols:[{role:'doctor',route:line(3,3,1,0,6),offset:3},{role:'nurse',route:line(2,7,1,0,7),offset:0},{role:'doctor',route:line(3,5,1,0,6),offset:4}]},
 {name:'Вестибюль',hint:'Курьер у зелёной двери. За стойками тебя не видно.',start:{x:1,y:9},exit:{x:9,y:1},
 rows:['###########','#.........#','#######...#','#.........#','#...#######','#.........#','#######...#','#.........#','#....###..#','#.........#','###########'],
 patrols:[{role:'guard',route:line(2,3,1,0,7),offset:2},{role:'doctor',route:line(2,5,1,0,7),offset:7},{role:'nurse',route:line(2,7,1,0,7),offset:4}]},
];
export type DeliveryState={level:number;hero:Cell;time:number;cooldown:number;suspicion:number;status:'playing'|'between'|'lost'|'ending'|'done';ending:number};
export const initial=():DeliveryState=>({level:0,hero:{...locations[0].start},time:0,cooldown:0,suspicion:0,status:'playing',ending:0});
export const walkable=(map:Location,c:Cell)=>map.rows[c.y]?.[c.x]!==undefined&&map.rows[c.y][c.x]!=='#';
export function guards(map:Location,time:number){
 return map.patrols.map(p=>{
  const index=(Math.floor((time+1e-7)/.7)+p.offset)%p.route.length;
  const at=p.route[index],next=p.route[(index+1)%p.route.length];
  return {...at,role:p.role,facing:{x:next.x-at.x,y:next.y-at.y}};
 });
}
export function sees(map:Location,g:Cell&{facing:Cell},hero:Cell){
 const dx=hero.x-g.x,dy=hero.y-g.y,forward=dx*g.facing.x+dy*g.facing.y;
 if(dx===0&&dy===0)return true;
 if(forward<=0||Math.abs(dx*g.facing.y-dy*g.facing.x)>forward||Math.hypot(dx,dy)>3.6)return false;
 const steps=Math.max(Math.abs(dx),Math.abs(dy))*4;
 for(let i=1;i<steps;i++)if(!walkable(map,{x:Math.round(g.x+dx*i/steps),y:Math.round(g.y+dy*i/steps)}))return false;
 return true;
}
export function nextLocation(s:DeliveryState):DeliveryState{
 if(s.status!=='between')return s;
 const level=s.level+1;
 return {...s,level,hero:{...locations[level].start},time:0,cooldown:0,suspicion:0,status:'playing'};
}
export function tick(state:DeliveryState,dt:number,input:Direction|null):DeliveryState{
 if(['lost','done','between'].includes(state.status))return state;
 let s=state,remaining=Math.min(.1,Math.max(0,dt));
 while(remaining>1e-7){
  const h=Math.min(.025,remaining);remaining-=h;
  if(s.status==='ending'){const ending=s.ending+h;s={...s,ending,status:ending>=3?'done':'ending'};continue;}
  if(s.status!=='playing')break;
  const map=locations[s.level];let hero=s.hero,cooldown=Math.max(0,s.cooldown-h);
  if(input&&cooldown<=1e-6){const d=directions[input],target={x:hero.x+d.x,y:hero.y+d.y};if(walkable(map,target))hero=target;cooldown=.2;}
  const time=s.time+h,staff=guards(map,time);
  const visible=staff.some(g=>sees(map,g,hero));
  const suspicion=Math.max(0,Math.min(1,s.suspicion+h*(visible?1.4:-1.1)));
  const caught=staff.some(g=>g.x===hero.x&&g.y===hero.y)||suspicion>=1;
  const exit=hero.x===map.exit.x&&hero.y===map.exit.y;
  s={...s,hero,cooldown,time,suspicion,status:caught?'lost':exit?(s.level===locations.length-1?'ending':'between'):'playing'};
 }
 return s;
}
