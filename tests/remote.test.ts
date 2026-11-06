import {test} from 'node:test';
import assert from 'node:assert/strict';
import {awake,END,free,fire,initial,MAX_NUTS,NUT_RANGE,nutTarget,phaseAt,remoteRating,tick,totalScore,type Point,type RemoteState} from '../src/remote/model.ts';

test('Getting caught stops the round and a fresh attempt resets the timer',()=>{
 let s=initial();
 for(let i=0;i<450;i++)s=tick(s,.1,{x:0,y:0});
 assert.equal(s.status,'lost');
 assert.ok(s.time<40);
 assert.equal(s.ending,0);
 assert.equal(tick(s,.1,{x:1,y:0}),s);
 assert.equal(fire(s),s);
 assert.equal(initial().time,0);
 assert.equal(initial().status,'playing');
});
test('Only surviving the full timer triggers the story ending',()=>{
  let s:RemoteState={...initial(),rivals:[]};
  for(let i=0;i<450;i++)s=tick(s,.1,{x:0,y:0});
  assert.equal(s.status,'done');
  assert.equal(s.time,40);
  assert.equal(tick(s,.1,{x:1,y:1}),s);
  assert.equal(fire(s),s);
});
test('Stunned rivals cannot catch the hero; a last-moment catch is still a loss',()=>{
 const s={...initial(),lives:1,time:39.999,rivals:[{id:0,x:210,y:385,stun:1,cooldown:0}]};
 assert.equal(tick(s,.01,{x:0,y:0}).status,'ending');
 assert.equal(tick({...s,rivals:[{...s.rivals[0],stun:0}]},.01,{x:0,y:0}).status,'lost');
});
test('Movement respects sofas and room walls and diagonal speed is normalized',()=>{
 let s:RemoteState={...initial(),hero:{x:210,y:345},rivals:[]};
 for(let i=0;i<20;i++)s=tick(s,.1,{x:0,y:-1});
 assert.ok(s.hero.y>=336);assert.ok(free(s.hero));
 const start={...initial(),rivals:[]};
 const diagonal=tick(start,.1,{x:1,y:1}),straight=tick(start,.1,{x:1,y:0});
 assert.ok(Math.abs(Math.hypot(diagonal.hero.x-210,diagonal.hero.y-385)-(straight.hero.x-210))<.001);
 for(let i=0;i<100;i++)s=tick(s,.1,{x:1,y:1});
 assert.ok(free(s.hero));
});
test('Aimed nuts stun a rival, and cooldown prevents repeated instant shots',()=>{
 let s=fire({...initial(),rivals:[{id:0,x:270,y:385,stun:0,cooldown:1}]});
 assert.equal(s.nuts.length,1);assert.equal(fire(s),s);
 for(let i=0;i<3;i++)s=tick(s,.1,{x:0,y:0});
 assert.equal(s.hits,1);assert.ok(s.rivals[0].stun>0);
});

const lone=(extra:Partial<RemoteState>={}):RemoteState=>({...initial(),rivals:[],nextItem:999,nextCart:999,...extra});
test('Being caught costs a heart, gives a moment of safety and stuns the catcher',()=>{
 const start=lone({rivals:[{id:0,x:210,y:385,stun:0,cooldown:0}]});
 const s=tick(start,.02,{x:0,y:0});assert.equal(s.lives,2);assert.ok(s.safe>0);assert.ok(s.rivals[0].stun>0);assert.equal(s.status,'playing');
 assert.equal(tick({...start,rivals:[{...start.rivals[0],stun:0}],lives:1},.02,{x:0,y:0}).status,'lost');
 const saved=tick({...start,pillow:true},.02,{x:0,y:0});assert.equal(saved.lives,3);assert.equal(saved.pillow,false);
});
test('Nuts are limited, only fly at someone in range, and bowls refill them',()=>{
 const near=[{id:0,x:270,y:385,stun:0,cooldown:0}];
 assert.equal(fire(lone({ammo:0,rivals:near})).nuts.length,0);
 const none=lone({ammo:3,rivals:[{id:0,x:210+NUT_RANGE+40,y:385,stun:0,cooldown:0}]});assert.equal(fire(none),none);
 const thrown=fire(lone({ammo:3,rivals:near}));assert.equal(thrown.ammo,2);assert.ok(nutTarget(lone({rivals:near})));
 const bowl=tick(lone({ammo:MAX_NUTS-1,items:[{id:1,kind:'bowl',x:210,y:385,life:5}]}),.02,{x:0,y:0});assert.equal(bowl.ammo,MAX_NUTS);assert.equal(bowl.items.length,0);assert.ok(bowl.score>0);
 const old=tick(lone({items:[{id:1,kind:'bowl',x:60,y:130,life:.01}]}),.05,{x:0,y:0});assert.equal(old.items.length,0);
});
test('Slippers speed the hero up for a while; a pillow can be picked up',()=>{
 const plain=tick(lone(),.1,{x:1,y:0}).hero.x-210;
 const fast=tick(lone({items:[{id:1,kind:'slippers',x:210,y:385,life:5}]}),.02,{x:0,y:0});assert.ok(fast.boost>0);
 assert.ok(tick(fast,.1,{x:1,y:0}).hero.x-fast.hero.x>plain);
 assert.equal(tick(lone({items:[{id:1,kind:'pillow',x:210,y:385,life:5}]}),.02,{x:0,y:0}).pillow,true);
});
test('The stick is analog: a small push walks slower than a full one',()=>{
 const slow=tick(lone(),.1,{x:.4,y:0}).hero.x-210,full=tick(lone(),.1,{x:1,y:0}).hero.x-210;
 assert.ok(slow>0&&slow<full*.6);
});
test('Neighbours wake by phase and the sprinter warns before dashing',()=>{
 const s=initial();assert.equal(awake(s,s.rivals[2]),false);assert.equal(awake({time:10},s.rivals[2]),true);
 const asleep=tick(s,.5,{x:0,y:0});assert.deepEqual([asleep.rivals[2].x,asleep.rivals[2].y],[45,400]);assert.deepEqual([0,10,20,30].map(phaseAt),[0,1,2,3]);
 let r:RemoteState={...s,time:12,safe:99,rivals:[{...s.rivals[1],x:60,y:400,cooldown:0}],nextItem:999,nextCart:999};
 r=tick(r,.02,{x:0,y:0});assert.equal(r.rivals[0].mode,'wind');const x=r.rivals[0].x;
 for(let i=0;i<3;i++)r=tick(r,.1,{x:0,y:0});assert.equal(r.rivals[0].x,x,'stands still while winding up');
 for(let i=0;i<6;i++)r=tick(r,.1,{x:0,y:0});assert.ok(r.rivals[0].x>x+40,'then covers ground fast');
});
test('The lunch cart warns, then stuns the hero and scores when it hits a neighbour',()=>{
 const cart={y:385,x:190,dir:1,warn:0};
 const hit=tick(lone({cart}),.02,{x:0,y:0});assert.ok(hit.stun>0);assert.equal(hit.lives,3);
 const warned=tick(lone({cart:{...cart,warn:1},hero:{x:190,y:385}}),.02,{x:0,y:0});assert.equal(warned.stun,0);
 const bonk=tick(lone({hero:{x:60,y:120},cart:{y:400,x:300,dir:1,warn:0},rivals:[{id:0,x:310,y:400,stun:0,cooldown:0}]}),.02,{x:0,y:0});assert.ok(bonk.rivals[0].stun>0);assert.equal(bonk.cartHits,1);assert.equal(bonk.score,30);
 let s=initial(3);s={...s,time:19.98,safe:99,rivals:[]};s=tick(s,.05,{x:0,y:0});assert.ok(s.cart&&s.cart.warn>0);
});
// A careful player: moves to the safest of sixteen directions, takes nearby finds and throws when threatened.
function plan(s:RemoteState):Point{
 const threats=s.rivals.filter(e=>e.stun===0&&awake(s,e));let best={x:0,y:0},value=-Infinity;
 for(let i=0;i<16;i++){const dir={x:Math.cos(i*Math.PI/8),y:Math.sin(i*Math.PI/8)};const p={x:s.hero.x+dir.x*40,y:s.hero.y+dir.y*40};if(!free(p))continue;
  let v=Math.min(130,...threats.map(e=>Math.hypot(e.x-p.x,e.y-p.y)-(e.mode==='wind'||e.mode==='dash'?60:0)))*1.6;
  if(s.cart&&Math.abs(s.cart.y-p.y)<46)v-=120;
  const item=s.items.map(it=>Math.hypot(it.x-p.x,it.y-p.y)).sort((a,b)=>a-b)[0];if(item!==undefined)v-=item*(s.ammo<3?.45:.2);
  v-=Math.hypot(p.x-210,p.y-265)*.22;
  if(v>value){value=v;best=dir;}
 }
 return best;
}
function night(seed:number){let s=initial(seed);for(let i=0;i<3000&&s.status==='playing';i++){if(nutTarget(s)&&Math.hypot(nutTarget(s)!.x-s.hero.x,nutTarget(s)!.y-s.hero.y)<90)s=fire(s);s=tick(s,1/30,plan(s));}return s;}
test('A careful player keeps the remote to the end on most evenings; standing still does not',()=>{
 const runs=[1,2,3,4,5,6,7,8,9,10].map(night);const kept=runs.filter(s=>s.status==='ending');
 assert.ok(kept.length>=6,runs.map(s=>s.status+s.time.toFixed(0)).join());
 let idle=initial(1);for(let i=0;i<450;i++)idle=tick(idle,.1,{x:0,y:0});assert.equal(idle.status,'lost');assert.ok(idle.time<END);
 assert.ok(kept.every(s=>remoteRating(s)>=1));
});
test('rating follows hearts and points; a lost evening earns none',()=>{const end=(lives:number,score:number):RemoteState=>({...initial(),status:'ending',lives,score});assert.equal(remoteRating(end(3,400)),3);assert.equal(remoteRating(end(2,400)),3);assert.equal(remoteRating(end(2,100)),2);assert.equal(remoteRating(end(1,100)),1);assert.equal(remoteRating({...initial(),status:'lost'}),0);});
