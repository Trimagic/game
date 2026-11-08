import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BOARD,createChop,edible,good,left,NEED,RADIUS,slice,sliceLowest,SLOW_MS,tickChop,type Chop,type Piece} from '../src/cook/chop.ts';

const piece=(kind:Piece['kind'],x:number,y=250,id=100):Piece=>({id,kind,x,y,vx:0,vy:0});
const stroke=(x:number)=>[{x,y:150},{x,y:400}] as const;

test('a piece stays on the board long enough to aim at',()=>{
 let s=createChop(9);while(!s.pieces.length)s=tickChop(s,16);const id=s.pieces[0].id;let ms=0;while(s.pieces.some(p=>p.id===id)){s=tickChop(s,16);ms+=16;}assert.ok(ms>=2000,String(ms));
});
test('pieces fall onto the board, speed up and leave at the bottom',()=>{
 let s=createChop(5);for(let i=0;i<20;i++)s=tickChop(s,50);
 assert.ok(s.pieces.length>0);const p=s.pieces.find(q=>q.vy>0)!;const later=tickChop(s,50).pieces.find(q=>q.id===p.id)!;
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
 let s:Chop={...createChop(),counts:{tomato:NEED.veg.tomato!,broccoli:NEED.veg.broccoli!-1,chicken:0,cat:0,pepper:0},pieces:[piece('broccoli',150)]};
 s=slice(s,...stroke(150));assert.equal(s.board,'meat');assert.ok(s.switchMs>0);assert.deepEqual(left(s),[['chicken',NEED.meat.chicken!]]);
 const blocked={...s,pieces:[piece('chicken',200)]};assert.equal(sliceLowest(blocked),blocked);
 s={...s,switchMs:0,counts:{...s.counts,chicken:NEED.meat.chicken!-1},pieces:[piece('chicken',200)]};
 s=sliceLowest(s);assert.equal(s.board,'done');assert.deepEqual(tickChop(s,50),s);
 assert.equal(NEED.veg.tomato,20);assert.equal(NEED.veg.broccoli,20);assert.equal(NEED.meat.chicken,20);
});
test('spawns favour what is still needed and include traps',()=>{
 let s=createChop(3);const kinds:string[]=[];
 for(let i=0;i<400;i++){s=tickChop(s,50);for(const p of s.pieces)if(!kinds.includes(p.id+p.kind))kinds.push(p.id+p.kind);}
 const all=kinds.map(k=>k.replace(/^\d+/,''));
 assert.ok(all.includes('chicken'));assert.ok(all.filter(k=>k!=='chicken').length>all.filter(k=>k==='chicken').length);
});

test('rotten vegetables, the cat and the golden pepper',()=>{
 const rotten={...piece('tomato',100,250,1),rotten:true};assert.equal(edible('veg',rotten),false);assert.equal(good('veg','tomato'),true);
 let s=slice({...createChop(),pieces:[rotten]},...stroke(100));assert.equal(s.counts.tomato,0);assert.equal(s.mistakes,1);assert.ok(s.events[0].label.includes('ГНИЛОЙ'));
 s=slice({...createChop(),score:50,pieces:[piece('cat',200,250,2)]},...stroke(200));assert.equal(s.cats,1);assert.equal(s.score,20);assert.equal(s.events[0].type,'cat');
 s=slice({...createChop(),pieces:[piece('pepper',300,250,3)]},...stroke(300));assert.equal(s.slow,SLOW_MS);assert.equal(s.golds,1);
 // Slow motion: the same piece falls less far.
 const fall=(c:Chop)=>tickChop({...c,pieces:[{...piece('tomato',200,200,9),vy:60}],nextSpawn:1e9},50).pieces[0].y;
 assert.ok(fall({...createChop(),slow:SLOW_MS})-200<fall(createChop())-200);
});
test('traps are common, the cat arcs in from a side, some food is tossed up from below',()=>{
 let s=createChop(4);const seen=new Map<number,Piece>();
 for(let i=0;i<1200;i++){s=tickChop(s,50);for(const p of s.pieces)if(!seen.has(p.id))seen.set(p.id,p);}
 const all=[...seen.values()];const bad=all.filter(p=>!edible('veg',p));
 assert.ok(bad.length/all.length>.4,String(bad.length/all.length));
 const cats=all.filter(p=>p.kind==='cat');assert.ok(cats.length>0&&cats.every(c=>c.vy<0&&Math.abs(c.vx)>100));
 assert.ok(all.some(p=>p.kind==='pepper'));assert.ok(all.some(p=>p.rotten));assert.ok(all.some(p=>p.kind!=='cat'&&p.vy<0),'tossed');
});
