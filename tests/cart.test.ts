import {test} from 'node:test';
import assert from 'node:assert/strict';
import {THIEF,aim,cartCost,cartInitial,cartRating,CART_HALF,CART_Y,have,hold,level,LEVELS,missing,tickCart,WIDTH,MEDAL_POINTS,type CartState,type Item} from '../src/shop/cart.ts';
import {goods as products} from '../src/shop/cart.ts';

function rng(seed:number){let a=seed>>>0;return()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296;};}
const drop=(s:CartState,product:number,extra:Partial<Item>={}):CartState=>({...s,items:[...s.items,{id:900+s.items.length,product,x:s.cartX,y:CART_Y-14,sale:false,expired:false,speed:100,...extra}]});
const step=(s:CartState,ms=50)=>tickCart(s,ms,()=>.99);

// A careful player: chase useful items, sidestep bad ones about to land.
function good(s:CartState,item:Item){const p=products[item.product];const lv=level(s);if(item.expired||!(lv.list as readonly string[]).includes(p.key))return false;const owned=have(s,p.key);const price=item.sale?Math.ceil(p.price/2):p.price;const rest=missing(s).filter(k=>k!==p.key).reduce((n,k)=>n+products.find(q=>q.key===k)!.price,0);return owned?price<(owned.price??p.price):cartCost(s)+price+rest<=lv.budget;}
function bot(s:CartState){
 const falling=s.items.filter(i=>i.y<CART_Y-12).sort((a,b)=>b.y-a.y);
 const target=falling.find(i=>good(s,i)&&(CART_Y-i.y)/i.speed*520>=Math.abs(i.x-s.cartX)-CART_HALF+10);
 let x=target?target.x:s.cartX;
 // A thief on the way gets rammed: drive through him at full speed.
 const thief=s.thief;if(thief&&thief.phase==='walk'&&Math.abs(thief.x-s.cartX)<170)x=thief.x+Math.sign(thief.x-s.cartX||1)*200;
 for(const bad of falling.filter(i=>!good(s,i)&&CART_Y-i.y<120))if(Math.abs(bad.x-x)<CART_HALF+20)x=bad.x<WIDTH/2?Math.min(WIDTH-CART_HALF,bad.x+CART_HALF*2+10):Math.max(CART_HALF,bad.x-CART_HALF*2-10);
 return aim(s,x);
}
function play(seed:number,every=1){const random=rng(seed);let s=cartInitial();for(let i=0;i<4000&&s.status==='playing';i++){if(i%every===0)s=bot(s);s=tickCart(s,50,random);}return s;}

test('levels fit their budgets and grow harder',()=>{
 for(const lv of LEVELS){const cost=lv.list.reduce((n,k)=>n+products.find(p=>p.key===k)!.price,0);assert.ok(cost<=lv.budget,lv.name);}
 assert.ok(LEVELS.every(l=>(CART_Y-100)/(l.fall*1.15)>=2.4),'every item stays in the air for a few seconds');
 for(let i=1;i<LEVELS.length;i++){assert.ok(LEVELS[i].fall>LEVELS[i-1].fall);assert.ok(LEVELS[i].list.length>=LEVELS[i-1].list.length);}
});
test('the cart follows the aim and keys, staying on screen',()=>{
 let s=aim(cartInitial(),9999);for(let i=0;i<40;i++)s=step(s);assert.equal(s.cartX,WIDTH-CART_HALF);
 s=hold(s,-1);for(let i=0;i<40;i++)s=step(s);assert.equal(s.cartX,CART_HALF);assert.equal(s.target,null);
});
test('catching listed items scores a streak; decoys, expired and overspending cost a life',()=>{
 let s=step(drop(cartInitial(),0));assert.equal(s.cart.length,1);assert.equal(s.combo,1);assert.equal(s.score,15);
 const decoy=step(drop(s,5));assert.equal(decoy.lives,2);assert.equal(decoy.combo,0);assert.equal(decoy.cart.length,1);
 const old=step(drop(s,1,{expired:true}));assert.equal(old.lives,2);assert.equal(old.cart.length,1);
 const pricey=step(drop(step(drop(s,6)),2));assert.equal(pricey.cart.length,2);assert.equal(pricey.lives,2,'12+11+6 is over 25');
 const off=step({...s,items:[{id:5,product:5,x:s.cartX+CART_HALF+20,y:CART_Y-14,sale:false,expired:false,speed:100}]});assert.equal(off.lives,3);
});
test('a cheaper copy swaps in and duplicates are harmless',()=>{
 let s=step(drop(cartInitial(),0));const dup=step(drop(s,0));assert.equal(dup.cart.length,1);assert.equal(dup.lives,3);
 s=step(drop(s,0,{sale:true}));assert.equal(cartCost(s),6);assert.equal(s.deals,1);assert.equal(s.combo,2);
});
test('finishing a list moves to the next level after a short break; the last list wins with medals',()=>{
 let s=cartInitial();for(const p of [0,1,2])s=step(drop(s,p));
 assert.equal(s.level,1);assert.equal(s.cart.length,0);assert.ok(s.breakMs>0);assert.equal(s.cleared.length,1);
 const items=s.items.length;s=step(s);assert.equal(s.items.length,items);
 s={...s,level:2,breakMs:0,best:12,deals:2};for(const p of [0,1,2,3,4])s=step(drop(s,p));
 assert.equal(s.status,'won');assert.deepEqual(s.medals,['Железная воля','Охотник за скидками','Спринтер','Ловкие руки']);assert.ok(s.score>=4*MEDAL_POINTS);
});
test('running out of time costs a life and extends the level; three slips lose',()=>{
 let s={...cartInitial(),levelTime:LEVELS[0].ms-20};s=step(s);assert.equal(s.lives,2);assert.equal(s.levelTime,LEVELS[0].ms-15_000);
 let lost={...cartInitial(),lives:1};lost=step(drop(lost,7));assert.equal(lost.status,'lost');assert.deepEqual(tickCart(lost,50),lost);
});
test('spawns favour missing items and every level can be finished by a careful player',()=>{
 for(const seed of [1,2,3,5,8,13]){const s=play(seed);assert.equal(s.status,'won',`seed ${seed}: ${s.notice} level ${s.level} lives ${s.lives}`);assert.ok(cartRating(s)>=2,`seed ${seed} score ${s.score}`);}
 assert.ok([2,3,5,8,13].filter(seed=>cartRating(play(seed))===3).length>=3);
 // A player who reacts only once a second rarely earns three stars.
 assert.ok([1,6,8,13].filter(seed=>{const s=play(seed,20);return s.status==='won'&&cartRating(s)===3;}).length<=1,'sloppy play mostly misses three stars');
 assert.ok(missing(cartInitial()).length===3);
});
test('items touching the cart edge are caught; a melon jams the cart',()=>{
 const s=cartInitial();const edge=step(drop(s,0,{x:s.cartX+CART_HALF+10}));assert.equal(edge.cart.length,1,'the edge of the cart catches');
 const melon=products.length-1;const hit=step(drop(s,melon));assert.equal(hit.lives,2);assert.ok(hit.stun>0);const x=hit.cartX;assert.equal(step(aim(hit,x+100)).cartX,x,'jammed for a moment');
});
test('the thief waits for a full cart, steals the last item, and is chased off by a rammed cart',()=>{
 let s:CartState={...cartInitial(),levelTime:THIEF.first[0]-10,nextThief:THIEF.first[0]};s=step(s);assert.equal(s.thief,null,'nothing to steal yet');
 s=step(drop({...s,nextThief:0},0));assert.equal(s.cart.length,1);s=step({...s,nextThief:0});assert.ok(s.thief);assert.equal(s.thief!.phase,'warn');
 let quiet=s;for(let i=0;i<200&&quiet.thief?.phase!=='flee';i++)quiet=step(hold(quiet,0));assert.equal(quiet.cart.length,0,'took the item');assert.equal(quiet.stolen,1);assert.notEqual(quiet.thief!.loot,null);
 let rammed=s;for(let i=0;i<200&&rammed.thief?.phase!=='flee';i++){const t=rammed.thief!;rammed=step(t.phase==='walk'&&Math.abs(t.x-rammed.cartX)<150?aim(rammed,t.x+Math.sign(t.x-rammed.cartX)*300):hold(rammed,0));}
 assert.equal(rammed.cart.length,1,'nothing taken');assert.equal(rammed.shooed,1);
 for(let i=0;i<100&&rammed.thief;i++)rammed=step(rammed);assert.equal(rammed.thief,null);assert.ok(rammed.nextThief>rammed.levelTime);
});
