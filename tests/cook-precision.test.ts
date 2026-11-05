import {test} from 'node:test';
import assert from 'node:assert/strict';
import {precisionInitial,preciseAction,needle,inGreen,activeSplash,splashPlan,cookRating,SPLASH_MS,PREP_PAR,type PrecisionCook} from '../src/cook/precision.ts';
import {nextTask,phoneActive,type Station} from '../src/cook/model.ts';
test('Full kitchen round supports all precision actions, phone, plating and victory',()=>{
 let s=precisionInitial();for(let n=0;n<6;n++)s=preciseAction(s,{type:'cut'});s=preciseAction(s,{type:'start'});
 while(s.cook.stage==='stove'){
  if(phoneActive(s.cook))s=preciseAction(s,{type:'dismiss'});
  if(activeSplash(s)>=0)s=preciseAction(s,{type:'splash'});
  for(const station of ['pan','pot'] as Station[]){const task=nextTask(s.cook,station);if(task&&s.cook.elapsed>=task.at&&inGreen(needle(s.cook.elapsed,station)))s=preciseAction(s,{type:'act',station});}
  s=preciseAction(s,{type:'tick',delta:50});
 }
 assert.equal(s.cook.stage,'plate');assert.equal(s.cook.mistakes,0);assert.equal(s.best,9);assert.ok(s.cook.dismissed);
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
function play(seed:number,skill:'sharp'|'sloppy'){
 let s:PrecisionCook=precisionInitial(seed);
 for(let n=0;n<6;n++){for(let t=0;t<(skill==='sharp'?1200:3000);t+=100)s=preciseAction(s,{type:'tick',delta:100});s=preciseAction(s,{type:'cut',precise:skill==='sharp'});}
 s=preciseAction(s,{type:'start'});
 while(s.cook.stage==='stove'){
  if(phoneActive(s.cook))s=preciseAction(s,{type:'dismiss'});
  if(activeSplash(s)>=0&&(skill==='sharp'||s.cook.elapsed%2000<50))s=preciseAction(s,{type:'splash'});
  for(const station of ['pan','pot'] as Station[]){const task=nextTask(s.cook,station);const v=needle(s.cook.elapsed,station);if(task&&s.cook.elapsed>=task.at&&(skill==='sharp'?v>=.45&&v<=.55:inGreen(v)&&s.cook.elapsed>task.until-2500))s=preciseAction(s,{type:'act',station});}
  s=preciseAction(s,{type:'tick',delta:25});
 }
 for(let part=0;part<3;part++)s=preciseAction(s,{type:'plate',part});return preciseAction(s,{type:'serve'});
}
test('Fast precise prep earns more than slow sloppy prep',()=>{
 const fast=play(1,'sharp'),slow=play(1,'sloppy');
 assert.equal(fast.prepBonus,Math.round((PREP_PAR-7200)/250));assert.equal(slow.prepBonus,0);
 let s=precisionInitial();s=preciseAction(s,{type:'cut',precise:true});assert.equal(s.quality,10);s=preciseAction(s,{type:'cut'});assert.equal(s.quality,15);
 assert.equal(preciseAction(precisionInitial(),{type:'tick',delta:100}).prepMs,100);
});
test('Splashes reward a quick tap and missing one only resets the combo',()=>{
 let s=play(4,'sharp');assert.ok(Object.values(s.splashResults).every(r=>r==='done'));assert.equal(Object.keys(s.splashResults).length,4);
 let t=precisionInitial();for(let n=0;n<6;n++)t=preciseAction(t,{type:'cut'});t=preciseAction(t,{type:'start'});
 t={...t,combo:3,cook:{...t.cook,elapsed:t.splashes[0].at}};assert.ok(activeSplash(t)>=0);
 const caught=preciseAction(t,{type:'splash'});assert.equal(caught.quality,t.quality+15);assert.equal(preciseAction(caught,{type:'splash'}),caught);
 let missed=t;for(let ms=0;ms<SPLASH_MS;ms+=100)missed=preciseAction(missed,{type:'tick',delta:100});assert.equal(missed.combo,0);assert.equal(missed.cook.mistakes,0);assert.equal(missed.splashResults[0],'missed');
});
test('Seeded splashes avoid the phone call and the needle stays continuous when it speeds up',()=>{
 for(let seed=1;seed<=100;seed++)for(const p of splashPlan(seed))assert.ok(p.at+SPLASH_MS<=26_000||p.at>=31_000);
 assert.ok(Math.abs(needle(19_999,'pan')-needle(20_001,'pan'))<.01);
});
test('Rating separates a sharp cook from a sloppy one',()=>{
 for(const seed of [2,5,9]){const sharp=play(seed,'sharp'),sloppy=play(seed,'sloppy');assert.equal(sharp.cook.stage,'won');assert.equal(sloppy.cook.stage,'won');assert.equal(cookRating(sharp.quality),3,`sharp ${sharp.quality}`);assert.ok(cookRating(sloppy.quality)<3,`sloppy ${sloppy.quality}`);}
});
