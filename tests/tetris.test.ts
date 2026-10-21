import {test} from 'node:test';
import assert from 'node:assert/strict';
import {COLS,ROWS,cells,fits,ghost,planAction,planInitial,planTick,interval} from '../src/schedule/tetris.ts';
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
test('four simultaneous lines clear, score correctly and complete the seventh line',()=>{
 const board=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>y>=12&&x!==9?2:0));
 const s={...planInitial(9),board,lines:3,piece:{type:0,rotation:1,x:7,y:0}};const result=planAction(s,'drop');assert.equal(result.lines,7);assert.equal(result.status,'won');assert.ok(result.board.every(r=>r.every(c=>c===0)));assert.ok(result.score>=800);assert.equal(planAction(result,'drop'),result);assert.equal(planTick(result,.1),result);
});
test('tomorrow replaces current piece once, and blocked spawn loses',()=>{
 const s=planInitial(22),next=planAction(s,'skip');assert.equal(next.piece.type,s.queue[0]);assert.equal(next.skipUsed,true);assert.equal(next.placed,0);assert.equal(planAction(next,'skip'),next);
 const lost=planAction({...s,board:Array.from({length:ROWS},()=>Array(COLS).fill(1))},'skip');assert.equal(lost.status,'lost');assert.equal(planAction(lost,'left'),lost);
});
test('gravity and lock delay work without input; repeated adjustments have a finite reset budget',()=>{
 let s=planInitial(4);const start=s.piece.y;for(let i=0;i<10;i++)s=planTick(s,.1);assert.ok(s.piece.y>start);
 s={...s,piece:ghost(s),lock:0};for(let i=0;i<4;i++)s=planTick(s,.1);assert.equal(s.placed,0);s=planTick(s,.1);assert.equal(s.placed,1);
 assert.ok(interval({...s,lines:6,placed:30})<interval(planInitial(4)));
});
test('a complete seeded week can be built using only legal moves and drops',()=>{
 let s=planInitial(42);
 for(let turn=0;turn<100&&s.status==='playing';turn++){
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
 assert.equal(s.status,'won');assert.ok(s.lines>=7);
});
