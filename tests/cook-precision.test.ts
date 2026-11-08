import {test} from 'node:test';
import assert from 'node:assert/strict';
import {precisionInitial,preciseAction,cookRating,PREP_PAR,type PrecisionCook} from '../src/cook/precision.ts';
import {edible} from '../src/cook/chop.ts';
import {actStove,answerPhone,catchSpice,createStove,DISHES,FLARE_MS,finished,heat,PERFECT,PHONE_MS,READY,ready,spiceAt,tickStove,BURN_RESET,type Stove} from '../src/cook/stove.ts';

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
  // A flare is put out at once by a sharp cook, after a second by a sloppy one; only a sharp cook catches the shaker.
  const flare=s.stove.flare;if(flare&&s.stove.phone!=='ringing'&&(skill==='sharp'||flare.left<FLARE_MS-1))s=preciseAction(s,{type:'burner',index:flare.burner});
  if(skill==='sharp'&&(spiceAt(s.stove)??0)>.5)s=preciseAction(s,{type:'spice'});
  s.stove.burners.forEach((b,j)=>{if(s.stove.flare?.burner!==j&&ready(s.stove,j)&&(skill==='sharp'?b.progress>=(PERFECT[0]+PERFECT[1])/2:b.progress>=.95))s=preciseAction(s,{type:'burner',index:j});});
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

test('A flare-up doubles the heat until tapped and burns the dish if ignored',()=>{
 // Start the flare straight away, before the unattended stove can burn three times.
 const cold=createStove();let s=tickStove({...cold,nextFlare:0,burners:cold.burners.map(b=>({...b,delay:0}))},.05);assert.ok(s.flare);const i=s.flare!.burner;assert.ok(s.events.some(e=>e.type==='flare'));
 const out=actStove(s,i);assert.equal(out.flare,null);assert.equal(out.putOut,1);assert.equal(out.gained,s.gained+15);assert.equal(out.burners[i].step,s.burners[i].step,'putting out is not a cooking step');
 let left=s;const burns=left.mistakes;for(let k=0;k<100&&left.flare;k++)left=tickStove(left,.05);assert.equal(left.flare,null);assert.equal(left.mistakes,burns+1);assert.ok(left.time-s.time<=FLARE_MS+.1);
});
test('The shaker crosses the stove and can be caught once; burners answer the ringing phone',()=>{
 const s=tickStove({...createStove(),nextSpice:0},.05);assert.ok(s.spice);assert.ok(spiceAt(s)!<.05);
 const caught=catchSpice(s);assert.equal(caught.spices,1);assert.equal(caught.gained,s.gained+15);assert.equal(catchSpice(caught),caught);
 let gone=s;for(let i=0;i<80;i++)gone=tickStove(gone,.05);assert.equal(gone.spice===null||gone.spice.start!==s.spice!.start,true,'the first shaker has flown past');
 const r=tickStove({...createStove(),phoneAt:0},.05);assert.equal(r.phone,'ringing');assert.equal(actStove(r,0).phone,'answered');
});
