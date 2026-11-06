export const COLS=10,ROWS=16,GOAL=12,MAX_STAMPS=2,STAMP=7,DEADLINE=9,GUEST=10;
export const shapes=[[[0,1],[1,1],[2,1],[3,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[1,0],[1,1],[2,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]],[[1,0]]];
export const names=['Работа','Сон','Готовка','Спорт','Отдых','Дорога','Дом','Отмена'];
// Monday and Tuesday take one line each, later days two; each day brings its own trouble.
export const DAYS=[
 {name:'Понедельник',news:'Понедельник. Пока всё по плану.'},
 {name:'Вторник',news:'Вторник. Планы набирают скорость.'},
 {name:'Среда',news:'Среда: каждое пятое дело — срочный созвон, он падает втрое быстрее!'},
 {name:'Четверг',news:'Четверг: дедлайны подступают снизу!'},
 {name:'Пятница',news:'Пятница! В подарок одна отмена встречи.'},
 {name:'Суббота',news:'Суббота: без приглашения приходят гости!'},
 {name:'Воскресенье',news:'Воскресенье: последний рывок, всё падает быстрее.'},
];
export const dayOf=(lines:number)=>lines<2?lines:Math.min(DAYS.length-1,2+Math.floor((lines-2)/2));
export type Piece={type:number;rotation:number;x:number;y:number};
export type PlanGame={board:number[][];piece:Piece;queue:number[];seed:number;lines:number;score:number;placed:number;hold:number|null;held:boolean;stamps:number;slow:number;urgent:boolean;balanced:number;rested:number;fall:number;lock:number;resets:number;status:'playing'|'won'|'lost';message:string;news:number;flash:string};
export function cells(p:Piece){let points=shapes[p.type].map(([x,y])=>[x,y]);const n=p.type===0?4:3;if(p.type!==1&&p.type!==STAMP)for(let i=0;i<p.rotation;i++)points=points.map(([x,y])=>[n-1-y,x]);return points.map(([x,y])=>[p.x+x,p.y+y]);}
export function fits(s:Pick<PlanGame,'board'>,p:Piece){return cells(p).every(([x,y])=>x>=0&&x<COLS&&y>=0&&y<ROWS&&s.board[y][x]===0);}
function next(s:PlanGame){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed;}
function refill(s:PlanGame){while(s.queue.length<7){const bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){const j=next(s)%(i+1);[bag[i],bag[j]]=[bag[j],bag[i]];}s.queue.push(...bag);}return s;}
const place=(type:number):Piece=>({type,rotation:0,x:3,y:0});
function start(s:PlanGame,piece:Piece,urgent:boolean):PlanGame{const n={...s,piece,urgent,fall:0,lock:0,resets:0};return fits(n,piece)?n:{...n,status:'lost',message:'В сутках снова не хватило часов.'};}
function spawn(s:PlanGame):PlanGame{const n=refill({...s,queue:[...s.queue]});const type=n.queue.shift()!;return start({...n,held:false},place(type),dayOf(n.lines)>=2&&(n.placed+1)%5===0);}
export function planInitial(seed=Date.now()):PlanGame{return spawn({board:Array.from({length:ROWS},()=>Array(COLS).fill(0)),piece:place(0),queue:[],seed:seed>>>0,lines:0,score:0,placed:0,hold:null,held:false,stamps:0,slow:0,urgent:false,balanced:0,rested:0,fall:0,lock:0,resets:0,status:'playing',message:DAYS[0].news,news:0,flash:''});}
export const interval=(s:PlanGame)=>Math.max(.1,Math.max(.2,.85-s.lines*.04-Math.floor(s.placed/10)*.03)*(dayOf(s.lines)===6?.8:1)*(s.urgent?.34:1)*(s.slow>0?1.8:1));
export function ghost(s:PlanGame){let p=s.piece;while(fits(s,{...p,y:p.y+1}))p={...p,y:p.y+1};return p;}
const say=(s:PlanGame,flash:string):PlanGame=>({...s,flash,news:s.news+1});
/** Deadlines push the whole week up by one row, leaving a single gap to work with. */
function rise(s:PlanGame):PlanGame{
 const gap=next(s)%COLS;const row=Array.from({length:COLS},(_,x)=>x===gap?0:DEADLINE);
 if(s.board[0].some(Boolean))return {...s,status:'lost',message:'Дедлайны поджали всю неделю.'};
 return say({...s,board:[...s.board.slice(1).map(r=>[...r]),row],message:'Дедлайн! Неделя сжалась на строку.'},'ДЕДЛАЙН!');
}
/** Guests settle on top of two random columns. */
function guests(s:PlanGame):PlanGame{
 const board=s.board.map(r=>[...r]);
 for(let i=0;i<2;i++){const x=next(s)%COLS;let y=0;while(y<ROWS&&!board[y][x])y++;if(y>2)board[y-1][x]=GUEST;}
 return say({...s,board,message:'Гости без приглашения. Кто-то уже сел на два дела.'},'ГОСТИ!');
}
function settle(s:PlanGame):PlanGame{
 const board=s.board.map(row=>[...row]);
 if(s.piece.type===STAMP){
  // The stamp strikes out everything within one cell of where it lands.
  const [[cx,cy]]=cells(s.piece);let erased=0;
  for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)if(y>=0&&y<ROWS&&x>=0&&x<COLS&&board[y][x]){board[y][x]=0;erased++;}
  return spawn(say({...s,board,placed:s.placed+1,score:s.score+erased*10,message:`Встреча отменена! Освободилось ${erased} кл.`},'ОТМЕНЕНО!'));
 }
 for(const [x,y] of cells(s.piece))board[y][x]=s.piece.type+1;
 const full=board.filter(row=>row.every(Boolean)),kept=board.filter(row=>row.some(c=>!c));
 const count=full.length,lines=s.lines+count;
 const balance=full.filter(row=>new Set(row.filter(c=>c>=1&&c<=7)).size>=5).length;
 const rest=full.some(row=>row.some(c=>c===2||c===5));
 let n:PlanGame={...s,board:[...Array.from({length:count},()=>Array(COLS).fill(0)),...kept],lines,placed:s.placed+1,score:s.score+[0,100,300,500,800][count]+balance*150,balanced:s.balanced+balance,rested:s.rested+(rest?1:0),slow:rest?6:s.slow,stamps:Math.min(MAX_STAMPS,s.stamps+(balance||count>=2?1:0)),message:count?`Порядок! Линий за раз: ${count}.`:'Дело на месте. Следующее уже падает.'};
 if(lines>=GOAL)return {...n,status:'won',message:'Неделя собрана. Время для жизни нашлось!'};
 const before=dayOf(s.lines),day=dayOf(lines);
 if(day>before){n={...say(n,`${DAYS[day].name.toUpperCase()}`),message:DAYS[day].news};if(day===4)n={...n,stamps:Math.min(MAX_STAMPS,n.stamps+1)};}
 else if(balance)n=say({...n,message:'Баланс! В линии пять разных дел: +150 и отмена встречи.'},'БАЛАНС!');
 else if(rest)n=say({...n,message:'Линия с отдыхом: шесть секунд дела падают медленнее.'},'ПЕРЕДЫШКА');
 if(count===0&&day>=3&&n.placed%6===0)n=rise(n);
 if(n.status==='playing'&&count===0&&day>=5&&n.placed%5===0)n=guests(n);
 return n.status==='playing'?spawn(n):n;
}
export type PlanAction='left'|'right'|'rotate'|'down'|'drop'|'hold'|'stamp';
export function planAction(s:PlanGame,a:PlanAction):PlanGame{
 if(s.status!=='playing')return s;
 if(a==='hold'){
  if(s.held||s.piece.type===STAMP)return s;
  // Hand the current task to tomorrow; if one is waiting there, take it back.
  if(s.hold===null)return {...spawn({...s,hold:s.piece.type,message:'Перенесено на завтра. Заберёшь, когда будет удобно.'}),held:true};
  return start({...s,hold:s.piece.type,held:true,message:'Вернул дело из «завтра».'},place(s.hold),false);
 }
 if(a==='stamp'){
  if(s.stamps===0||s.piece.type===STAMP)return s;
  return start({...s,stamps:s.stamps-1,queue:[s.piece.type,...s.queue],message:'Штамп «Отменить»: сотрёт всё рядом с местом падения.'},place(STAMP),false);
 }
 if(a==='drop'){const piece=ghost(s);return settle({...s,piece,score:s.score+(piece.y-s.piece.y)*2});}
 const candidates=a==='rotate'?[0,-1,1,-2,2].flatMap(dx=>[0,-1].map(dy=>({...s.piece,rotation:(s.piece.rotation+1)%4,x:s.piece.x+dx,y:s.piece.y+dy}))):[{...s.piece,x:s.piece.x+(a==='left'?-1:a==='right'?1:0),y:s.piece.y+(a==='down'?1:0)}];
 const piece=candidates.find(p=>fits(s,p));if(!piece)return s;
 const grounded=!fits(s,{...s.piece,y:s.piece.y+1});const reset=grounded&&s.resets<8;
 return {...s,piece,lock:reset?0:s.lock,resets:s.resets+(reset?1:0),score:s.score+(a==='down'?1:0)};
}
export function planTick(s:PlanGame,dt:number):PlanGame{
 if(s.status!=='playing')return s;const h=Math.max(0,Math.min(.1,dt));let n={...s,fall:s.fall+h,slow:Math.max(0,s.slow-h)};
 if(n.fall>=interval(n)){n.fall-=interval(n);const p={...n.piece,y:n.piece.y+1};if(fits(n,p))n={...n,piece:p};}
 if(!fits(n,{...n.piece,y:n.piece.y+1})){n.lock+=h;if(n.lock>=.45)return settle(n);}else n.lock=0;
 return n;
}
export const planRating=(s:PlanGame)=>s.status!=='won'?0:s.score>=3000&&s.balanced>=5?3:s.score>=2000?2:1;
