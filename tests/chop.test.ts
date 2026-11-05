import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOARD,createChop,good,left,NEED,RADIUS,slice,sliceLowest,tickChop,type Chop,type Piece} from '../src/cook/chop.ts';

const piece=(kind:Piece['kind'],x:number,y=250,id=100):Piece=>({id,kind,x,y,vx:0,vy:0});
const stroke=(x:number)=>[{x,y:150},{x,y:400}] as const;

test('pieces fall onto the board, speed up and leave at the bottom',()=>{
 let s=createChop(5);for(let i=0;i<20;i++)s=tickChop(s,50);
 assert.ok(s.pieces.length>0);const p=s.pieces[0];const later=tickChop(s,50).pieces.find(q=>q.id===p.id)!;
 assert.ok(later.y>p.y&&later.vy>p.vy);assert.ok(later.x>=BOARD.left&&later.x<=BOARD.right);
 for(let i=0;i<200;i++)s=tickChop(s,50);assert.ok(s.pieces.every(q=>q.y<BOARD.bottom+12));
 assert.deepEqual(tickChop(createChop(9),400),tickChop(createChop(9),400));
});
test('a swipe cuts what it crosses; chicken on the vegetable board is a mistake',()=>{
 let s:Chop={...createChop(),pieces:[piece('tomato',100,250,1),piece('chicken',300,250,2)]};
 const [a,b]=stroke(100);s=slice(s,a,b);assert.equal(s.counts.tomato,1);assert.equal(s.score,10);assert.equal(s.pieces.length,1);
 const [c,d]=stroke(300+RADIUS+5);assert.equal(slice(s,c,d),s);
 s=slice(s,...stroke(300));assert.equal(s.mistakes,1);assert.equal(s.combo,0);assert.equal(s.counts.chicken,0);
 assert.ok(s.events.some(e=>e.type==='wrong'));assert.equal(good('meat','tomato'),false);
});
test('one stroke through several pieces pays a bonus',()=>{
 const s=slice({...createChop(),pieces:[piece('tomato',100,200,1),piece('broccoli',200,200,2),piece('tomato',300,200,3)]},{x:60,y:200},{x:360,y:200});
 assert.equal(s.counts.tomato,2);assert.equal(s.counts.broccoli,1);assert.equal(s.score,30+10);assert.ok(s.events.some(e=>e.type==='multi'));
});
test('finishing vegetables switches to the chicken board, then chopping ends',()=>{
 let s:Chop={...createChop(),counts:{tomato:4,broccoli:3,chicken:0},pieces:[piece('broccoli',150)]};
 s=slice(s,...stroke(150));assert.equal(s.board,'meat');assert.ok(s.switchMs>0);assert.deepEqual(left(s),[['chicken',4]]);
 const blocked={...s,pieces:[piece('chicken',200)]};assert.equal(sliceLowest(blocked),blocked);
 s={...s,switchMs:0,counts:{...s.counts,chicken:3},pieces:[piece('chicken',200)]};
 s=sliceLowest(s);assert.equal(s.board,'done');assert.deepEqual(tickChop(s,50),s);
 assert.equal(NEED.veg.tomato,4);
});
test('spawns favour what is still needed and include traps',()=>{
 let s=createChop(3);const kinds:string[]=[];
 for(let i=0;i<400;i++){s=tickChop(s,50);for(const p of s.pieces)if(!kinds.includes(p.id+p.kind))kinds.push(p.id+p.kind);}
 const all=kinds.map(k=>k.replace(/^\d+/,''));
 assert.ok(all.includes('chicken'));assert.ok(all.filter(k=>k!=='chicken').length>all.filter(k=>k==='chicken').length);
});
