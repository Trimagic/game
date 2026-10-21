import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FINISH, GRAVITY, JUMP, hazards, initial, platforms, platformX, resume, step } from '../src/stairs/model.ts';
test('ordinary route stays below jump height and within horizontal reach',()=>{
  const apex=JUMP*JUMP/(2*GRAVITY);
  for(let i=1;i<46;i++){
    assert.ok(platforms[i].y-platforms[i-1].y<apex);
    assert.ok(Math.abs(platforms[i].x-platforms[i-1].x)+40<225*0.7);
  }
});
test('auto jump lands only while descending and wall bounds hold',()=>{
  let s=initial();s=step(s,0,0.1);assert.ok(s.y>0);assert.equal(s.bounces,0);
  for(let i=0;i<100;i++)s=step(s,1,1/60);
  assert.ok(s.x<=342);assert.ok(s.x>=18);
});
test('ordinary route can reach tenth floor with hazards active',()=>{
  let s=initial();let rests:number[]=[];
  for(let i=0;i<180*120 && s.status!=='won';i++){
    if(s.status==='rest'){rests.push(s.checkpoint);s=resume(s);}
    if(s.status==='fallen')s=resume(s);
    const last=s.last>=100?Math.floor(s.y/80):s.last;
    const target=platforms[Math.min(45,last+1)];
    const dx=platformX(target,s.time)-10-s.x;
    s=step(s,Math.abs(dx)<2?0:Math.sign(dx),1/120);
  }
  assert.equal(s.status,'won',JSON.stringify({height:s.high,last:s.last,falls:s.falls}));
  assert.ok(rests.includes(1200));assert.ok(rests.includes(2400));assert.equal(s.y,FINISH);
});
test('checkpoint rest freezes simulation; fall resumes at saved floor',()=>{
  let s={...initial(),x:180,y:1203,vy:-100,checkpoint:0};
  s=step(s,0,.05);assert.equal(s.status,'rest');assert.equal(s.checkpoint,1200);
  assert.deepEqual(step(s,1,.1),s);
  s={...resume(s),y:900,camera:1100};s=step(s,0,.01);assert.equal(s.status,'fallen');
  s=resume(s);assert.equal(s.y,1200);assert.equal(s.falls,1);assert.equal(s.status,'playing');
});
test('spring gives a higher jump; doors warn before opening',()=>{
  const p=platforms.find(p=>p.kind==='spring')!;
  let s={...initial(),x:p.x,y:p.y+3,vy:-100};s=step(s,0,.05);assert.ok(s.vy>JUMP);
  const door=hazards(0.7).find(h=>h.kind==='door'&&h.y===17*80+35)!;
  assert.equal(door.warning,true);assert.equal(door.active,false);
  const open=hazards(1.3).find(h=>h.kind==='door'&&h.y===17*80+35)!;assert.equal(open.active,true);
});
test('finish cannot be won by passing it from below',()=>{
  let s={...initial(),x:180,y:FINISH-5,vy:400};s=step(s,0,.05);assert.equal(s.status,'playing');
  s={...s,y:FINISH+3,vy:-100};s=step(s,0,.05);assert.equal(s.status,'won');assert.deepEqual(step(s,1,.1),s);
});
