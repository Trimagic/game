export type Rect={x:number;y:number;w:number;h:number};
export const WIDTH=6320,GOAL=6180,GROUND=400;
export const ZONES=[
 {from:0,name:'Палата',hint:'Тумбочки перепрыгивай, жетоны возвращают терпение.'},
 {from:1040,name:'Ремонт',hint:'Каталка довезёт над разрывом. Доски проваливаются: не стой на них. Прыгни на матрас и держи прыжок — долетишь до верхней полки.'},
 {from:2100,name:'Пост медсестры',hint:'В луч фонаря нельзя. Прячься за ширмы, иди верхом или брось тапок: медсестра посмотрит на звук.'},
 {from:3180,name:'Прачечная',hint:'Ленты тянут вперёд и назад. Вентиляция поднимает наверх, а красный пар лучше переждать.'},
 {from:4200,name:'Длинный коридор',hint:'Садись в кресло: оно мчит само! Коробки перепрыгивай, иначе вылетишь.'},
 {from:5100,name:'Финишный рывок',hint:'Терпение тает быстрее! Пол затоплен: поднимайся на подъёмнике.'},
];
export const LAST_ZONE=ZONES.length-1;
export const zoneAt=(x:number)=>{let z=0;ZONES.forEach((zone,i)=>{if(x>=zone.from)z=i;});return z;};
const box=(x:number,y:number,w:number,h:number):Rect=>({x,y,w,h});
const floor=(from:number,to:number)=>box(from,GROUND,to-from,250);
export const solids:Rect[]=[
 floor(0,650),floor(720,1040),floor(1290,1345),floor(1560,5140),floor(5360,WIDTH),
 // Bedside tables in the ward.
 box(290,365,65,35),box(475,340,65,60),box(880,350,70,50),
 // The high shelf, reached only from the bouncy mattress.
 box(1890,240,170,14),
 // Nurses' station: a counter to duck behind and a high route over the light.
 box(2380,358,70,42),box(2200,318,90,12),box(2340,296,100,12),box(2490,318,90,12),
 box(2900,356,60,44),
 // Laundry shelf above the vent, past the hot steam.
 box(3770,235,180,14),
 // Raised deck over the flooded floor.
 box(5510,290,50,14),box(5630,290,130,14),
];
export const CRUMBLE:Rect[]=[box(1350,GROUND,60,16),box(1420,GROUND,60,16),box(1490,GROUND,60,16),box(5565,290,60,14)];
export const CRUMBLE_DELAY=.55,CRUMBLE_BACK=3.2;
export const DOOR=box(2740,120,22,280);
export const CARD={x:1975,y:205};
export const SPRING={x:1810,w:50};
export const puddles=[{x:800,w:50},{x:2030,w:50}];
export const FLOOD={x:5410,w:370};
export const BELTS=[{x:3250,w:230,v:-105},{x:3520,w:150,v:125}];
export const VENT={x:3700,w:46};
export const VENT_ON=1.7,VENT_OFF=.9;
export const STEAM=[{x:3985,w:52,phase:0},{x:4095,w:52,phase:1.2}];
export const STEAM_CYCLE=2.4,STEAM_ON=1.1,STEAM_WARN=.5;
export const CHAIR={x:4300};
export const RIDE=3.4,RIDE_SPEED=285,RIDE_END=5075;
export const BUMPS=[4470,4650,4830,4990];
export const JOKE_DOOR=4130;
export const bonuses=[{x:505,y:302},{x:1165,y:330},{x:1450,y:340},{x:1920,y:205},{x:2390,y:262},{x:2930,y:318},{x:3400,y:355},{x:3850,y:200},{x:4050,y:345},{x:4470,y:330},{x:4830,y:330},{x:5595,y:240},{x:5960,y:345}];
export const SLIPPER_PICKUPS=[{x:3130,y:365},{x:4160,y:365}];
export const SCREENS=[2290,2470,2640,2850,3040,5870,6050];
export const CHECKPOINTS=[55,1000,2120,3180,4200,5100];
export const CONE=175,CONE_TOP=335,THROW=190,LURE_TIME=2.6,LURE_RANGE=340;
export const NURSES=[{from:2200,to:2660,speed:55},{from:2800,to:3120,speed:72},{from:5800,to:6130,speed:88}];
export const cartX=(time:number)=>1690+65*Math.sin(time*1.4);
export const robotX=(time:number)=>2980+110*Math.sin(time*1.1);
export const ventOn=(time:number)=>time%(VENT_ON+VENT_OFF)<VENT_ON;
export const steamState=(s:{phase:number},time:number)=>{const t=(time+s.phase)%STEAM_CYCLE;return t<STEAM_ON?'on':t>STEAM_CYCLE-STEAM_WARN?'warn':'off';};
// Moving platforms: two gurneys across the gaps and one lift out of the flood.
export function movers(time:number):Rect[]{
 return [
  box(1120+75*(1+Math.sin(time*.9)),GROUND,90,14),
  box(5160+60*(1+Math.sin(time*1.25)),GROUND,90,14),
  box(5410,345-55*Math.sin(time*.8),70,14),
 ];
}
export type Nurse={x:number;facing:number;turning:boolean;listening:boolean};
/** Patrol with a short pause at each end, where the nurse turns round. */
export function nurseAt(n:number,time:number):Nurse{
 const {from,to,speed}=NURSES[n];const walk=(to-from)/speed,pause=.9,cycle=(walk+pause)*2;const t=(time+n*1.7)%cycle;
 const listening=false;
 if(t<walk)return {x:from+t*speed,facing:1,turning:false,listening};
 if(t<walk+pause)return {x:to,facing:1,turning:t>walk+pause*.4,listening};
 if(t<walk*2+pause)return {x:to-(t-walk-pause)*speed,facing:-1,turning:false,listening};
 return {x:from,facing:-1,turning:t>walk*2+pause*1.4,listening};
}
export type Lure={x:number;left:number};
export type Flight={x:number;y:number;vx:number;vy:number;target:number};
export type State={x:number;y:number;vy:number;grounded:boolean;coyote:number;buffer:number;jumpHeld:boolean;hideHeld:boolean;throwHeld:boolean;time:number;patience:number;shield:number;hits:number;collected:number[];status:'playing'|'lost'|'ending'|'done';ending:number;reason:string;lives:number;checkpoint:number;card:boolean;hidden:boolean;suspicion:number;crumble:number[];on:number;caught:number;score:number;flash:string;news:number;facing:number;slippers:number;flight:Flight|null;lures:(Lure|null)[];held:number[];ride:number;chairUsed:boolean;crashes:number;taken:number[];nearMiss:number};
export const spareHearts=(losses:number)=>Math.min(2,Math.floor(losses/2));
export const initial=(spare=0):State=>({x:55,y:GROUND,vy:0,grounded:true,coyote:.1,buffer:0,jumpHeld:false,hideHeld:false,throwHeld:false,time:0,patience:100,shield:0,hits:0,collected:[],status:'playing',ending:0,reason:'',lives:3+spare,checkpoint:0,card:false,hidden:false,suspicion:0,crumble:CRUMBLE.map(()=>0),on:-1,caught:0,score:0,flash:'',news:0,facing:1,slippers:3,flight:null,lures:NURSES.map(()=>null),held:NURSES.map(()=>0),ride:0,chairUsed:false,crashes:0,taken:[],nearMiss:0});
export type Input={move:number;jump:boolean;hide?:boolean;throwIt?:boolean};
export const screenNear=(x:number)=>SCREENS.find(sx=>Math.abs(sx-x)<30);
/** A distracted nurse stands still looking at the noise; her patrol resumes where it stopped. */
export function activeNurse(s:Pick<State,'lures'|'held'>,n:number,time:number):Nurse{
 const base=nurseAt(n,time-s.held[n]);const lure=s.lures[n];
 return lure?{...base,facing:lure.x>=base.x?1:-1,turning:false,listening:true}:base;
}
const plankUp=(t:number)=>t>=0;
function blocked(s:Pick<State,'card'|'crumble'>,time:number):Rect[]{
 return [...solids,...(s.card?[]:[DOOR]),...CRUMBLE.filter((_,i)=>plankUp(s.crumble[i])),...movers(time)];
}
/** A nurse sees forward along the floor; furniture blocks the beam and a raised route passes above it. */
export function seen(s:Pick<State,'x'|'y'|'hidden'|'card'>,n:number,time:number,nurse=nurseAt(n,time)){
 if(s.hidden||s.y<CONE_TOP)return false;
 const dx=(s.x-nurse.x)*nurse.facing;
 if(dx<=0||dx>CONE)return false;
 const lo=Math.min(s.x,nurse.x),hi=Math.max(s.x,nurse.x);
 return ![...solids,...(s.card?[]:[DOOR])].some(b=>b.y<GROUND&&b.x+b.w>lo&&b.x<hi&&b.y<=s.y-14&&b.y+b.h>=s.y-14);
}
const say=(s:State,flash:string):State=>({...s,flash,news:s.news+1});
function caught(s:State,reason:string):State{
 const lives=s.lives-1;if(lives<=0)return {...s,lives,status:'lost',reason};
 const x=CHECKPOINTS[s.checkpoint];
 return say({...s,lives,caught:s.caught+1,x,y:GROUND,vy:0,grounded:true,on:-1,hidden:false,suspicion:0,shield:1.6,patience:Math.max(15,s.patience-8),buffer:0,ride:0,reason},reason);
}
/** Throw a slipper ahead: it lands, makes a noise, and the nearest nurse looks at it. */
export function throwSlipper(s:State):State{
 if(s.status!=='playing'||s.slippers<=0||s.flight||s.ride>0)return s;
 const target=s.x+s.facing*THROW;
 return {...s,slippers:s.slippers-1,flight:{x:s.x,y:s.y-40,vx:s.facing*THROW/.55,vy:-200,target}};
}
export function step(state:State,dt:number,input:Input):State{
 if(state.status==='lost'||state.status==='done')return state;
 let s:State={...state,buffer:input.jump&&!state.jumpHeld?.12:state.buffer,jumpHeld:input.jump,hideHeld:!!input.hide,throwHeld:!!input.throwIt};
 if(s.status==='playing'&&input.hide&&!state.hideHeld){
  if(s.hidden)s={...s,hidden:false};
  else if(s.grounded&&screenNear(s.x)!==undefined&&s.ride===0)s={...s,hidden:true,x:screenNear(s.x)!,vy:0};
 }
 if(s.status==='playing'&&input.throwIt&&!state.throwHeld)s=throwSlipper(s);
 let remaining=Math.min(.1,Math.max(0,dt));
 while(remaining>1e-7){const h=Math.min(remaining,1/120);remaining-=h;
  if(s.status==='ending'){const ending=s.ending+h;s={...s,ending,status:ending>=3?'done':'ending'};continue;}if(s.status!=='playing')break;
  const time=s.time+h;
  if(s.hidden&&(input.move!==0||s.buffer>0))s={...s,hidden:false};
  let {x,y,vy,patience,shield,hits,collected,score,suspicion,ride,chairUsed,crashes,slippers,taken,facing}=s;let coyote=s.grounded?.1:Math.max(0,s.coyote-h),buffer=Math.max(0,s.buffer-h);
  // Ride whatever moving platform the hero stands on.
  const before=movers(s.time),after=movers(time);let on=s.on;
  if(on>=0){x+=after[on].x-before[on].x;y=after[on].y;}
  let jumped=false;
  if(buffer>0&&coyote>0&&!s.hidden){vy=ride>0?-400:-450;buffer=0;coyote=0;on=-1;jumped=true;}
  const crumble=s.crumble.map(t=>t>0?(t-h<=0?-CRUMBLE_BACK:t-h):t<0?Math.min(0,t+h):0);
  const world={card:s.card,crumble};const walls=blocked(world,time);
  if(input.move!==0&&ride===0)facing=Math.sign(input.move);
  // The wheelchair drives itself; on foot the hero walks, and belts drag anyone standing on them.
  let dx=s.hidden?0:ride>0?RIDE_SPEED*h:Math.max(-1,Math.min(1,input.move))*165*h;
  if(s.grounded&&Math.abs(y-GROUND)<1&&ride===0){const belt=BELTS.find(b=>x>b.x&&x<b.x+b.w);if(belt)dx+=belt.v*h;}
  let nx=Math.max(12,Math.min(WIDTH-12,x+dx));
  for(const b of walls)if(y>b.y+.01&&y-38<b.y+b.h-.01&&nx+12>b.x&&nx-12<b.x+b.w)nx=dx>0?b.x-12:dx<0?b.x+b.w+12:nx;
  x=nx;vy+=(input.jump?1100:1600)*h;let ny=y+vy*h,grounded=false;on=jumped?-1:on;let nextOn=-1;
  // Warm air from the vent carries the hero up while it blows.
  if(ventOn(time)&&x>VENT.x&&x<VENT.x+VENT.w&&ny>205){vy=Math.max(vy-1900*h,-300);ny=y+vy*h;}
  const moverBase=walls.length-3;
  walls.forEach((b,i)=>{if(x+12>b.x&&x-12<b.x+b.w){if(vy>=0&&y<=b.y+1.5&&ny>=b.y){ny=Math.min(ny,b.y);vy=0;grounded=true;if(i>=moverBase)nextOn=i-moverBase;}else if(vy<0&&y-38>=b.y+b.h&&ny-38<=b.y+b.h){ny=b.y+b.h+38;vy=0;}}});
  y=ny;on=nextOn;
  CRUMBLE.forEach((b,i)=>{if(grounded&&plankUp(crumble[i])&&crumble[i]===0&&Math.abs(y-b.y)<1&&x+12>b.x&&x-12<b.x+b.w)crumble[i]=CRUMBLE_DELAY;});
  // The mattress throws the hero far higher than a jump.
  if(grounded&&Math.abs(y-GROUND)<1&&x+10>SPRING.x&&x-10<SPRING.x+SPRING.w){vy=-650;grounded=false;on=-1;coyote=0;buffer=0;}
  patience=Math.max(0,patience-h*(zoneAt(x)===LAST_ZONE?2.6:1.45));shield=Math.max(0,shield-h);
  let flash=s.flash,news=s.news;const tell=(text:string)=>{flash=text;news++;};
  // Sit down in the chair by walking into it.
  if(!chairUsed&&grounded&&Math.abs(x-CHAIR.x)<20){chairUsed=true;ride=RIDE;tell('В КРЕСЛО!');score+=10;}
  if(ride>0){ride=Math.max(0,ride-h);if(x>=RIDE_END){ride=0;tell('ПРИЕХАЛИ!');}}
  const atFloor=y>=GROUND-2;
  const wet=atFloor&&(puddles.some(p=>x+10>p.x&&x-10<p.x+p.w)||(x+10>FLOOD.x&&x-10<FLOOD.x+FLOOD.w));
  const cart=Math.abs(x-cartX(time))<30&&y>370;
  const robot=Math.abs(x-robotX(time))<24&&y>382;
  const steam=y>GROUND-110&&STEAM.some(k=>x+8>k.x&&x-8<k.x+k.w&&steamState(k,time)==='on');
  const bump=y>GROUND-26&&BUMPS.some(b=>Math.abs(x-b)<26);
  if(bump&&ride>0&&shield===0){ride=0;crashes++;patience=Math.max(0,patience-8);shield=1.1;hits++;vy=-260;grounded=false;tell('АВАРИЯ! −8');}
  else if((wet||cart||robot||steam||bump)&&shield===0&&!s.hidden){patience=Math.max(0,patience-14);hits++;shield=1.4;tell(wet?'МОКРО! −14':robot?'РОБОТ-ПЫЛЕСОС! −14':steam?'ГОРЯЧО! −14':bump?'КОРОБКА! −14':'ТЕЛЕЖКА! −14');}
  for(let i=0;i<bonuses.length;i++)if(!collected.includes(i)&&Math.hypot(x-bonuses[i].x,y-20-bonuses[i].y)<30){collected=[...collected,i];patience=Math.min(100,patience+11);score+=20;tell('+11 ТЕРПЕНИЯ');}
  SLIPPER_PICKUPS.forEach((p,i)=>{if(!taken.includes(i)&&Math.hypot(x-p.x,y-20-p.y)<30){taken=[...taken,i];slippers++;score+=10;tell('+1 ТАПОК');}});
  let card=s.card;if(!card&&Math.hypot(x-CARD.x,y-20-CARD.y)<32){card=true;score+=30;tell('КАРТА-КЛЮЧ!');}
  let checkpoint=s.checkpoint;while(checkpoint<CHECKPOINTS.length-1&&x>=CHECKPOINTS[checkpoint+1]&&y>=GROUND-2){checkpoint++;tell('КОНТРОЛЬНАЯ ТОЧКА');}
  // The slipper lands and whichever nurse is close turns towards the noise.
  let flight=s.flight,lures=s.lures.map(l=>l&&l.left-h>0?{...l,left:l.left-h}:null),held=s.held.map((v,i)=>s.lures[i]?v+h:v);
  if(flight){flight={...flight,x:flight.x+flight.vx*h,y:flight.y+flight.vy*h,vy:flight.vy+760*h};
   if(flight.y>=GROUND-4){const at=flight.x;const near=NURSES.map((_,n)=>({n,d:Math.abs(activeNurse({lures,held},n,time).x-at)})).sort((a,b)=>a.d-b.d)[0];
    if(near&&near.d<LURE_RANGE){lures=lures.map((l,i)=>i===near.n?{x:at,left:LURE_TIME}:l);tell('«КТО ТАМ?»');}flight=null;}}
  const hidden=s.hidden;const pose={x,y,hidden,card};const staff=NURSES.map((_,n)=>activeNurse({lures,held},n,time));
  const looking=!hidden&&staff.some((nurse,n)=>seen(pose,n,time,nurse));
  suspicion=Math.max(0,Math.min(1,suspicion+h*(looking?1.9:-.9)));
  const touched=!hidden&&shield===0&&y>=GROUND-40&&staff.some(nurse=>Math.abs(nurse.x-x)<22);
  s={...s,x,y,vy,grounded,coyote,buffer,time,patience,shield,hits,collected,score,suspicion,crumble,on,card,checkpoint,flash,news,reason:'',ride,chairUsed,crashes,slippers,taken,facing,flight,lures,held};
  if(y>560)s=caught(s,'ПРОВАЛИЛСЯ!');
  else if(touched||suspicion>=1)s=caught(s,'«А вы куда?» Назад!');
  else if(patience<=0)s={...s,status:'lost',reason:'Терпение закончилось.'};
  else if(x>=GOAL&&y>=350)s={...s,status:'ending'};
 }
 return s;
}
export const finalScore=(s:State)=>s.score+Math.round(s.patience)*2+Math.max(0,s.lives)*40;
export const nightRating=(s:State)=>s.status==='lost'?0:s.collected.length>=bonuses.length*.6&&s.lives>=3&&s.hits<=3?3:s.lives>=2||s.collected.length>=bonuses.length*.5?2:1;
