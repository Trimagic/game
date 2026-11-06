import { test } from 'node:test';
import assert from 'node:assert/strict';
import {BOOTS_TIME,buildCourse,course,DURATION,duck,HERO_X,initial,jump,obstacleX,pickupX,step,travel,zoneAt,type State} from '../src/run/model.ts';
// A player who reacts to the next obstacle and never jumps when something overhead is close.
function play(seed:number){
  let s=initial(seed);const jumped=new Set<number>();
  while(s.time<DURATION&&s.status==='playing'){
    const o=s.course.obstacles.find(o=>obstacleX(o,s.time)+o.width/2>HERO_X-12);
    s=duck(s,!!o&&(o.kind==='branch')&&o.at-s.time<.6);
    if(o&&o.kind!=='branch'&&o.kind!=='pigeons'&&!jumped.has(o.id)&&o.at-s.time<.36){s=jump(s);jumped.add(o.id);}
    s=step(s,1/120);
  }
  return s;
}
test('jump is automatic ballistic arc with no double jump',()=>{
  let s=jump(initial());s=step(s,.1);assert.ok(s.y>0);assert.deepEqual(jump(s),s);
  for(let i=0;i<9;i++)s=step(s,.1);assert.equal(s.y,0);assert.equal(s.vy,0);
});
test('duck clears branches but does not clear ground obstacles',()=>{
  const b=buildCourse(3).obstacles.find(o=>o.kind==='branch')!;
  const on=(extra:Partial<State>):State=>({...initial(3),time:b.at-.01,...extra});
  assert.equal(step(on({duck:true}),.02).lives,3);
  assert.equal(step(on({}),.02).lives,2);
  assert.equal(step({...initial(),time:course[1].at-.01,duck:true},.02).lives,2);
});
test('every generated course is winnable without damage',()=>{
  for(let seed=1;seed<=40;seed++){
    const s=play(seed);
    assert.equal(s.status,'won',`seed ${seed}`);assert.equal(s.hits.length,0,`seed ${seed} hit ${JSON.stringify(s.hits.map(id=>s.course.obstacles[id].kind+'@'+s.course.obstacles[id].at.toFixed(1)))}`);
    assert.equal(s.cleared,s.course.obstacles.length);
  }
});
test('one obstacle cannot repeatedly damage; three hits lose',()=>{
  let s=step({...initial(),time:course[0].at-.1},.1);assert.equal(s.lives,2);
  for(let i=0;i<5;i++)s=step(s,.1);assert.equal(s.lives,2);
  s=step({...s,time:course[1].at-.1,shield:0},.1);assert.equal(s.lives,1);
  s=step({...s,time:course[2].at-.1,shield:0},.1);assert.equal(s.status,'lost');assert.deepEqual(step(s,60),s);
});
test('courses vary, get denser in later zones and introduce new obstacles by zone',()=>{
  assert.notDeepEqual(buildCourse(1),buildCourse(2));assert.deepEqual(buildCourse(5),buildCourse(5));
  assert.ok(travel(60)-travel(59)>travel(1));
  const kinds=new Set<string>();
  for(let seed=1;seed<=40;seed++){
    const {obstacles}=buildCourse(seed);
    const per=(z:number,from:number,to:number)=>obstacles.filter(o=>zoneAt(o.at)===z).length/(to-from);
    assert.ok(per(3,45,60)>per(0,3.5,14),`seed ${seed} ends denser`);
    assert.ok(obstacles.filter(o=>o.at<14).every(o=>!['branch','dog','pigeons','pond'].includes(o.kind)),'first zone stays simple');
    assert.ok(obstacles.filter(o=>o.at<30).every(o=>!['pigeons','pond'].includes(o.kind)));
    for(let i=1;i<obstacles.length;i++)assert.ok(obstacles[i].at-obstacles[i-1].at>=.999,`seed ${seed} gap at ${obstacles[i].at}`);
    obstacles.forEach(o=>kinds.add(o.kind));
  }
  for(const k of ['dog','pigeons','pond','branch','double','barrier'])assert.ok(kinds.has(k),k);
});
test('a dog closes faster than the track but still arrives on its mark',()=>{
  const seed=[...Array(40).keys()].find(n=>buildCourse(n+1).obstacles.some(o=>o.kind==='dog'))!+1;
  const dog=buildCourse(seed).obstacles.find(o=>o.kind==='dog')!;
  assert.equal(obstacleX(dog,dog.at),HERO_X);
  assert.ok(obstacleX(dog,dog.at-1)-HERO_X>travel(dog.at)-travel(dog.at-1));
});
test('pigeons pass overhead unless you jump into them',()=>{
  const seed=[...Array(40).keys()].find(n=>buildCourse(n+1).obstacles.some(o=>o.kind==='pigeons'))!+1;
  const p=buildCourse(seed).obstacles.find(o=>o.kind==='pigeons')!;
  const on:State={...initial(seed),time:p.at-.01};
  assert.equal(step(on,.02).lives,3);
  assert.equal(step({...on,y:30,vy:0},.02).lives,2);
});
test('boots allow one extra jump in the air for a limited time; water restores a heart',()=>{
  let s:State={...initial(),boots:BOOTS_TIME};s=step(jump(s),.2);const first=s.vy;
  s=jump(s);assert.ok(s.vy>first&&s.airJump);assert.deepEqual(jump(s),s);
  for(let i=0;i<20;i++)s=step(s,.1);assert.equal(s.y,0);assert.equal(s.airJump,false);
  for(let seed=1;seed<=20;seed++){
    const {pickups,obstacles}=buildCourse(seed);assert.deepEqual(pickups.map(p=>p.kind),['boots','water'],`seed ${seed}`);
    for(const p of pickups)assert.ok(obstacles.every(o=>Math.abs(o.at-p.at)>.25),`seed ${seed} find at ${p.at}`);
  }
  const water=buildCourse(1).pickups[1];
  const drink=step({...initial(),lives:1,time:water.at-.01,shield:9},.02);assert.equal(drink.lives,2);assert.ok(drink.taken.includes(water.id));
  assert.ok(Math.abs(pickupX(water,water.at)-HERO_X)<1);
});
test('loss takes precedence and win requires finishing the full distance',()=>{
  const quiet=(time:number):State=>({...initial(),time,shield:9});
  assert.equal(step(quiet(59.8),.1).status,'playing');
  const won=step(quiet(59.99),.02);assert.equal(won.status,'won');assert.equal(won.time,60);
  assert.deepEqual(jump(won),won);assert.deepEqual(duck(won,true),won);
});
