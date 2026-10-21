import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,locations,walkable,guards,sees,tick,nextLocation,type DeliveryState,type Direction} from '../src/delivery/model.ts';
const idle=(s:DeliveryState,seconds:number)=>{for(let i=0;i<seconds*10;i++)s=tick(s,.1,null);return s;};
test('Patrol routes and endpoints are on floor; guards never cross walls',()=>{
 for(const map of locations){
  assert.equal(map.rows.length,11);assert.ok(map.rows.every(r=>r.length===11));
  assert.ok(walkable(map,map.start));assert.ok(walkable(map,map.exit));
  for(const p of map.patrols)for(let i=0;i<p.route.length;i++){
   const a=p.route[i],b=p.route[(i+1)%p.route.length];
   assert.ok(walkable(map,a));assert.equal(Math.abs(a.x-b.x)+Math.abs(a.y-b.y),1);
  }
 }
});
test('Sight is directional and obstacles block it',()=>{
 const map=locations[0],g={x:1,y:1,facing:{x:1,y:0}};
 assert.ok(sees(map,g,{x:3,y:1}));
 assert.equal(sees(map,g,{x:1,y:3}),false);
 assert.equal(sees(map,{x:3,y:1,facing:{x:0,y:1}},{x:3,y:3}),false);
});
test('Being caught is terminal, resets on retry, and cannot advance to the next room',()=>{
 const g=guards(locations[0],0)[0];
 const s=tick({...initial(),hero:{x:g.x,y:g.y}},.025,null);
 assert.equal(s.status,'lost');assert.equal(idle(s,5),s);assert.equal(nextLocation(s),s);
 assert.equal(initial().level,0);assert.equal(initial().suspicion,0);
});
test('Suspicion decays behind cover and movement cannot pass through walls',()=>{
 const s=tick({...initial(),suspicion:.5},.1,'left');
 assert.deepEqual(s.hero,initial().hero);assert.ok(s.suspicion<.5);
});
test('Room transitions freeze patrols, and only the last exit leads to the story',()=>{
 let s=tick({...initial(),hero:locations[0].exit},.025,null);
 assert.equal(s.status,'between');assert.equal(idle(s,10),s);
 s=nextLocation(s);assert.equal(s.level,1);assert.equal(s.time,0);
 s=tick({...s,level:2,hero:locations[2].exit},.025,null);
 assert.equal(s.status,'ending');s=idle(s,4);assert.equal(s.status,'done');assert.equal(idle(s,5),s);
});
// Search real input sequences in 200 ms steps. For each time and cell keep the
// least suspicious route; no teleporting or disabled guards in this check.
test('All three locations have a playable route with patrols and detection enabled',()=>{
 for(let level=0;level<locations.length;level++){
  let frontier:DeliveryState[]=[{...initial(),level,hero:locations[level].start}];
  let reached=false;
  for(let t=0;t<180&&!reached;t++){
   const next=new Map<string,DeliveryState>();
   for(const state of frontier)for(const input of [null,'up','right','down','left'] as (Direction|null)[]){
    const s=tick(tick(state,.1,input),.1,input);
    if(s.status==='between'||s.status==='ending'){reached=true;break;}
    if(s.status!=='playing')continue;
    const key=`${s.hero.x},${s.hero.y},${Math.round(s.cooldown*1000)}`;
    if(!next.has(key)||next.get(key)!.suspicion>s.suspicion)next.set(key,s);
   }
   frontier=[...next.values()];
  }
  assert.ok(reached,`location ${level+1} has no safe route`);
 }
});
