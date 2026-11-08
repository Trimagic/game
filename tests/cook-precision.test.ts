import {test} from 'node:test';
import assert from 'node:assert/strict';
import {precisionInitial,preciseAction,cookRating,PREP_PAR,type PrecisionCook} from '../src/cook/precision.ts';
import {edible} from '../src/cook/chop.ts';
import {actStove,answerPhone,createStove,DISHES,finished,heat,PERFECT,PHONE_MS,READY,ready,tickStove,BURN_RESET,type Stove} from '../src/cook/stove.ts';

function prepared(seed?:number,skill:'sharp'|'sloppy'='sharp'){
 let s=precisionInitial(seed);
 for(let i=0;i<6000&&s.cook.stage==='prep';i++){
  s=preciseAction(s,{type:'tick',delta:50});
  if(skill==='sharp'){for(const p of s.chop.pieces)if((edible(s.chop.board,p)||p.kind==='pepper')&&p.y>200)s=preciseAction(s,{type:'slice',from:{x:p.x,y:p.y-30},to:{x:p.x,y:p.y+30}});}
  else if(i%14===0)s=preciseAction(s,{type:'cut'});
 }
 return preciseAction(s,{type:'start'});
}
function cook(s:PrecisionCook,skill:'sharp'|'sloppy'){
 for(let i=0;i<4000&&s.cook.stage==='stove';i++){
  if(s.stove.phone==='ringing'&&(skill==='sharp'||s.stove.time>s.stove.phoneAt+2))s=preciseAction(s,{type:'answer'});
  s.stove.burners.forEach((b,j)=>{if(ready(s.stove,j)&&(skill==='sharp'?b.progress>=(PERFECT[0]+PERFECT[1])/2:b.progress>=.95))s=preciseAction(s,{type:'burner',index:j});});
  s=preciseAction(s,{type:'tick',delta:25});
 }
 for(let part=0;part<3;part++)s=preciseAction(s,{type:'plate',part});
 return preciseAction(s,{type:'serve'});
}

test('Dishes fill, wait in a ready window and burn if ignored',()=>{
 let s=createStove();assert.equal(ready(s,0),false);
 while(!ready(s,0))s=tickStove(s,.05);assert.ok(s.burners[0].progress>=READY);
 let burnt=s;while(burnt.mistakes===0)burnt=tickStove(burnt,.05);
 assert.equal(burnt.burners[0].progress<BURN_RESET+.1,true);assert.equal(burnt.burners[0].burns,1);assert.equal(burnt.combo,0);
 assert.ok(burnt.events.some(e=>e.type==='burn'&&e.burner===0));
});
test('Pressing early only breaks the streak; pressing in time advances the dish',()=>{
 let s:Stove={...createStove(),combo:4};s={...s,burners:s.burners.map((b,i)=>i===0?{...b,delay:0,progress:.3}:b)};
 const early=actStove(s,0);assert.equal(early.combo,0);assert.equal(early.burners[0].step,0);assert.equal(early.mistakes,0);
 const perfect=actStove({...s,burners:s.burners.map((b,i)=>i===0?{...b,progress:.85}:b)},0);
 assert.equal(perfect.burners[0].step,1);assert.equal(perfect.burners[0].progress,0);assert.equal(perfect.gained,30);assert.equal(perfect.combo,5);
 const late=actStove({...s,burners:s.burners.map((b,i)=>i===0?{...b,progress:.97}:b)},0);assert.equal(late.gained,20);
});
test('Finishing every step on all burners ends cooking; three burns lose',()=>{
 let s=createStove();s={...s,burners:s.burners.map((b,i)=>({...b,delay:0,step:DISHES[i].steps.length-1,progress:.85}))};
 s=actStove(s,0);s=actStove(s,1);assert.equal(s.status,'cooking');assert.ok(finished(s,0));assert.equal(actStove(s,0),s);
 s=actStove(s,2);assert.equal(s.status,'done');
 let lost:Stove={...createStove(),mistakes:2,burners:createStove().burners.map((b,i)=>i===0?{...b,delay:0,progress:.999}:b)};
 lost=tickStove(lost,.05);assert.equal(lost.status,'lost');assert.deepEqual(tickStove(lost,1),lost);
});
test('The phone blocks the hands until answered and gives up after a while',()=>{
 let s=createStove();while(s.phone==='off')s=tickStove({...s,burners:s.burners.map(b=>({...b,progress:0}))},.05);assert.equal(s.phone,'ringing');
 const busy={...s,burners:s.burners.map((b,i)=>i===0?{...b,delay:0,progress:.85}:b)};
 assert.equal(actStove(busy,0).burners[0].step,0);
 const answered=answerPhone(busy);assert.equal(answered.phone,'answered');assert.equal(answered.gained,10);assert.equal(actStove(answered,0).burners[0].step,1);
 let missed=s;for(let t=0;t<PHONE_MS+.2;t+=.05)missed=tickStove({...missed,burners:missed.burners.map(b=>({...b,progress:0}))},.05);assert.equal(missed.phone,'missed');
});
test('Seeds vary the stove and heat rises over time',()=>{
 assert.notDeepEqual(createStove(1).burners,createStove(2).burners);assert.deepEqual(createStove(),createStove());
 assert.ok(heat(30)>heat(0));for(let seed=1;seed<50;seed++){const s=createStove(seed);assert.ok(s.phoneAt>=9&&s.phoneAt<=14);}
});
test('Full kitchen round: fast precise prep, juggling, plating and victory',()=>{
 for(const seed of [1,4,9,16]){
  const s=cook(prepared(seed),'sharp');assert.equal(s.chop.board,'done');assert.ok(s.prepBonus>0);
  assert.equal(s.cook.stage,'won',`seed ${seed}: ${s.feedback}`);assert.equal(s.stove.mistakes,0);assert.equal(s.stove.phone,'answered');
  assert.ok(s.prepMs<PREP_PAR);assert.equal(cookRating(s.quality),3,`quality ${s.quality}`);
 }
});
test('A sloppy cook still wins but earns fewer stars',()=>{
 for(const seed of [2,5,11]){const s=cook(prepared(seed,'sloppy'),'sloppy');assert.equal(s.cook.stage,'won');assert.ok(cookRating(s.quality)<3,`quality ${s.quality}`);}
});
test('Ignoring the stove burns dinner and ends the round',()=>{
 let s=prepared(3);for(let i=0;i<2000&&s.cook.stage==='stove';i++)s=preciseAction(s,{type:'tick',delta:50});
 assert.equal(s.cook.stage,'lost');assert.equal(preciseAction(s,{type:'burner',index:0}),s);
});
test('Invalid and duplicate plating never increases mastery',()=>{
 let s=precisionInitial();s={...s,cook:{...s.cook,stage:'plate'}};s=preciseAction(s,{type:'plate',part:0});const score=s.quality;s=preciseAction(s,{type:'plate',part:0});s=preciseAction(s,{type:'plate',part:9});assert.equal(s.quality,score);
});
