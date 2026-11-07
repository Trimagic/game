import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bonuses,CARD,CHECKPOINTS,CONE,CRUMBLE,CRUMBLE_BACK,CRUMBLE_DELAY,DOOR,finalScore,GOAL,GROUND,initial,movers,nightRating,NURSES,nurseAt,screenNear,SCREENS,seen,solids,spareHearts,SPRING,step,ZONES,zoneAt,type Input,type State} from '../src/night/model.ts';
const idle=(s:State,n:number)=>{for(let i=0;i<n;i++)s=step(s,1/60,{move:0,jump:false});return s;};
test('Walking cannot pass through furniture; jumping clears it',()=>{
 let s={...initial(),x:270};s=step(s,.1,{move:1,jump:false});assert.ok(s.x<=278);
 for(let i=0;i<55;i++)s=step(s,1/60,{move:1,jump:i<45});assert.ok(s.x>355);assert.equal(s.status,'playing');
});
test('Holding jump gives more height and no repeat jump while holding on landing',()=>{
 let held=initial(),tap=initial(),minHeld=400,minTap=400;
 for(let i=0;i<100;i++){held=step(held,1/60,{move:0,jump:true});tap=step(tap,1/60,{move:0,jump:i===0});minHeld=Math.min(minHeld,held.y);minTap=Math.min(minTap,tap.y);}
 assert.ok(minHeld<minTap-20);assert.equal(held.y,400);assert.equal(held.vy,0);
});
test('Falling costs a heart and returns to the last checkpoint; hearts run out; patience ending is final',()=>{
 const fell=idle({...initial(),x:680,grounded:false,checkpoint:0},90);assert.equal(fell.lives,2);assert.equal(fell.x,CHECKPOINTS[0]);assert.equal(fell.status,'playing');
 const last=idle({...initial(),lives:1,x:680,grounded:false},90);assert.equal(last.status,'lost');
 const tired=idle({...initial(),patience:.01},1);assert.equal(tired.status,'lost');assert.equal(idle(tired,100),tired);
 assert.deepEqual([0,1,2,5].map(spareHearts),[0,0,1,2]);assert.equal(initial(2).lives,5);
});
test('Hazards have an invulnerability window and moon tokens collect only once',()=>{
 let s=step({...initial(),x:820},.025,{move:0,jump:false});assert.equal(s.hits,1);s=idle(s,30);assert.equal(s.hits,1);
 let b=step({...initial(),x:505,y:322,grounded:false,patience:50},.025,{move:0,jump:false});assert.deepEqual(b.collected,[0]);assert.ok(b.patience>60);const p=b.patience;b=idle(b,2);assert.deepEqual(b.collected,[0]);assert.ok(b.patience<=p);
});
test('Only reaching the door triggers the scripted ending',()=>{
 let s=step({...initial(),x:GOAL,checkpoint:3,card:true,time:0},.025,{move:0,jump:false});assert.equal(s.status,'ending');s=idle(s,200);assert.equal(s.status,'done');assert.equal(idle(s,100),s);
});
test('The level is laid out as four growing zones',()=>{
 assert.deepEqual(ZONES.map((z,i)=>zoneAt(z.from)===i),[true,true,true,true]);
 assert.ok(NURSES.every((n,i)=>i===0||n.speed>NURSES[i-1].speed));
 for(const n of NURSES)assert.ok(SCREENS.some(x=>x>=n.from&&x<=n.to+40),'a screen in every patrol');
 assert.ok(bonuses.every(b=>b.y>=120));assert.ok(CHECKPOINTS.every((x,i)=>i===0||x>CHECKPOINTS[i-1]));
});
test('The mattress throws high enough to reach the card shelf',()=>{
 let s:State={...initial(),x:SPRING.x+25,time:0};let top=GROUND;for(let i=0;i<60;i++){s=step(s,1/60,{move:0,jump:i>2});top=Math.min(top,s.y);}assert.ok(top<230,String(top));
});
test('A gurney carries the hero and a lift raises them',()=>{
 const t=2;const g=movers(t)[0];let s:State={...initial(),x:g.x+45,y:GROUND,time:t,on:0,grounded:true};const start=s.x;
 for(let i=0;i<30;i++)s=step(s,1/60,{move:0,jump:false});assert.notEqual(s.x,start);assert.equal(s.on,0);assert.ok(Math.abs(s.x-movers(s.time)[0].x-45)<1);
 const l=movers(0)[2];let u:State={...initial(),x:l.x+35,y:l.y,time:0,on:2,grounded:true,shield:9};const ys=[];for(let i=0;i<60;i++){u=step(u,1/60,{move:0,jump:false});ys.push(u.y);}assert.ok(Math.max(...ys)-Math.min(...ys)>30);
});
test('Loose planks fall a moment after being stepped on, then come back',()=>{
 const p=CRUMBLE[0];let s:State={...initial(),x:p.x+30,y:p.y,time:0};s=step(s,.05,{move:0,jump:false});assert.ok(s.crumble[0]>0);
 for(let i=0;i<Math.ceil(CRUMBLE_DELAY*60)+3;i++)s=step(s,1/60,{move:0,jump:false});assert.ok(s.crumble[0]<0,'gone');assert.ok(s.y>p.y);
 let t={...initial(),x:50,crumble:CRUMBLE.map((_,i)=>i===0?-.05:0)};t=idle(t,10);assert.equal(t.crumble[0],0);assert.ok(CRUMBLE_BACK>1);
});
test('The door needs the card; the card shelf has it',()=>{
 let s:State={...initial(),x:DOOR.x-30,y:GROUND,checkpoint:2,suspicion:0,shield:9};for(let i=0;i<60;i++)s={...step(s,1/60,{move:1,jump:false}),suspicion:0};assert.ok(s.x<=DOOR.x-12);
 let k:State={...initial(),x:DOOR.x-30,y:GROUND,card:true,checkpoint:2,shield:9};for(let i=0;i<60;i++)k={...step(k,1/60,{move:1,jump:false}),suspicion:0};assert.ok(k.x>DOOR.x+DOOR.w);
 const got=step({...initial(),x:CARD.x,y:CARD.y+20,grounded:false},.02,{move:0,jump:false});assert.equal(got.card,true);
});
test('The beam sees forward along the floor, not behind, above, through furniture or a hidden hero',()=>{
 const t=0;const n=nurseAt(0,t);const at=(dx:number,y=GROUND,hidden=false)=>({x:n.x+dx*n.facing,y,hidden,card:false});
 assert.equal(seen(at(80),0,t),true);assert.equal(seen(at(-40),0,t),false);assert.equal(seen(at(CONE+20),0,t),false);
 assert.equal(seen(at(80,318),0,t),false,'raised route passes over');assert.equal(seen(at(80,GROUND,true),0,t),false);
 const c={x:2470,y:GROUND,hidden:false,card:false};const left={...c,x:2455};
 const time=(2370-2200)/55;assert.ok(nurseAt(0,time).x<2380);assert.equal(seen(left,0,time),false,'counter blocks the beam');
});
test('Staying in the light fills suspicion and sends you back; hiding behind a screen keeps you safe',()=>{
 const sx=SCREENS[0];assert.equal(screenNear(sx+10),sx);assert.equal(screenNear(sx+80),undefined);
 const t=(sx-80-2200)/55;let out:State={...initial(),x:sx,y:GROUND,time:t,checkpoint:2,card:false};
 for(let i=0;i<70&&out.lives===3;i++)out=step(out,1/60,{move:0,jump:false});assert.equal(out.lives,2);assert.equal(out.x,CHECKPOINTS[2]);
 let hide:State={...initial(),x:sx+10,y:GROUND,time:t,checkpoint:2};hide=step(hide,1/60,{move:0,jump:false,hide:true});assert.equal(hide.hidden,true);assert.equal(hide.x,sx);
 for(let i=0;i<240;i++)hide=step(hide,1/60,{move:0,jump:false,hide:true});assert.equal(hide.lives,3,'patrol walks past');assert.equal(hide.hidden,true);
 assert.equal(step(hide,1/60,{move:1,jump:false}).hidden,false,'moving steps out');
 assert.equal(step({...initial(),x:500},1/60,{move:0,jump:false,hide:true}).hidden,false,'no screen, no hiding');
});
test('Rating rewards tokens and hearts; a lost run earns none',()=>{
 const end=(extra:Partial<State>):State=>({...initial(),status:'done',...extra});const all=bonuses.map((_,i)=>i);
 assert.equal(nightRating(end({collected:all})),3);assert.equal(nightRating(end({collected:all,lives:2})),2);assert.equal(nightRating(end({lives:1})),1);assert.equal(nightRating(end({status:'lost'})),0);
 assert.ok(finalScore(end({score:100,patience:50}))>finalScore(end({score:100,patience:10})));
});
// Beam search over real inputs: each stretch must be passable with patrols, planks and platforms all live.
const INPUTS:Input[]=[{move:1,jump:false},{move:1,jump:true},{move:-1,jump:false},{move:0,jump:false},{move:1,jump:false,hide:true},{move:0,jump:false,hide:true},{move:-1,jump:true}];
function search(start:State,done:(s:State)=>boolean,score:(s:State)=>number,steps:number,width=70){
 let beam=[start];
 for(let t=0;t<steps;t++){const next=new Map<string,State>();
  for(const s of beam)for(const input of INPUTS){let n=s;for(let k=0;k<6;k++)n=step(n,1/60,input);
   if(done(n)&&n.lives===start.lives)return n;
   if(n.status!=='playing'||n.lives<start.lives)continue;
   const key=[Math.round(n.x/16),Math.round(n.y/16),n.grounded,n.hidden,n.card,Math.round(n.suspicion*4)].join();
   const old=next.get(key);if(!old||score(n)>score(old))next.set(key,n);}
  beam=[...next.values()].sort((a,b)=>score(b)-score(a)).slice(0,width);
 }
 return null;
}
const at=(i:number,extra:Partial<State>={}):State=>({...initial(),x:CHECKPOINTS[i],checkpoint:i,time:3,...extra});
test('Every stretch of the route can be passed without losing a heart',()=>{
 const by=(_goal:number)=>(s:State)=>s.x-s.suspicion*40;
 assert.ok(search(at(0),s=>s.x>=CHECKPOINTS[1],by(CHECKPOINTS[1]),130),'ward');
 assert.ok(search(at(1),s=>s.x>=1700,by(1700),150),'repair: gurney and planks');
 assert.ok(search({...at(1),x:1600},s=>s.card,s=>-Math.abs(s.x-CARD.x)-Math.abs(s.y-CARD.y)*2,120),'mattress to card');
 assert.ok(search(at(2,{card:true}),s=>s.x>=DOOR.x+40,by(DOOR.x+40),320),'first nurse and door');
 assert.ok(search({...at(2,{card:true}),x:DOOR.x+40,checkpoint:2},s=>s.x>=CHECKPOINTS[3],by(CHECKPOINTS[3]),260),'second nurse and robot');
 assert.ok(search(at(3,{card:true,patience:100}),s=>s.x>=3880,by(3880),220),'gurney, lift and deck');
 assert.ok(search({...at(3,{card:true}),x:3870},s=>s.status==='ending',by(GOAL),300),'last nurse to the door');
});
test('The door blocks every route without the card',()=>{
 assert.equal(search(at(2),s=>s.x>DOOR.x+DOOR.w,s=>s.x,120,40),null);
 assert.ok(solids.length>10);
});
