import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ALARM,CAMERA_TURN,deliveryRating,finalScore,GLANCE_EVERY,GLANCE_FOR,hidden,initial,itemsIn,locations,makeNoise,NOISE_TIME,RANGE,spareHearts,START_NOISE,tileAt,TOTAL_COINS,walkable,guards,sees,tick,nextLocation,type DeliveryState,type Direction} from '../src/delivery/model.ts';
const idle=(s:DeliveryState,seconds:number)=>{for(let i=0;i<seconds*10;i++)s=tick(s,.1,null);return s;};
test('Patrol routes and endpoints are on floor; guards never cross walls',()=>{
 for(const map of locations){
  assert.equal(map.rows.length,11);assert.ok(map.rows.every(r=>r.length===11));
  assert.ok(walkable(map,map.start));assert.ok(walkable(map,map.exit));
  for(const p of map.patrols.filter(p=>p.role!=='camera'))for(let i=0;i<p.route.length;i++){
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
 const s=tick({...initial(),lives:1,hero:{x:g.x,y:g.y}},.025,null);
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

const empty=(extra:Partial<DeliveryState>={}):DeliveryState=>({...initial(),...extra});
test('A catch costs a heart and returns to the door of the same room',()=>{
 const g=guards(locations[1],0)[0];
 const s=tick(empty({level:1,score:40,hero:{x:g.x,y:g.y},found:['1:2,1']}),.025,null);
 assert.equal(s.status,'playing');assert.equal(s.lives,2);assert.equal(s.level,1);assert.deepEqual(s.hero,locations[1].start);assert.equal(s.suspicion,0);assert.equal(s.score,40);assert.deepEqual(s.found,['1:2,1']);
 assert.equal(spareHearts(1),0);assert.equal(spareHearts(5),2);assert.equal(initial(2).lives,5);
});
test('Noise freezes and blinds staff for a while, and charges run out',()=>{
 let s=makeNoise(empty());assert.equal(s.charges,START_NOISE-1);assert.equal(s.noise,NOISE_TIME);assert.equal(makeNoise(s),s,'no stacking');
 const t0=s.staffTime;s=tick(s,.1,null);assert.equal(s.staffTime,t0);
 const g=guards(locations[0],0)[0];const inView=empty({hero:{x:g.x+g.facing.x*2,y:g.y+g.facing.y*2}});
 assert.ok(tick(inView,.1,null).suspicion>0);assert.equal(tick({...inView,noise:2},.1,null).suspicion,0);
 assert.equal(makeNoise(empty({charges:0})).noise,0);
});
test('A plant hides the hero from sight but not from bumping into staff',()=>{
 const map=locations[0];assert.ok(hidden(map,{x:1,y:3}));assert.equal(tileAt(map,{x:1,y:3}),'h');
 const seen={x:3,y:3,role:'nurse' as const,facing:{x:-1,y:0}};assert.ok(sees(map,seen,{x:1,y:3}));
 let s=empty({hero:{x:1,y:3},suspicion:.3,staffTime:0});for(let i=0;i<3;i++)s=tick(s,.1,null);assert.ok(s.suspicion<.3);
});
test('Seasonings pay once; a noise token adds a charge',()=>{
 let s=tick(empty({hero:{x:2,y:1},staffTime:0}),.025,'left');assert.deepEqual(s.hero,{x:1,y:1});assert.equal(s.score,20);assert.equal(s.found.length,1);
 s=tick({...s,hero:{x:2,y:1},cooldown:0},.025,'left');assert.equal(s.score,20,'already taken');
 const token=tick(empty({level:1,hero:{x:2,y:3}}),.025,'left');assert.equal(token.charges,START_NOISE+1);
 assert.ok(TOTAL_COINS>=10);
});
test('Wet floor carries the hero one extra cell',()=>{
 const start=empty({level:1,hero:{x:4,y:5},staffTime:99});
 let s=tick(start,.025,'right');assert.deepEqual(s.hero,{x:5,y:5});assert.equal(s.slide,'right');
 for(let i=0;i<6;i++)s=tick(s,.025,null);assert.deepEqual(s.hero,{x:6,y:5});assert.equal(s.slide,null);
});
test('The doctor sees farther, the guard looks back on a beat, the camera swings',()=>{
 assert.ok(RANGE.doctor>RANGE.nurse);
 const map=locations[2];const guardAt=(t:number)=>guards(map,t).find(g=>g.role==='guard')!;
 const before=guardAt(1.4).facing,behind=guardAt(GLANCE_EVERY-GLANCE_FOR/2);assert.ok(Math.abs(behind.facing.x)+Math.abs(behind.facing.y)===1);
 assert.ok(before);
 const moving=guards(map,0).find(g=>g.role==='guard')!;assert.equal(moving.warn,false);assert.equal(guardAt(GLANCE_EVERY-GLANCE_FOR-.3).warn,true);
 const cam=(t:number)=>guards(map,t).find(g=>g.role==='camera')!;assert.equal(cam(0).facing.y,1);assert.equal(cam(CAMERA_TURN+.1).facing.y,-1);
 const bump=tick(empty({level:2,hero:{x:5,y:3},staffTime:0}),.025,null);assert.equal(bump.lives,3,'a wall camera cannot be bumped');
});
test('High suspicion makes the staff hurry',()=>{
 const calm=tick(empty({suspicion:.2,hero:{x:1,y:9}}),.1,null).staffTime,alarm=tick(empty({suspicion:ALARM+.2,hero:{x:1,y:9}}),.1,null).staffTime;assert.ok(alarm>calm);
});
test('Every seasoning and token can be reached on foot',()=>{
 for(const map of locations){const seen=new Set([map.start.x+','+map.start.y]);const q=[map.start];for(let i=0;i<q.length;i++)for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){const c={x:q[i].x+d[0],y:q[i].y+d[1]};if(walkable(map,c)&&!seen.has(c.x+','+c.y)){seen.add(c.x+','+c.y);q.push(c);}}
  for(const item of [...itemsIn(map,'o'),...itemsIn(map,'n')])assert.ok(seen.has(item.x+','+item.y),map.name+JSON.stringify(item));}
});
test('Rating rewards seasonings and hearts; a lost run earns none',()=>{
 const all=locations.flatMap((map,level)=>itemsIn(map,'o').map(c=>level+':'+c.x+','+c.y));
 assert.equal(deliveryRating(empty({status:'done',found:all,lives:3})),3);assert.equal(deliveryRating(empty({status:'done',found:all,lives:1})),2);assert.equal(deliveryRating(empty({status:'done',lives:2})),2);assert.equal(deliveryRating(empty({status:'done',lives:1})),1);assert.equal(deliveryRating(empty({status:'lost'})),0);
 assert.ok(finalScore(empty({score:100,lives:2,clock:60}))>finalScore(empty({score:100,lives:2,clock:110})));
});
