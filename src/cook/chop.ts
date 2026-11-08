// Food tumbles onto the board; swipe through it. Vegetables and raw chicken need separate boards.
export type Kind='tomato'|'broccoli'|'chicken'|'cat'|'pepper';
export type Board='veg'|'meat'|'done';
export const BOARD={left:20,right:400,top:130,bottom:430};
export const NEED:Record<'veg'|'meat',Partial<Record<Kind,number>>>={veg:{tomato:20,broccoli:20},meat:{chicken:20}};
export const RADIUS=34;
export const GRAVITY=70;
export const SWITCH_MS=1300;
// Traps: the wrong board's food, rotten vegetables and the cat; a golden pepper slows time down.
export const WRONG_SHARE=.38,CAT_SHARE=.07,ROTTEN_SHARE=.2,TOSS_SHARE=.3,BURST_SHARE=.25;
export const SLOW_MS=4000,SLOW_FACTOR=.45,GOLD_EVERY=14000;
export type Piece={id:number;kind:Kind;x:number;y:number;vx:number;vy:number;rotten?:boolean};
export type ChopEvent={type:'cut'|'wrong'|'multi'|'board'|'cat'|'gold';x:number;y:number;kind?:Kind;label:string};
export type Chop={rand:number;time:number;board:Board;pieces:Piece[];counts:Record<Kind,number>;nextSpawn:number;serial:number;combo:number;best:number;score:number;mistakes:number;switchMs:number;events:ChopEvent[];slow:number;nextGold:number;cats:number;golds:number};
export const createChop=(seed=1):Chop=>({rand:seed>>>0,time:0,board:'veg',pieces:[],counts:{tomato:0,broccoli:0,chicken:0,cat:0,pepper:0},nextSpawn:300,serial:0,combo:0,best:0,score:0,mistakes:0,switchMs:0,events:[],slow:0,nextGold:9000,cats:0,golds:0});
export const good=(board:Board,kind:Kind)=>board==='veg'?kind==='tomato'||kind==='broccoli':board==='meat'&&kind==='chicken';
/** Safe to cut: the right food for this board, and not rotten. */
export const edible=(board:Board,p:Piece)=>good(board,p.kind)&&!p.rotten;
export const left=(s:Chop)=>s.board==='done'?[]:(Object.entries(NEED[s.board]) as [Kind,number][]).filter(([k,n])=>s.counts[k]<n);
const boardDone=(s:Chop)=>left(s).length===0;
function spawn(s:Chop,random:()=>number,id:number):Piece{
 const need=left(s).map(([k])=>k);
 const wrong:Kind[]=s.board==='veg'?['chicken']:['tomato','broccoli'];
 const roll=random();
 // The cat jumps on from a side and arcs across the board.
 if(roll<CAT_SHARE){const fromLeft=random()<.5;return {id,kind:'cat',x:fromLeft?BOARD.left+30:BOARD.right-30,y:BOARD.bottom-10,vx:(fromLeft?1:-1)*(110+random()*40),vy:-(165+random()*30)};}
 if(s.time>=s.nextGold)return {id,kind:'pepper',x:BOARD.left+80+random()*(BOARD.right-BOARD.left-160),y:BOARD.top-10,vx:(random()-.5)*30,vy:30};
 const pool=roll<CAT_SHARE+WRONG_SHARE?wrong:need.length?need:wrong;
 const kind=pool[Math.floor(random()*pool.length)];
 const rotten=pool===need&&s.time>4000&&random()<ROTTEN_SHARE;
 const x=BOARD.left+50+random()*(BOARD.right-BOARD.left-100);
 // Some food is tossed up from below and falls back down.
 if(random()<TOSS_SHARE)return {id,kind,x,y:BOARD.bottom-12,vx:(random()-.5)*50,vy:-(150+random()*40),rotten};
 return {id,kind,x,y:BOARD.top-10,vx:(random()-.5)*40,vy:25+random()*30,rotten};
}
export function tickChop(state:Chop,delta:number,randomArg?:()=>number):Chop{
 if(state.board==='done')return state;
 // Without an explicit source the board keeps its own seeded sequence, so rounds replay identically.
 let seed=state.rand;const random=randomArg??(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});
 const ms=Math.max(0,Math.min(delta,50));
 let s:Chop={...state,time:state.time+ms,events:[],slow:Math.max(0,state.slow-ms)};
 if(s.switchMs>0){s.switchMs=Math.max(0,s.switchMs-ms);return s;}
 if(s.time>=s.nextSpawn){
  const count=random()<BURST_SHARE?2:1;const fresh:Piece[]=[];let serial=s.serial,nextGold=s.nextGold;
  for(let i=0;i<count;i++){const p=spawn({...s,nextGold},random,serial++);if(p.kind==='pepper')nextGold=s.time+GOLD_EVERY;fresh.push(p);}
  s={...s,pieces:[...s.pieces,...fresh],serial,nextGold,nextSpawn:s.time+560+random()*240};
 }
 const dt=ms/1000*(s.slow>0?SLOW_FACTOR:1);
 s.rand=seed;s.pieces=s.pieces.map(p=>({...p,x:Math.max(BOARD.left+20,Math.min(BOARD.right-20,p.x+p.vx*dt)),y:p.y+p.vy*dt,vy:p.vy+GRAVITY*dt})).filter(p=>p.y<BOARD.bottom+12||p.vy<0);
 return s;
}
/** Distance from a point to the swipe segment. */
function reach(p:{x:number;y:number},a:{x:number;y:number},b:{x:number;y:number}){
 const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;const t=len?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len)):0;
 return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
}
export function slice(state:Chop,from:{x:number;y:number},to:{x:number;y:number}):Chop{
 if(state.board==='done'||state.switchMs>0)return state;
 const hit=state.pieces.filter(p=>reach(p,from,to)<=RADIUS);
 if(!hit.length)return state;
 let s:Chop={...state,pieces:state.pieces.filter(p=>!hit.includes(p)),counts:{...state.counts},events:[...state.events]};
 let fine=0;
 for(const p of hit){
  if(p.kind==='cat'){s.mistakes++;s.cats++;s.combo=0;s.score=Math.max(0,s.score-30);s.events.push({type:'cat',x:p.x,y:p.y,kind:p.kind,label:'МЯУ! КОТА НЕ РЕЖЕМ! −30'});continue;}
  if(p.kind==='pepper'){s.golds++;s.slow=SLOW_MS;s.score+=30;s.events.push({type:'gold',x:p.x,y:p.y,kind:p.kind,label:'ЗОЛОТОЙ ПЕРЕЦ! ЗАМЕДЛЕНИЕ +30'});continue;}
  if(edible(s.board,p)){
   fine++;s.counts[p.kind]++;s.combo++;s.best=Math.max(s.best,s.combo);s.score+=10;
   s.events.push({type:'cut',x:p.x,y:p.y,kind:p.kind,label:'+10'});
  }else{
   s.mistakes++;s.combo=0;s.score=Math.max(0,s.score-15);
   s.events.push({type:'wrong',x:p.x,y:p.y,kind:p.kind,label:p.rotten?'ГНИЛОЙ! В МУСОР! −15':p.kind==='chicken'?'КУРИЦУ — НА ДРУГУЮ ДОСКУ! −15':'ЭТО ДОСКА ДЛЯ КУРИЦЫ! −15'});
  }
 }
 // Slicing several pieces in one stroke pays extra.
 if(fine>=2){const bonus=(fine-1)*5;s.score+=bonus;s.events.push({type:'multi',x:to.x,y:to.y,label:`${fine} ЗА РАЗ! +${bonus}`});}
 if(boardDone(s)){
  if(s.board==='veg')s={...s,board:'meat',pieces:[],switchMs:SWITCH_MS,nextSpawn:s.time+SWITCH_MS+200,events:[...s.events,{type:'board',x:210,y:280,label:'Овощи готовы! Отдельная доска для курицы'}]};
  else s={...s,board:'done',pieces:[],events:[...s.events,{type:'board',x:210,y:280,label:'Нарезка готова!'}]};
 }
 return s;
}
/** Keyboard and button fallback: slice straight down through the lowest piece. */
export function sliceLowest(s:Chop):Chop{
 const low=[...s.pieces].sort((a,b)=>b.y-a.y)[0];
 return low?slice(s,{x:low.x,y:low.y-40},{x:low.x,y:low.y+40}):s;
}
