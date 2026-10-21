export const MAP = [
  '###############',
  '#o....#B#....o#',
  '#.##..#.#..##.#',
  '#.............#',
  '#.##.#.#.##.#.#',
  '#....#.#....#.#',
  '###..#...#..#.#',
  '#....###......#',
  '#.##.....##.#.#',
  '#....#.#....#.#',
  '#.##.#.#.##.#.#',
  '#.............#',
  '#.##..#.#..##.#',
  '#o....#S#....o#',
  '###############',
];
export const SIZE = 15;
export const GOAL = 600;
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Point = { x: number; y: number };
export const vectors: Record<Direction,Point> = { up: {x:0,y:-1}, down:{x:0,y:1}, left:{x:-1,y:0}, right:{x:1,y:0} };
export const directions = Object.keys(vectors) as Direction[];
export const key = (p:Point) => `${p.x},${p.y}`;
export const same = (a:Point,b:Point) => a.x===b.x&&a.y===b.y;
export const walkable = (p:Point) => p.y>=0&&p.y<SIZE&&p.x>=0&&p.x<SIZE&&MAP[p.y][p.x]!=='#';
export const neighbor = (p:Point,d:Direction):Point => ({x:p.x+vectors[d].x,y:p.y+vectors[d].y});
export const START = {x:7,y:13};
export const BED = {x:7,y:1};
const homes = [{x:1,y:3},{x:13,y:3},{x:1,y:7},{x:13,y:7}];
export const enemyNames = ['Уведомления','YouTube','Кино','Игры'];
export type Enemy = { pos:Point; home:Point; wait:number; meter:number };
export type State = { pos:Point; dir:Direction; queued:Direction; enemies:Enemy[]; dots:string[]; powers:string[]; score:number; lives:number; time:number; meter:number; quiet:number; shield:number; status:'playing'|'won'|'lost'; message:string; caught:number };
export function initial():State {
  const dots:string[]=[],powers:string[]=[];
  MAP.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='.')dots.push(key({x,y}));if(cell==='o')powers.push(key({x,y}));}));
  return {pos:{...START},dir:'up',queued:'up',enemies:homes.map((home,i)=>({pos:{...home},home,wait:3+i*7,meter:0})),dots,powers,score:0,lives:3,time:0,meter:0,quiet:0,shield:2,status:'playing',message:'Собери сонные искры. Телефон подождёт.',caught:0};
}
export function distances(target:Point):Map<string,number> {
  const result=new Map<string,number>([[key(target),0]]);const queue=[target];
  for(let i=0;i<queue.length;i++)for(const d of directions){const p=neighbor(queue[i],d);if(walkable(p)&&!result.has(key(p))){result.set(key(p),result.get(key(queue[i]))!+1);queue.push(p);}}
  return result;
}
export function turn(s:State,dir:Direction):State { return s.status==='playing'?{...s,queued:dir}:s; }
function collect(s:State):State {
  const id=key(s.pos);
  if(s.dots.includes(id))s={...s,dots:s.dots.filter(k=>k!==id),score:s.score+10};
  if(s.powers.includes(id))s={...s,powers:s.powers.filter(k=>k!==id),quiet:7,message:'НЕ БЕСПОКОИТЬ · теперь они бегут от тебя!'};
  if(s.score>=GOAL) {
    s={...s,message:'Сон накоплен! Доберись до кровати наверху.'};
    if(same(s.pos,BED))return {...s,status:'won',message:'Тишина. Наконец-то спим.'};
  }
  return s;
}
function collisions(s:State):State {
  if(s.status!=='playing')return s;
  for(let i=0;i<s.enemies.length;i++){
    const enemy=s.enemies[i];
    if(enemy.wait>0||!same(enemy.pos,s.pos))continue;
    if(s.quiet>0){s={...s,enemies:s.enemies.map((e,j)=>j===i?{...e,pos:{...e.home},wait:4,meter:0}:e),caught:s.caught+1,message:`${enemyNames[i]} подождёт до завтра.`};}
    else if(s.shield===0){
      const lives=s.lives-1;
      return {...s,lives,status:lives===0?'lost':'playing',pos:{...START},dir:'up',queued:'up',meter:0,shield:2.5,enemies:s.enemies.map((e,j)=>({...e,pos:{...e.home},wait:2+j*.7,meter:0})),message:lives===0?'«Ещё пять минут» снова затянулись.':`${enemyNames[i]} отвлёк! Очки сохранены. Возвращайся к тишине.`};
    }
  }
  return s;
}
function moveEnemy(s:State,index:number):Point {
  const e=s.enemies[index];let target=s.pos;
  if(index===1){for(let i=0;i<2;i++){const next=neighbor(target,s.dir);if(walkable(next))target=next;}}
  if(index===2&&s.score>=GOAL)target=BED;
  if(index===3&&Math.floor(s.time/6)%2===0){const next=neighbor(s.pos,'down');if(walkable(next))target=next;}
  const field=distances(s.quiet>0?s.pos:target);
  const choices=directions.map(d=>neighbor(e.pos,d)).filter(walkable);
  choices.sort((a,b)=>{
    const delta=(field.get(key(a))??999)-(field.get(key(b))??999);
    return s.quiet>0?-delta:delta;
  });
  return choices[0]??e.pos;
}
export function step(state:State,dt:number):State {
  if(state.status!=='playing')return state;
  let s=state;let remaining=Math.max(0,Math.min(dt,.25));
  while(remaining>0.000001&&s.status==='playing'){
    const h=Math.min(remaining,.02);remaining-=h;
    const quietEnded=s.quiet>0&&s.quiet<=h;
    s={...s,time:s.time+h,meter:s.meter+h,quiet:Math.max(0,s.quiet-h),shield:Math.max(0,s.shield-h),message:quietEnded?(s.score>=GOAL?'Сон накоплен! Доберись до кровати наверху.':'Тишина закончилась. Осторожно, экраны снова в погоне!'):s.message,enemies:s.enemies.map(e=>({...e,wait:Math.max(0,e.wait-h),meter:e.wait>0?0:e.meter+h}))};
    if(s.meter>=.18){
      s.meter-=.18;
      if(walkable(neighbor(s.pos,s.queued)))s.dir=s.queued;
      const next=neighbor(s.pos,s.dir);if(walkable(next))s.pos=next;
      s=collisions(collect(s));
    }
    const interval=s.quiet>0?.43:s.score>=GOAL?.27:s.score>=300?.30:.34;
    for(let i=0;i<4&&s.status==='playing';i++){
      if(s.enemies[i].wait===0&&s.enemies[i].meter>=interval){
        const pos=moveEnemy(s,i);
        s={...s,enemies:s.enemies.map((e,j)=>j===i?{...e,pos,meter:e.meter-interval}:e)};
        s=collisions(s);
      }
    }
  }
  return s;
}
