import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,tick,fire,free,type RemoteState} from '../src/remote/model.ts';

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
 const s={...initial(),time:39.999,rivals:[{id:0,x:210,y:385,stun:1,cooldown:0}]};
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
