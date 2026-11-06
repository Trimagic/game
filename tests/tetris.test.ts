import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cells,COLS,dayOf,DEADLINE,fits,ghost,GOAL,GUEST,interval,MAX_STAMPS,planAction,planInitial,planRating,planTick,ROWS,STAMP,type PlanGame} from '../src/schedule/tetris.ts';

const empty=()=>Array.from({length:ROWS},()=>Array(COLS).fill(0));
/** A board whose bottom row misses only columns 3 to 6, with the given cell values. */
function nearLine(s:PlanGame,fill:number[]):PlanGame{const board=empty();board[ROWS-1]=Array.from({length:COLS},(_,x)=>x>=3&&x<=6?0:fill[x%fill.length]);return {...s,board,piece:{type:0,rotation:0,x:3,y:0}};}
const score=(s:PlanGame,board:number[][])=>{let holes=0,height=0,bump=0,prev=-1;for(let x=0;x<COLS;x++){let top=board.length;for(let y=0;y<board.length;y++)if(board[y][x]){top=y;break;}const h=board.length-top;height+=h;if(prev>=0)bump+=Math.abs(h-prev);prev=h;for(let y=top;y<board.length;y++)if(!board[y][x])holes++;}return height*.5+holes*4+bump*.4;};
// Tries every rotation and column for the current piece and drops the best one.
function bestDrop(s:PlanGame){
 let best=s.piece,value=Infinity;
 for(let rotation=0;rotation<4;rotation++)for(let x=-2;x<COLS;x++){
  const p={...s.piece,rotation,x,y:0};if(!fits(s,p))continue;
  const g=ghost({...s,piece:p});const board=s.board.map(r=>[...r]);for(const [cx,cy] of cells(g))board[cy][cx]=1;
  const clear=board.filter(r=>r.every(Boolean)).length;const v=score(s,board.filter(r=>r.some(c=>!c)))-clear*6;
  if(v<value){value=v;best=p;}
 }
 return best;
}
function week(seed:number,every=1){let s=planInitial(seed);for(let i=0;i<500&&s.status==='playing';i++){const random=i%every===0;s=planAction({...s,piece:random?bestDrop(s):{...s.piece}},'drop');}return s;}

test('a sensible player finishes the week on most seeds, and it takes a real number of pieces',()=>{
 const runs=[1,2,3,4,5,6,7,8,9,10].map(n=>week(n));const wins=runs.filter(s=>s.status==='won');
 assert.ok(wins.length>=8,runs.map(s=>s.status+s.lines).join());
 assert.ok(wins.every(s=>s.lines>=GOAL&&s.placed>=15),wins.map(s=>s.placed).join());
 assert.ok(wins.every(s=>planRating(s)>=2));assert.ok(wins.filter(s=>planRating(s)===3).length>=5);
});
test('careless play loses before the week ends',()=>{
 const runs=[1,2,3,4,5].map(n=>week(n,4));assert.ok(runs.filter(s=>s.status==='lost').length>=3,runs.map(s=>s.status+s.lines).join());
});
test('each cleared line closes a day and days announce themselves',()=>{
 assert.deepEqual([0,1,2,3,4,5,6,7,8,9,10,11,12].map(dayOf),[0,1,2,2,3,3,4,4,5,5,6,6,6]);
 const s=planAction(nearLine(planInitial(1),[1]),'drop');assert.equal(s.lines,1);assert.match(s.message,/Вторник/);assert.equal(s.flash,'ВТОРНИК');
});
test('a varied line pays a balance bonus and a stamp; a line with rest slows the pace',()=>{
 const start={...planInitial(1),lines:1};
 const varied=planAction(nearLine(start,[3,4,6,7,1]),'drop');assert.equal(varied.balanced,1);assert.equal(varied.stamps,1);assert.equal(varied.slow,0);
 const dull=planAction(nearLine(start,[3]),'drop');assert.equal(dull.balanced,0);assert.equal(dull.stamps,0);
 const rested=planAction(nearLine(start,[5]),'drop');assert.equal(rested.slow,6);assert.equal(rested.rested,1);
 assert.ok(interval(rested)>interval({...rested,slow:0}));
});
test('calls from Wednesday are flagged and fall much faster',()=>{
 const calm=planAction(nearLine({...planInitial(1),lines:1,placed:3},[3]),'drop');assert.equal(calm.urgent,true,'fifth piece on day three');
 assert.ok(interval(calm)<interval({...calm,urgent:false})*.5);
 const early=planAction({...planInitial(1),placed:3},'drop');assert.equal(early.urgent,false,'not before Wednesday');
});
test('deadlines rise from Thursday, with one gap in the row',()=>{
 const s=planAction({...planInitial(1),lines:4,placed:5},'drop');
 const bottom=s.board[ROWS-1];assert.equal(bottom.filter(c=>c===DEADLINE).length,COLS-1);assert.equal(bottom.filter(c=>c===0).length,1);assert.equal(s.flash,'ДЕДЛАЙН!');
 const before=planAction({...planInitial(1),lines:3,placed:5},'drop');assert.ok(!before.board[ROWS-1].includes(DEADLINE));
 const full=planInitial(1);const crowded=empty();crowded[0][0]=1;
 assert.equal(planAction({...full,lines:4,placed:5,board:crowded,piece:{type:1,rotation:0,x:6,y:0}},'drop').status,'lost');
});
test('guests sit on the stack from Saturday; a Friday brings a free stamp',()=>{
 const s=planAction({...planInitial(2),lines:8,placed:4},'drop');assert.ok(s.board.flat().filter(c=>c===GUEST).length>=1);assert.equal(s.flash,'ГОСТИ!');
 const friday=planAction(nearLine({...planInitial(1),lines:5},[3]),'drop');assert.equal(friday.stamps,1);assert.match(friday.message,/Пятница/);
});
test('the stamp erases around its landing, returns the task and is limited',()=>{
 const start=planInitial(1);assert.equal(planAction(start,'stamp'),start);
 const board=empty();for(let y=ROWS-3;y<ROWS;y++)for(let x=0;x<COLS;x++)if(x!==9)board[y][x]=3;
 const armed=planAction({...start,board,stamps:1},'stamp');assert.equal(armed.piece.type,STAMP);assert.equal(armed.stamps,0);assert.equal(armed.queue[0],start.piece.type);
 assert.equal(planAction(armed,'stamp'),armed);assert.equal(planAction(armed,'hold'),armed);
 const done=planAction(armed,'drop');assert.equal(done.piece.type,start.piece.type);assert.ok(done.board.flat().filter(Boolean).length<board.flat().filter(Boolean).length);
 assert.ok(MAX_STAMPS>=2);
});
test('hold moves a task to tomorrow once per piece and can be taken back',()=>{
 let s=planInitial(1);const first=s.piece.type,second=s.queue[0];
 s=planAction(s,'hold');assert.equal(s.hold,first);assert.equal(s.piece.type,second);assert.equal(planAction(s,'hold'),s);
 s=planAction(s,'drop');assert.equal(s.held,false);const third=s.piece.type;
 s=planAction(s,'hold');assert.equal(s.piece.type,first);assert.equal(s.hold,third);
});
test('ticks still drop and lock pieces; a finished game stays finished',()=>{
 let s=planInitial(1);const y=s.piece.y;for(let i=0;i<12;i++)s=planTick(s,.1);assert.ok(s.piece.y>y);
 let t=planInitial(1);const placed=t.placed;for(let i=0;i<400&&t.placed===placed;i++)t=planTick(t,.1);assert.equal(t.placed,placed+1);
 const won={...planInitial(1),status:'won' as const};assert.equal(planAction(won,'drop'),won);assert.equal(planTick(won,.1),won);assert.equal(planRating(planInitial(1)),0);
});

test('rating needs points and balanced lines, and a loss earns none',()=>{
 const won=(score:number,balanced:number)=>({...planInitial(1),status:'won' as const,score,balanced});
 assert.equal(planRating(won(3200,6)),3);assert.equal(planRating(won(3200,2)),2);assert.equal(planRating(won(2100,1)),2);assert.equal(planRating(won(1200,0)),1);
});
test('seeded seven-bag contains all shapes and yields reproducible pieces',()=>{
 const a=planInitial(42),b=planInitial(42);assert.deepEqual(a,b);assert.equal(new Set([a.piece.type,...a.queue.slice(0,6)]).size,7);assert.ok(fits(a,a.piece));
});
test('walls, floor and occupied cells reject illegal motion and ghost matches hard drop',()=>{
 let s=planInitial(7);for(let i=0;i<20;i++)s=planAction(s,'left');assert.ok(cells(s.piece).every(([x])=>x>=0));assert.equal(planAction(s,'left'),s);
 const landing=ghost(s),dropped=planAction(s,'drop');for(const [x,y] of cells(landing))assert.equal(dropped.board[y][x],s.piece.type+1);assert.equal(dropped.placed,1);assert.equal(dropped.board.length,ROWS);assert.ok(dropped.board.every(r=>r.length===COLS));
});
test('rotation kicks work at wall; blocked rotation leaves board and piece unchanged',()=>{
 let s={...planInitial(1),piece:{type:0,rotation:1,x:-2,y:3}};assert.ok(fits(s,s.piece));const turned=planAction(s,'rotate');assert.equal(turned.piece.rotation,2);assert.ok(fits(turned,turned.piece));
 const board=Array.from({length:ROWS},()=>Array(COLS).fill(1));for(const [x,y] of cells(s.piece))board[y][x]=0;s={...s,board};assert.equal(planAction(s,'rotate'),s);
});
test('four simultaneous lines clear, score correctly and can finish the week',()=>{
 const board=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>y>=12&&x!==9?2:0));
 const s={...planInitial(9),board,lines:GOAL-4,piece:{type:0,rotation:1,x:7,y:0}};const result=planAction(s,'drop');assert.equal(result.lines,GOAL);assert.equal(result.status,'won');assert.ok(result.board.every(r=>r.every(c=>c===0)));assert.ok(result.score>=800);assert.equal(planAction(result,'drop'),result);assert.equal(planTick(result,.1),result);
});
test('a blocked spawn loses and a lost game takes no more moves',()=>{
 const s=planInitial(22);const lost=planAction({...s,board:Array.from({length:ROWS},()=>Array(COLS).fill(1))},'hold');assert.equal(lost.status,'lost');assert.equal(planAction(lost,'left'),lost);
});
test('gravity and lock delay work without input; repeated adjustments have a finite reset budget',()=>{
 let s=planInitial(4);const start=s.piece.y;for(let i=0;i<10;i++)s=planTick(s,.1);assert.ok(s.piece.y>start);
 s={...s,piece:ghost(s),lock:0};for(let i=0;i<4;i++)s=planTick(s,.1);assert.equal(s.placed,0);s=planTick(s,.1);assert.equal(s.placed,1);
 assert.ok(interval({...s,lines:6,placed:30})<interval(planInitial(4)));
 let g={...planInitial(4)};g={...g,piece:ghost(g),lock:.3};for(let i=0;i<8;i++)g=planAction(g,i%2?'left':'right');assert.equal(g.lock,0);assert.equal(g.resets,8);g={...g,lock:.3};assert.equal(planAction(g,'right').lock,.3);
});
test('a complete seeded week can be built using only legal moves and drops',()=>{
 let s=planInitial(42);
 for(let turn=0;turn<200&&s.status==='playing';turn++){
  let best:typeof s|undefined,bestCost=Infinity;
  for(let rotation=0;rotation<4;rotation++)for(let column=0;column<COLS;column++){
   let candidate=s;for(let r=0;r<rotation;r++)candidate=planAction(candidate,'rotate');
   for(let x=0;x<COLS;x++)candidate=planAction(candidate,'left');for(let x=0;x<column;x++)candidate=planAction(candidate,'right');
   candidate=planAction(candidate,'drop');if(candidate.status==='lost')continue;
   const heights=Array.from({length:COLS},(_,x)=>{const y=candidate.board.findIndex(row=>row[x]);return y<0?0:ROWS-y;});
   let holes=0;for(let x=0;x<COLS;x++)for(let y=ROWS-heights[x];y<ROWS;y++)if(!candidate.board[y][x])holes++;
   const cost=holes*12+heights.reduce((a,b)=>a+b,0)*.5+heights.slice(1).reduce((a,h,i)=>a+Math.abs(h-heights[i]),0)*.4-(candidate.lines-s.lines)*8;
   if(cost<bestCost){bestCost=cost;best=candidate;}
  }
  assert.ok(best,'A legal placement must remain');s=best;
 }
 assert.equal(s.status,'won');assert.ok(s.lines>=GOAL);
});
