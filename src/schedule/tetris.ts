export const COLS=10,ROWS=16,GOAL=7;
export const shapes=[[[0,1],[1,1],[2,1],[3,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[1,0],[1,1],[2,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]]];
export const names=['Работа','Сон','Готовка','Спорт','Отдых','Дорога','Дом'];
export type Piece={type:number;rotation:number;x:number;y:number};
export type PlanGame={board:number[][];piece:Piece;queue:number[];seed:number;lines:number;score:number;placed:number;skipUsed:boolean;fall:number;lock:number;resets:number;status:'playing'|'won'|'lost';message:string};
export function cells(p:Piece){let points=shapes[p.type].map(([x,y])=>[x,y]);const n=p.type===0?4:3;if(p.type!==1)for(let i=0;i<p.rotation;i++)points=points.map(([x,y])=>[n-1-y,x]);return points.map(([x,y])=>[p.x+x,p.y+y]);}
export function fits(s:Pick<PlanGame,'board'>,p:Piece){return cells(p).every(([x,y])=>x>=0&&x<COLS&&y>=0&&y<ROWS&&s.board[y][x]===0);}
function refill(s:PlanGame){while(s.queue.length<7){const bag=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;const j=s.seed%(i+1);[bag[i],bag[j]]=[bag[j],bag[i]];}s.queue.push(...bag);}return s;}
function spawn(s:PlanGame):PlanGame{const next=refill({...s,queue:[...s.queue]});next.piece={type:next.queue.shift()!,rotation:0,x:3,y:0};next.fall=0;next.lock=0;next.resets=0;return fits(next,next.piece)?next:{...next,status:'lost',message:'В сутках снова не хватило часов.'};}
export function planInitial(seed=Date.now()):PlanGame{return spawn({board:Array.from({length:ROWS},()=>Array(COLS).fill(0)),piece:{type:0,rotation:0,x:3,y:0},queue:[],seed:seed>>>0,lines:0,score:0,placed:0,skipUsed:false,fall:0,lock:0,resets:0,status:'playing',message:'Заполни семь линий. Оставляй меньше дыр в расписании.'});}
export const interval=(s:PlanGame)=>Math.max(.2,.85-s.lines*.065-Math.floor(s.placed/8)*.04);
export function ghost(s:PlanGame){let p=s.piece;while(fits(s,{...p,y:p.y+1}))p={...p,y:p.y+1};return p;}
function settle(s:PlanGame):PlanGame{const board=s.board.map(row=>[...row]);for(const [x,y] of cells(s.piece))board[y][x]=s.piece.type+1;const kept=board.filter(row=>row.some(c=>!c));const count=ROWS-kept.length;const lines=s.lines+count;const next={...s,board:[...Array.from({length:count},()=>Array(COLS).fill(0)),...kept],lines,placed:s.placed+1,score:s.score+[0,100,300,500,800][count],message:count?`Порядок! Линий за раз: ${count}.`:(s.placed+1)%5===0?'Срочный созвон. Конечно, именно сейчас.':'Дело на месте. Следующее уже падает.'};return lines>=GOAL?{...next,status:'won',message:'Неделя собрана. Время для жизни нашлось!'}:spawn(next);}
export type PlanAction='left'|'right'|'rotate'|'down'|'drop'|'skip';
export function planAction(s:PlanGame,a:PlanAction):PlanGame{
 if(s.status!=='playing')return s;
 if(a==='skip')return s.skipUsed?s:spawn({...s,skipUsed:true,message:'Перенесено на завтра. Только один раз!'});
 if(a==='drop'){const piece=ghost(s);return settle({...s,piece,score:s.score+(piece.y-s.piece.y)*2});}
 const candidates=a==='rotate'?[0,-1,1,-2,2].flatMap(dx=>[0,-1].map(dy=>({...s.piece,rotation:(s.piece.rotation+1)%4,x:s.piece.x+dx,y:s.piece.y+dy}))):[{...s.piece,x:s.piece.x+(a==='left'?-1:a==='right'?1:0),y:s.piece.y+(a==='down'?1:0)}];
 const piece=candidates.find(p=>fits(s,p));if(!piece)return s;
 const grounded=!fits(s,{...s.piece,y:s.piece.y+1});const reset=grounded&&s.resets<8;
 return {...s,piece,lock:reset?0:s.lock,resets:s.resets+(reset?1:0),score:s.score+(a==='down'?1:0)};
}
export function planTick(s:PlanGame,dt:number):PlanGame{
 if(s.status!=='playing')return s;const h=Math.max(0,Math.min(.1,dt));let next={...s,fall:s.fall+h};
 if(next.fall>=interval(next)){next.fall-=interval(next);const p={...next.piece,y:next.piece.y+1};if(fits(next,p))next={...next,piece:p};}
 if(!fits(next,{...next.piece,y:next.piece.y+1})){next.lock+=h;if(next.lock>=.45)return settle(next);}else next.lock=0;
 return next;
}
