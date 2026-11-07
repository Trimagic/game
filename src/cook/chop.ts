// Food tumbles onto the board; swipe through it. Vegetables and raw chicken need separate boards.
export type Kind='tomato'|'broccoli'|'chicken';
export type Board='veg'|'meat'|'done';
export const BOARD={left:20,right:400,top:130,bottom:430};
export const NEED:Record<'veg'|'meat',Partial<Record<Kind,number>>>={veg:{tomato:4,broccoli:4},meat:{chicken:4}};
export const RADIUS=34;
export const GRAVITY=70;
export const SWITCH_MS=1300;
export type Piece={id:number;kind:Kind;x:number;y:number;vx:number;vy:number};
export type ChopEvent={type:'cut'|'wrong'|'multi'|'board';x:number;y:number;kind?:Kind;label:string};
export type Chop={rand:number;time:number;board:Board;pieces:Piece[];counts:Record<Kind,number>;nextSpawn:number;serial:number;combo:number;best:number;score:number;mistakes:number;switchMs:number;events:ChopEvent[]};
export const createChop=(seed=1):Chop=>({rand:seed>>>0,time:0,board:'veg',pieces:[],counts:{tomato:0,broccoli:0,chicken:0},nextSpawn:300,serial:0,combo:0,best:0,score:0,mistakes:0,switchMs:0,events:[]});
export const good=(board:Board,kind:Kind)=>board==='veg'?kind!=='chicken':board==='meat'&&kind==='chicken';
export const left=(s:Chop)=>s.board==='done'?[]:(Object.entries(NEED[s.board]) as [Kind,number][]).filter(([k,n])=>s.counts[k]<n);
const boardDone=(s:Chop)=>left(s).length===0;
function spawn(s:Chop,random:()=>number):Piece{
 const need=left(s).map(([k])=>k);
 const wrong:Kind[]=s.board==='veg'?['chicken']:['tomato','broccoli'];
 const pool=random()<.28?wrong:need.length?need:wrong;
 const kind=pool[Math.floor(random()*pool.length)];
 const x=BOARD.left+50+random()*(BOARD.right-BOARD.left-100);
 return {id:s.serial,kind,x,y:BOARD.top-10,vx:(random()-.5)*40,vy:25+random()*30};
}
export function tickChop(state:Chop,delta:number,randomArg?:()=>number):Chop{
 if(state.board==='done')return state;
 // Without an explicit source the board keeps its own seeded sequence, so rounds replay identically.
 let seed=state.rand;const random=randomArg??(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});
 const ms=Math.max(0,Math.min(delta,50)),dt=ms/1000;
 let s:Chop={...state,time:state.time+ms,events:[]};
 if(s.switchMs>0){s.switchMs=Math.max(0,s.switchMs-ms);return s;}
 if(s.time>=s.nextSpawn){const piece=spawn(s,random);s={...s,pieces:[...s.pieces,piece],serial:s.serial+1,nextSpawn:s.time+720+random()*280};}
 s.rand=seed;s.pieces=s.pieces.map(p=>({...p,x:Math.max(BOARD.left+20,Math.min(BOARD.right-20,p.x+p.vx*dt)),y:p.y+p.vy*dt,vy:p.vy+GRAVITY*dt})).filter(p=>p.y<BOARD.bottom+12);
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
  if(good(s.board,p.kind)){
   fine++;s.counts[p.kind]++;s.combo++;s.best=Math.max(s.best,s.combo);s.score+=10;
   s.events.push({type:'cut',x:p.x,y:p.y,kind:p.kind,label:'+10'});
  }else{
   s.mistakes++;s.combo=0;s.score=Math.max(0,s.score-15);
   s.events.push({type:'wrong',x:p.x,y:p.y,kind:p.kind,label:p.kind==='chicken'?'КУРИЦУ — НА ДРУГУЮ ДОСКУ! −15':'ЭТО ДОСКА ДЛЯ КУРИЦЫ! −15'});
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
