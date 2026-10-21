import {test} from 'node:test';
import assert from 'node:assert/strict';
import {precisionInitial,preciseAction,needle,inGreen} from '../src/cook/precision.ts';
import {nextTask,phoneActive,type Station} from '../src/cook/model.ts';
test('Full kitchen round supports all precision actions, phone, plating and victory',()=>{
 let s=precisionInitial();for(let n=0;n<6;n++)s=preciseAction(s,{type:'cut'});s=preciseAction(s,{type:'start'});
 while(s.cook.stage==='stove'){
  if(phoneActive(s.cook))s=preciseAction(s,{type:'dismiss'});
  for(const station of ['pan','pot'] as Station[]){const task=nextTask(s.cook,station);if(task&&s.cook.elapsed>=task.at&&inGreen(needle(s.cook.elapsed,station)))s=preciseAction(s,{type:'act',station});}
  s=preciseAction(s,{type:'tick',delta:50});
 }
 assert.equal(s.cook.stage,'plate');assert.equal(s.cook.mistakes,0);assert.equal(s.best,5);assert.ok(s.cook.dismissed);
 for(let part=0;part<3;part++)s=preciseAction(s,{type:'plate',part});s=preciseAction(s,{type:'serve'});assert.equal(s.cook.stage,'won');assert.ok(s.quality>=160);
});
test('Off-beat input is retryable, cannot award points repeatedly, and phone blocks actions',()=>{
 let s=precisionInitial();for(let n=0;n<6;n++)s=preciseAction(s,{type:'cut'});s=preciseAction(s,{type:'start'});
 s={...s,cook:{...s.cook,elapsed:8500}};const failed=preciseAction(s,{type:'act',station:'pan'});assert.equal(failed.quality,s.quality);assert.equal(failed.cook.results['pan-first'],undefined);
 s={...s,cook:{...s.cook,elapsed:8925}};s=preciseAction(s,{type:'act',station:'pan'});assert.equal(s.cook.results['pan-first'],'done');const score=s.quality;s=preciseAction(s,{type:'act',station:'pan'});assert.equal(s.quality,score);
 s={...s,cook:{...s.cook,elapsed:27000}};assert.equal(preciseAction(s,{type:'act',station:'pot'}),s);
});
test('Invalid and duplicate plating never increases mastery',()=>{
 let s=precisionInitial();s={...s,cook:{...s.cook,stage:'plate'}};s=preciseAction(s,{type:'plate',part:0});const score=s.quality;s=preciseAction(s,{type:'plate',part:0});s=preciseAction(s,{type:'plate',part:9});assert.equal(s.quality,score);
});
