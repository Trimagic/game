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
export const GOAL = 1000;
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
export const MILK = {x:7,y:6};
export const MILK_TIMES = [15,35];
export const MILK_LIFE = 10;
export const DROWSY = 6;
export const YAWN = 8;
export const PAR = 120;
export const HERO_STEP = .18;
export const TURN_READY = .08;
export const CORNER_GRACE = .09;
export const POPUP_WARN = 1;
export const POPUP_LIFE = 4;
export const SIGHT = 6;
// The night gets worse in four acts, each adding one new problem.
export const STAGES = [
  { from:0, name:'ТИХИЙ ЧАС', interval:.36, news:'' },
  { from:300, name:'ВСПЛЫВАЮЩИЕ ОКНА', interval:.32, news:'Всплывающие окна перекрывают коридоры!' },
  { from:650, name:'АВТОВОСПРОИЗВЕДЕНИЕ', interval:.28, news:'Вернулись две луны! Но теперь экраны ускоряются, заметив тебя в коридоре.' },
  { from:GOAL, name:'СВЕТ ВЫКЛЮЧЕН', interval:.24, news:'Свет выключен! Беги к кровати, в центре ждёт молоко.' },
];
export const stageAt = (score:number) => score>=GOAL?3:score>=STAGES[2].from?2:score>=STAGES[1].from?1:0;
const WAKE = [2,7,12,18];
const homes = [{x:1,y:3},{x:13,y:3},{x:1,y:7},{x:13,y:7}];
export const enemyNames = ['Уведомления','YouTube','Кино','Игры'];
export type Enemy = { pos:Point; home:Point; wait:number; meter:number };
export type Popup = { pos:Point; warn:number; life:number };
export type State = { pos:Point; dir:Direction; queued:Direction; enemies:Enemy[]; dots:string[]; powers:string[]; score:number; lives:number; time:number; meter:number; quiet:number; shield:number; status:'playing'|'won'|'lost'; message:string; caught:number; milk:number; milkIndex:number; drowsy:number; streak:number; lastSpark:number; yawns:number; bonus:number; points:number; popups:Popup[]; nextPopup:number; rand:number; prev:Point|null };
export function initial(seed=1):State {
  const dots:string[]=[],powers:string[]=[];
  MAP.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='.')dots.push(key({x,y}));if(cell==='o')powers.push(key({x,y}));}));
  return {pos:{...START},dir:'up',queued:'up',enemies:homes.map((home,i)=>({pos:{...home},home,wait:WAKE[i],meter:0})),dots,powers,score:0,lives:3,time:0,meter:0,quiet:0,shield:2,status:'playing',message:'Собери сонные искры. Телефон подождёт.',caught:0,milk:0,milkIndex:0,drowsy:0,streak:0,lastSpark:-1,yawns:0,bonus:0,points:0,popups:[],nextPopup:0,rand:seed>>>0,prev:null};
}
/** A pop-up blocks its tile only once its warning has run out. */
export const open = (s:State,p:Point) => walkable(p)&&!s.popups.some(w=>w.warn===0&&same(w.pos,p));
/** Straight corridor with no wall between the screen and the hero. */
export function sees(s:State,e:Enemy) {
  if(stageAt(s.score)<2||s.quiet>0||(e.pos.x!==s.pos.x&&e.pos.y!==s.pos.y))return false;
  const dx=Math.sign(s.pos.x-e.pos.x),dy=Math.sign(s.pos.y-e.pos.y);const far=Math.abs(s.pos.x-e.pos.x)+Math.abs(s.pos.y-e.pos.y);
  if(far>SIGHT)return false;
  for(let i=1;i<far;i++)if(!walkable({x:e.pos.x+dx*i,y:e.pos.y+dy*i}))return false;
  return true;
}
export function enemyInterval(s:State,e:Enemy) {
  const base=s.quiet>0?.43:STAGES[stageAt(s.score)].interval;
  return base*(s.drowsy>0?1.6:1)*(sees(s,e)?.78:1);
}
function spawnPopup(s:State):State {
  let seed=s.rand;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const field=distances(s.pos);const tiles:Point[]=[];
  MAP.forEach((row,y)=>[...row].forEach((cell,x)=>{const t={x,y};if(cell==='.'&&(field.get(key(t))??0)>=3&&!same(t,MILK)&&!s.popups.some(w=>same(w.pos,t))&&!s.enemies.some(e=>same(e.pos,t)))tiles.push(t);}));
  const pos=tiles[Math.floor(random()*tiles.length)];
  const wait=stageAt(s.score)>=2?3.5:5;
  return {...s,rand:seed,nextPopup:s.time+wait,popups:pos?[...s.popups,{pos,warn:POPUP_WARN,life:POPUP_LIFE}]:s.popups};
}
export function distances(target:Point):Map<string,number> {
  const result=new Map<string,number>([[key(target),0]]);const queue=[target];
  for(let i=0;i<queue.length;i++)for(const d of directions){const p=neighbor(queue[i],d);if(walkable(p)&&!result.has(key(p))){result.set(key(p),result.get(key(queue[i]))!+1);queue.push(p);}}
  return result;
}
/** Clock on the wall: one game second is one minute after 23:58. */
export function clock(time:number){const minutes=23*60+58+Math.floor(time);return `${String(Math.floor(minutes/60)%24).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;}
export const timeBonus=(time:number)=>Math.max(0,Math.round((PAR-time)*3));
export const sleepRating=(s:State)=>s.status!=='won'?0:s.lives===3&&s.time<=45?3:s.time<=75||s.lives>=2?2:1;
export function turn(s:State,dir:Direction):State { return s.status==='playing'?{...s,queued:dir}:s; }
function collect(s:State):State {
  const id=key(s.pos);
  if(s.dots.includes(id)){
    // Eating sparks without a gap builds a yawn; every eighth in a row pays a bonus.
    const streak=s.time-s.lastSpark<=.45?s.streak+1:1;const yawn=streak%YAWN===0;
    const before=stageAt(s.score);const score=s.score+10;const after=stageAt(score);
    s={...s,dots:s.dots.filter(k=>k!==id),score,milk:after===3&&before<3?MILK_LIFE:s.milk,streak,...(after===2&&before<2?{powers:[...new Set([...s.powers,...initial().powers.filter(id=>id.endsWith(',13'))])]}:{}),lastSpark:s.time,yawns:s.yawns+(yawn?1:0),bonus:s.bonus+(yawn?30:0),message:after>before?STAGES[after].news:yawn?`Зевок! ${streak} искр подряд · +30`:s.message};
  }
  if(s.milk>0&&same(s.pos,MILK))s={...s,milk:0,drowsy:DROWSY,bonus:s.bonus+50,message:'Тёплое молоко · +50. Экраны тоже клонит в сон!'};
  if(s.powers.includes(id))s={...s,powers:s.powers.filter(k=>k!==id),quiet:7,message:'НЕ БЕСПОКОИТЬ · теперь они бегут от тебя!'};
  if(s.score>=GOAL) {
    if(same(s.pos,BED)){const won={...s,status:'won' as const,message:'Тишина. Наконец-то спим.'};return {...won,points:won.score+won.bonus+timeBonus(won.time)};}
  }
  return s;
}
function collisions(s:State):State {
  if(s.status!=='playing')return s;
  for(let i=0;i<s.enemies.length;i++){
    const enemy=s.enemies[i];
    if(enemy.wait>0||!same(enemy.pos,s.pos))continue;
    if(s.quiet>0){s={...s,enemies:s.enemies.map((e,j)=>j===i?{...e,pos:{...e.home},wait:4,meter:0}:e),caught:s.caught+1,bonus:s.bonus+50,message:`${enemyNames[i]} подождёт до завтра · +50`};}
    else if(s.shield===0){
      const lives=s.lives-1;
      return {...s,lives,streak:0,prev:null,status:lives===0?'lost':'playing',pos:{...START},dir:'up',queued:'up',meter:0,shield:2.5,enemies:s.enemies.map((e,j)=>({...e,pos:{...e.home},wait:2+j*.7,meter:0})),message:lives===0?'«Ещё пять минут» снова затянулись.':`${enemyNames[i]} отвлёк! Очки сохранены. Возвращайся к тишине.`};
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
  const choices=directions.map(d=>neighbor(e.pos,d)).filter(p=>open(s,p));
  // Screens spread out instead of queueing on one tile, so corridors get pinched from both ends.
  const crowd=(p:Point)=>s.quiet===0&&s.enemies.some((o,j)=>j!==index&&same(o.pos,p))?3:0;
  choices.sort((a,b)=>{
    const delta=(field.get(key(a))??999)-(field.get(key(b))??999);
    if(s.quiet===0)return delta+crowd(a)-crowd(b);
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
    s={...s,time:s.time+h,meter:s.meter+h,quiet:Math.max(0,s.quiet-h),shield:Math.max(0,s.shield-h),drowsy:Math.max(0,s.drowsy-h),milk:Math.max(0,s.milk-h),popups:s.popups.map(w=>({...w,warn:Math.max(0,w.warn-h),life:w.warn>0?w.life:w.life-h})).filter(w=>w.life>0),message:quietEnded?(s.score>=GOAL?'Сон накоплен! Доберись до кровати наверху.':'Тишина закончилась. Осторожно, экраны снова в погоне!'):s.message,enemies:s.enemies.map(e=>({...e,wait:Math.max(0,e.wait-h),meter:e.wait>0?0:e.meter+h}))};
    if(s.milkIndex<MILK_TIMES.length&&s.time>=MILK_TIMES[s.milkIndex])s={...s,milkIndex:s.milkIndex+1,milk:MILK_LIFE,message:'В центре остывает тёплое молоко!'};
    if(stageAt(s.score)>=1&&s.time>=s.nextPopup)s=spawnPopup(s);
    if(s.queued!==s.dir){
      const ahead=neighbor(s.pos,s.queued);
      // A new direction is taken right away instead of waiting for the next step.
      if(open(s,ahead)){if(s.meter>=TURN_READY)s={...s,meter:HERO_STEP};}
      // Pressed just after passing a junction: still take that corner.
      else if(s.prev&&s.meter<CORNER_GRACE&&open(s,neighbor(s.prev,s.queued))){
        s={...s,pos:neighbor(s.prev,s.queued),dir:s.queued,prev:null,meter:0};
        s=collisions(collect(s));
      }
    }
    if(s.status==='playing'&&s.meter>=HERO_STEP){
      s={...s,meter:Math.max(0,s.meter-HERO_STEP)};
      if(open(s,neighbor(s.pos,s.queued)))s={...s,dir:s.queued};
      const next=neighbor(s.pos,s.dir);if(open(s,next))s={...s,prev:s.pos,pos:next};
      s=collisions(collect(s));
    }
    for(let i=0;i<4&&s.status==='playing';i++){
      const interval=enemyInterval(s,s.enemies[i]);
      if(s.enemies[i].wait===0&&s.enemies[i].meter>=interval){
        const pos=moveEnemy(s,i);
        s={...s,enemies:s.enemies.map((e,j)=>j===i?{...e,pos,meter:e.meter-interval}:e)};
        s=collisions(s);
      }
    }
  }
  return s;
}
