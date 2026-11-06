import { test } from 'node:test';
import assert from 'node:assert/strict';
import { type Direction, BED, directions, distances, GOAL, initial, key, MAP, neighbor, same, START, step, turn, walkable, type State } from '../src/sleep/model.ts';

test('all corridors, powers and bed are reachable; enough points exist',()=>{
  assert.ok(MAP.every(r=>r.length===15));
  const field=distances(START);assert.equal(field.size,MAP.join('').replaceAll('#','').length);
  assert.ok(field.has(key(BED)));const s=initial();assert.ok(s.dots.length*10>=650);assert.equal(s.powers.length,4);
});
test('buffered turn waits for a junction and walls are impassable',()=>{
  let s=turn(initial(),'left');s=step(s,.19);
  assert.deepEqual(s.pos,{x:7,y:12});assert.equal(s.queued,'left');
  s=step(s,.18);assert.deepEqual(s.pos,{x:7,y:11});
  s=step(s,.18);assert.deepEqual(s.pos,{x:6,y:11});
  for(let i=0;i<100;i++)s=step(s,.18);
  assert.ok(walkable(s.pos));
});
test('dots score once; collecting the goal alone does not win',()=>{
  let s=step(initial(),.19);assert.equal(s.score,10);assert.equal(s.dots.includes('7,12'),false);
  s=turn(s,'down');s=step(s,.18);s=turn(s,'up');s=step(s,.18);assert.equal(s.score,10);
  s={...s,score:GOAL};s=step(s,.18);assert.equal(s.status,'playing');
});
test('bed needs enough points and victory is terminal',()=>{
  let s:State={...initial(),pos:{x:7,y:2},dir:'up',queued:'up'};
  assert.equal(step(s,.19).status,'playing');
  s=step({...s,score:GOAL},.19);assert.equal(s.status,'won');assert.deepEqual(step(s,.25),s);
});
test('collision preserves points, resets actors, and third distraction loses',()=>{
  const base=initial();
  const setup=(lives:number):State=>({...base,lives,score:200,shield:0,enemies:base.enemies.map((e,i)=>i===0?{...e,pos:{x:7,y:12},wait:0}:e)});
  const hit=step(setup(3),.19);assert.equal(hit.lives,2);assert.equal(hit.score,210);assert.ok(same(hit.pos,START));assert.ok(hit.shield>0);
  assert.equal(step(setup(1),.19).status,'lost');
});
test('moon grants quiet mode, repels enemies, and sends a touched screen away',()=>{
  let s:State={...initial(),pos:{x:2,y:13},dir:'left',queued:'left',shield:0};s=step(s,.19);assert.ok(s.quiet>6);assert.equal(s.powers.includes('1,13'),false);
  s={...s,pos:START,dir:'up',queued:'up',meter:0,enemies:s.enemies.map((e,i)=>i===0?{...e,pos:{x:7,y:12},wait:0,meter:0}:e)};
  s=step(s,.19);assert.equal(s.lives,3);assert.equal(s.caught,1);assert.ok(s.enemies[0].wait>3);
});
test('enemy release is staggered and chase never crosses walls',()=>{
  let s=initial();assert.deepEqual(s.enemies.map(e=>e.wait),[2,7,12,18]);
  for(let i=0;i<120;i++){s=step({...s,shield:1},.25);assert.ok(s.enemies.every(e=>walkable(e.pos)));}
});
test('quiet mode expires with an honest status message',()=>{
  const s=step({...initial(),quiet:.01,message:'НЕ БЕСПОКОИТЬ'},.02);
  assert.equal(s.quiet,0);assert.match(s.message,/Тишина закончилась/);
});
test('a complete collection route can reach the bed without missing pellets',()=>{
  let s=initial();
  // Isolate route/collection from combat, which is covered by collision tests.
  for(let i=0;i<1500&&s.status==='playing';i++){
    const field=distances(s.pos);
    const target=s.score>=GOAL?BED:s.dots.map(id=>{const[x,y]=id.split(',').map(Number);return{x,y};}).sort((a,b)=>field.get(key(a))!-field.get(key(b))!)[0];
    const targetField=distances(target);
    const d=directions.filter(d=>walkable(neighbor(s.pos,d))).sort((a,b)=>targetField.get(key(neighbor(s.pos,a)))!-targetField.get(key(neighbor(s.pos,b)))!)[0];
    s=step(turn({...s,shield:10},d),.18);
  }
  assert.equal(s.status,'won');assert.ok(s.score>=GOAL);
});

import { clock, MILK, MILK_TIMES, MILK_LIFE, DROWSY, YAWN, PAR, timeBonus, sleepRating } from '../src/sleep/model.ts';
test('night clock starts at 23:58 and wraps past midnight',()=>{
  assert.equal(clock(0),'23:58');assert.equal(clock(2),'00:00');assert.equal(clock(45.9),'00:43');
});
test('eating sparks without a gap builds a yawn bonus that a hit resets',()=>{
  let s:State={...initial(),pos:{x:1,y:11},dir:'right',queued:'right',shield:10,enemies:initial().enemies.map(e=>({...e,wait:99}))};const start=s.score;for(let i=0;i<YAWN;i++)s=step(s,.18);
  assert.equal(s.score-start,YAWN*10);assert.equal(s.yawns,1);assert.equal(s.bonus,30);s=step({...s,lastSpark:s.time-1},.18);assert.equal(s.streak,1);
  const base=initial();const hit=step({...base,streak:5,shield:0,enemies:base.enemies.map((e,i)=>i===0?{...e,pos:{x:7,y:12},wait:0}:e)},.19);assert.equal(hit.streak,0);
});
test('warm milk appears on schedule, slows screens and expires',()=>{
  let s=step({...initial(),time:MILK_TIMES[0]-.01},.02);assert.equal(s.milk>MILK_LIFE-.1,true);assert.ok(walkable(MILK));
  const drink=step({...s,pos:{x:MILK.x,y:MILK.y+1},dir:'up',queued:'up',meter:0},.19);assert.ok(same(drink.pos,MILK));assert.equal(drink.milk,0);assert.ok(drink.drowsy>DROWSY-.3);assert.equal(drink.bonus-s.bonus,50);
  let gone=s;for(let i=0;i<60;i++)gone=step({...gone,pos:START,shield:10},.2);assert.equal(gone.milk,0);
  // Drowsy screens step less often than alert ones.
  const awake={...initial(),shield:10,enemies:initial().enemies.map(e=>({...e,wait:0}))};
  let a:State=awake,d:State={...awake,drowsy:10};let movesA=0,movesD=0;
  for(let i=0;i<20;i++){const na=step(a,.1),nd=step(d,.1);movesA+=na.enemies.filter((e,j)=>!same(e.pos,a.enemies[j].pos)).length;movesD+=nd.enemies.filter((e,j)=>!same(e.pos,d.enemies[j].pos)).length;a={...na,pos:START};d={...nd,pos:START};}
  assert.ok(movesD<movesA);
});
test('catching a screen in quiet mode and an early bedtime both pay; rating rewards a fast clean night',()=>{
  const base=initial();const caught=step({...base,quiet:5,enemies:base.enemies.map((e,i)=>i===0?{...e,pos:{x:7,y:12},wait:0}:e)},.19);assert.equal(caught.bonus,50);
  const won=step({...base,pos:{x:7,y:2},dir:'up',queued:'up',score:GOAL,bonus:100,time:30},.19);
  assert.equal(won.status,'won');assert.equal(won.points,GOAL+100+timeBonus(won.time));assert.equal(timeBonus(PAR+5),0);
  assert.equal(sleepRating(won),3);assert.equal(sleepRating({...won,lives:2,time:70}),2);assert.equal(sleepRating({...won,lives:1,time:90}),1);assert.equal(sleepRating(base),0);
});

import { enemyInterval, HERO_STEP, open, POPUP_LIFE, POPUP_WARN, sees, STAGES, stageAt } from '../src/sleep/model.ts';
const awake=(s:State,pos:{x:number;y:number}):State=>({...s,enemies:s.enemies.map((e,i)=>i===0?{...e,pos,wait:0}:{...e,wait:99})});
test('four stages escalate with score and the hero always stays faster',()=>{
  assert.deepEqual([0,299,300,650,999,GOAL].map(stageAt),[0,0,1,2,2,3]);
  for(let i=1;i<STAGES.length;i++)assert.ok(STAGES[i].interval<STAGES[i-1].interval);
  const s=awake({...initial(),score:GOAL,pos:{x:5,y:11}},{x:3,y:11});assert.ok(sees(s,s.enemies[0]));
  assert.ok(enemyInterval(s,s.enemies[0])>HERO_STEP);
});
test('screens only notice the hero in a clear straight corridor from stage three',()=>{
  const base=initial();const pos={x:5,y:11};
  assert.equal(sees(awake({...base,score:300,pos},{x:3,y:11}),{...base.enemies[0],pos:{x:3,y:11}}),false);
  const late={...base,score:650,pos};
  assert.equal(sees(late,{...base.enemies[0],pos:{x:3,y:11}}),true);
  assert.equal(sees(late,{...base.enemies[0],pos:{x:12,y:11}}),false,'too far');
  assert.equal(sees({...late,pos:{x:1,y:5}},{...base.enemies[0],pos:{x:1,y:3}}),true);
  assert.equal(sees({...late,pos:{x:3,y:5}},{...base.enemies[0],pos:{x:3,y:3}}),false,'wall between');
});
test('pop-ups warn first, block for a while, then vanish, and never appear next to the hero',()=>{
  let s:State={...initial(7),score:300,shield:99,enemies:initial().enemies.map(e=>({...e,wait:99}))};
  s=step(s,.02);assert.equal(s.popups.length,1);const w=s.popups[0];assert.ok(w.warn>0);assert.ok(open(s,w.pos));
  assert.ok(Math.abs(w.pos.x-s.pos.x)+Math.abs(w.pos.y-s.pos.y)>=2);
  let t=s;for(let ms=0;ms<POPUP_WARN*1000+40;ms+=20)t=step({...t,nextPopup:999},.02);
  assert.equal(open(t,w.pos),false);
  for(let ms=0;ms<POPUP_LIFE*1000+40;ms+=20)t=step({...t,nextPopup:999},.02);
  assert.equal(t.popups.length,0);assert.equal(open(t,w.pos),true);
  const blocked:State={...initial(),pos:{x:1,y:11},dir:'right',queued:'right',enemies:initial().enemies.map(e=>({...e,wait:99})),popups:[{pos:{x:2,y:11},warn:0,life:3}],nextPopup:999};
  assert.deepEqual(step(blocked,.19).pos,{x:1,y:11});
});
test('reaching the goal turns the lights out and puts milk back in the centre',()=>{
  const s=step({...initial(),score:GOAL-10,pos:{x:1,y:11},dir:'right',queued:'right',enemies:initial().enemies.map(e=>({...e,wait:99}))},.19);
  assert.ok(s.score>=GOAL);assert.ok(s.milk>0);assert.equal(s.message,STAGES[3].news);
});
// Safety-first player: walks to the goal only through tiles no awake screen can reach sooner.
function plan(s:State):Direction{
  const threat=s.enemies.filter(e=>e.wait===0).map(e=>distances(e.pos));
  const risk=(p:{x:number;y:number},steps:number)=>s.quiet>2?false:threat.some(f=>f.get(key(p))!<=Math.ceil(steps*.65)+2);
  const close=threat.some(f=>f.get(key(s.pos))!<=6);
  const goals=new Set(close&&s.powers.length&&s.quiet===0?s.powers:s.score>=GOAL?[key(BED)]:s.dots);
  const seen=new Set([key(s.pos)]);const q:{p:{x:number;y:number};first:Direction;n:number}[]=[];
  for(const d of directions){const p=neighbor(s.pos,d);if(open(s,p)&&!risk(p,1)){seen.add(key(p));q.push({p,first:d,n:1});}}
  for(let i=0;i<q.length;i++){const c=q[i];if(goals.has(key(c.p)))return c.first;for(const d of directions){const p=neighbor(c.p,d);if(open(s,p)&&!seen.has(key(p))&&!risk(p,c.n+1)){seen.add(key(p));q.push({p,first:c.first,n:c.n+1});}}}
  return directions.filter(d=>open(s,neighbor(s.pos,d))).sort((a,b)=>{const m=(d:Direction)=>Math.min(99,...threat.map(f=>f.get(key(neighbor(s.pos,d)))!));return m(b)-m(a);})[0]??s.dir;
}
function night(seed:number){let s=initial(seed);for(let i=0;i<8000&&s.status==='playing';i++)s=step(turn(s,plan(s)),.05);return s;}
test('the whole night can be won by a careful player, and takes long enough to feel the stages',()=>{
  const runs=[1,2,3,4,5,6,7,8].map(night);const wins=runs.filter(s=>s.status==='won');
  assert.ok(wins.length>=6,runs.map(s=>s.status+s.score).join());
  assert.ok(wins.every(s=>s.time>20),wins.map(s=>s.time.toFixed(0)).join());
});
test('two lower moons return at the start of the third stage',()=>{
  const from=STAGES[2].from;const s=step({...initial(),score:from-10,dots:['2,11'],powers:[],pos:{x:1,y:11},dir:'right',queued:'right',enemies:initial().enemies.map(e=>({...e,wait:99}))},.19);
  assert.equal(s.powers.length,2);assert.ok(s.powers.every(id=>id.endsWith(',13')));
});
