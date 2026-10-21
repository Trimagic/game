import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COOK_MS, TASKS, cookReducer, createCookState, phoneActive, validCut } from '../src/cook/model.ts';
function prepared(){let s=createCookState();for(let i=0;i<6;i++)s=cookReducer(s,{type:'cut'});return s;}
test('preparation needs six cuts and cannot be skipped',()=>{
  let s=createCookState();assert.equal(cookReducer(s,{type:'start'}).stage,'prep');
  for(let i=0;i<5;i++)s=cookReducer(s,{type:'cut'});
  assert.equal(s.stage,'prep');s=cookReducer(s,{type:'cut'});assert.equal(s.stage,'ready');
  assert.equal(cookReducer(s,{type:'cut'}).cuts,6);assert.equal(cookReducer(s,{type:'start'}).stage,'stove');
});
test('slicing validates the line and a complete stroke in either direction',()=>{
  assert.ok(validCut({x:.35,y:.1},{x:.35,y:.9},.35));
  assert.ok(validCut({x:.65,y:.9},{x:.65,y:.1},.65));
  assert.equal(validCut({x:.35,y:.4},{x:.35,y:.6},.35),false);
  assert.equal(validCut({x:.1,y:.1},{x:.1,y:.9},.65),false);
});
test('early presses do not complete tasks or cause penalties',()=>{
  const s=cookReducer(prepared(),{type:'start'});
  const next=cookReducer(s,{type:'act',station:'pan'});
  assert.deepEqual(next.results,{});assert.equal(next.mistakes,0);
});
test('full round including phone and plating can be won without mistakes',()=>{
  let s=cookReducer(prepared(),{type:'start'});
  while(s.stage==='stove') {
    if(phoneActive(s))s=cookReducer(s,{type:'dismiss'});
    for(const task of TASKS)if(s.elapsed>=task.at&&!s.results[task.id])s=cookReducer(s,{type:'act',station:task.station});
    s=cookReducer(s,{type:'tick',delta:100});
  }
  assert.equal(s.stage,'plate');assert.equal(s.mistakes,0);assert.equal(s.dismissed,true);assert.equal(s.elapsed,COOK_MS);
  assert.equal(Object.values(s.results).filter(r=>r==='done').length,5);
  assert.equal(cookReducer(s,{type:'serve'}).stage,'plate');
  for(let part=0;part<3;part++)s=cookReducer(s,{type:'plate',part});
  assert.equal(cookReducer(s,{type:'plate',part:0}).plated.length,3);
  s=cookReducer(s,{type:'serve'});assert.equal(s.stage,'won');assert.equal(cookReducer(s,{type:'tick',delta:100}),s);
});
test('phone blocks stove briefly but leaves time for the garnish',()=>{
  let s={...cookReducer(prepared(),{type:'start'}),elapsed:28_000};
  assert.ok(phoneActive(s));assert.equal(cookReducer(s,{type:'act',station:'pot'}),s);
  s={...s,elapsed:31_000,results:{'rice-stir':'done' as const}};
  assert.equal(phoneActive(s),false);assert.equal(cookReducer(s,{type:'act',station:'pot'}).results['rice-off'],'done');
});
test('three missed actions end the round, and each is penalized once',()=>{
  let s=cookReducer(prepared(),{type:'start'});
  for(let i=0;i<200&&s.stage==='stove';i++)s=cookReducer(s,{type:'tick',delta:250});
  assert.equal(s.stage,'lost');assert.equal(s.mistakes,3);assert.equal(cookReducer(s,{type:'tick',delta:250}),s);
});
test('one missed action can be recovered and no invalid plating is accepted',()=>{
  let s=cookReducer(prepared(),{type:'start'});
  while(s.stage==='stove') {
    if(phoneActive(s))s=cookReducer(s,{type:'dismiss'});
    for(const t of TASKS)if(t.id!=='pan-first'&&s.elapsed>=t.at&&!s.results[t.id])s=cookReducer(s,{type:'act',station:t.station});
    s=cookReducer(s,{type:'tick',delta:100});
  }
  assert.equal(s.stage,'plate');assert.equal(s.mistakes,1);
  assert.equal(cookReducer(s,{type:'plate',part:100}),s);
});
