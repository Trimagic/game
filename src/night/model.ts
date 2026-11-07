export type Rect={x:number;y:number;w:number;h:number};
export const WIDTH=16020,GOAL=15880,GROUND=400;
export const ZONES=[
 {from:0,name:'Палата',hint:'Тумбочки перепрыгивай, жетоны возвращают терпение. С кровати можно подпрыгнуть выше.'},
 {from:1040,name:'Ремонт',hint:'Каталка везёт над разрывом, доски проваливаются, штукатурка падает на тень. С матраса с зажатым прыжком долетишь до верхней полки.'},
 {from:2100,name:'Пост медсестры',hint:'В луч нельзя: прячься за ширму, иди верхом или брось тапок. Выключатель на стене гасит свет: подпрыгни к нему.'},
 {from:3180,name:'Прачечная',hint:'Ленты тянут вперёд и назад. Вентиляция поднимает наверх, а красный пар лучше переждать.'},
 {from:4200,name:'Длинный коридор',hint:'Садись в кресло: оно мчит само! Коробки перепрыгивай, а под лампами не прыгай.'},
 {from:5100,name:'Столовая',hint:'Прыгай по столам. Тележки катаются, тарелки падают на тень, а в киселе ноги вязнут.'},
 {from:6100,name:'Мокрый холл',hint:'Пол скользит! Хватай стойку капельницы: она разгоняется и тормозит не сразу. Таблички перепрыгивай.'},
 {from:7100,name:'Рентген',hint:'Когда мигает красная лампа, луч пройдёт по всей комнате. Успей за свинцовую ширму!'},
 {from:8000,name:'Затопленный склад',hint:'Вода бьёт по терпению. Запрыгни на робота-пылесоса и доедь на нём, на острове пересядь.'},
 {from:9100,name:'Вентшахта',hint:'Пола нет! Кислородный баллон несёт вверх, пока держишь прыжок. Следи за запасом и искрами.'},
 {from:10000,name:'Тихая палата',hint:'Все спят. Скрипучие доски перепрыгивай: каждый скрип будит подозрение. Тут тоже есть выключатель.'},
 {from:11000,name:'Лаборатория',hint:'Прессы бьют по расписанию. Площадки над провалом мигают и исчезают: не задерживайся.'},
 {from:12000,name:'Переход',hint:'На улице ветер! В порыв не прыгай: дождись затишья, иначе сдует в провал.'},
 {from:13100,name:'Спуск',hint:'Каталка несётся вниз ещё быстрее кресла. Коробки перепрыгивай, под лампами не прыгай.'},
 {from:14100,name:'Финишный рывок',hint:'Терпение тает быстрее! Пол затоплен, подняться можно на подъёмнике. А у двери за тобой погонятся!'},
];
export const LAST_ZONE=ZONES.length-1;
export const zoneAt=(x:number)=>{let z=0;ZONES.forEach((zone,i)=>{if(x>=zone.from)z=i;});return z;};
const box=(x:number,y:number,w:number,h:number):Rect=>({x,y,w,h});
const floor=(from:number,to:number)=>box(from,GROUND,to-from,250);
// The original last zone moved along by this much when the new zones went in.
const F=9000;
export const solids:Rect[]=[
 floor(0,650),floor(720,1040),floor(1290,1345),floor(1560,9200),floor(9960,11400),floor(11800,12260),floor(12350,12560),floor(12670,12860),floor(12950,5140+F),floor(5360+F,WIDTH),
 // Bedside tables in the ward.
 box(290,365,65,35),box(475,340,65,60),box(880,350,70,50),
 // The high shelf, reached only from the bouncy mattress.
 box(1890,240,170,14),
 // Nurses' station: a counter to duck behind and a high route over the light.
 box(2380,358,70,42),box(2200,318,90,12),box(2340,296,100,12),box(2490,318,90,12),
 box(2900,356,60,44),
 // Laundry shelf above the vent, past the hot steam.
 box(3770,235,180,14),
 // Canteen tables and a shelf above the kissel.
 box(5260,360,80,40),box(5450,340,90,60),box(5640,360,80,40),box(5790,300,90,12),
 // X-ray room ledges with tokens: the beam does not care how high you are.
 box(7370,330,60,12),box(7570,330,60,12),
 // Island between the two robots in the warehouse.
 box(8490,372,70,28),
 // Shaft beams: up and down, a slalom for the oxygen tank.
 box(9340,70,34,170),box(9500,290,34,270),box(9660,70,34,190),box(9810,280,34,280),
 // Quiet ward: a cabinet to duck behind.
 box(10480,358,70,42),
 // Chase: furniture in the way of the last sprint.
 box(15300,365,60,35),box(15500,350,60,50),
 // Raised deck over the flooded floor.
 box(5510+F,290,50,14),box(5630+F,290,130,14),
];
export const CRUMBLE:Rect[]=[box(1350,GROUND,60,16),box(1420,GROUND,60,16),box(1490,GROUND,60,16),box(5565+F,290,60,14)];
export const CRUMBLE_DELAY=.55,CRUMBLE_BACK=3.2;
export const DOOR=box(2740,120,22,280);
export const CARD={x:1975,y:205};
export const SPRING={x:1810,w:50};
export const BOUNCERS=[{x:745,w:44,v:-520,kind:'bed'},{x:SPRING.x,w:SPRING.w,v:-650,kind:'mattress'},{x:4042,w:40,v:-520,kind:'basket'}];
export const puddles=[{x:800,w:50},{x:2030,w:50},{x:15420,w:50}];
export const FLOOD={x:5410+F,w:370};
export const FLOODS=[FLOOD,{x:8060,w:970}];
export const BELTS=[{x:3250,w:230,v:-105},{x:3520,w:150,v:125},{x:15630,w:120,v:-80}];
export const VENT={x:3700,w:46};
export const VENT_ON=1.7,VENT_OFF=.9;
export const STEAM=[{x:3985,w:52,phase:0},{x:4095,w:52,phase:1.2}];
export const STEAM_CYCLE=2.4,STEAM_ON=1.1,STEAM_WARN=.5;
// Things to ride. Chair and gurney drive themselves, the IV stand has inertia, the tank flies.
export type RideKind='chair'|'scooter'|'tank'|'gurney';
export const RIDES:{kind:RideKind;x:number;end:number;speed:number}[]=[
 {kind:'chair',x:4300,end:5075,speed:285},
 {kind:'scooter',x:6130,end:6990,speed:300},
 {kind:'tank',x:9160,end:9980,speed:190},
 {kind:'gurney',x:13130,end:14040,speed:340},
];
export const TANK_FUEL=7;
export const BUMPS=[4470,4760,4990,6340,6560,6780,6900,13320,13640,13950];
// Low lamps only touch you if you jump under them.
export const LAMPS=[4620,4880,13500,13800];
export const LAMP_BOTTOM=GROUND-85;
export const SLICK={x:6200,w:780};
export const STICKY={x:5730,w:140};
export const JOKE_DOOR=4130;
export const TROLLEYS=[{x:5400,a:40,f:1.5,ph:0},{x:5900,a:90,f:1.2,ph:1}];
export const FALLS=[{x:1625,period:2.8,phase:0},{x:1985,period:3.2,phase:1},{x:5570,period:2.6,phase:.4},{x:5990,period:3,phase:1.6},{x:8300,period:2.4,phase:.3},{x:8780,period:2.8,phase:1.2},{x:11965,period:2.5,phase:.8}];
export const FALL_WARN=.9,FALL_DROP=.3;
export const SWITCHES=[{x:2180,y:330},{x:10100,y:330}];
export const DARK_TIME=6,DARK_CONE=70;
export const XRAY={from:7140,to:7960,warn:.9,sweep:2.4,pause:2.7,w:50};
export const SPARKS=[{x:9420,y:180},{x:9590,y:330},{x:9740,y:170}];
export const SQUEAKS=[{x:10180,w:46},{x:10360,w:46},{x:10600,w:46},{x:10760,w:46}];
export const PRESSES=[{x:11130,w:54,ph:0},{x:11270,w:54,ph:.9},{x:11900,w:54,ph:1.6}];
export const PRESS_CYCLE=2.4,PRESS_DOWN=.7,PRESS_WARN=.45;
export const BLINKS=[{x:11410,ph:0},{x:11510,ph:.5},{x:11610,ph:1},{x:11710,ph:1.5}].map(b=>({...b,w:72}));
export const BLINK_CYCLE=3.2,BLINK_ON=2;
export const WIND={x:12000,w:1100,v:-85,cycle:4,gust:1.7,warn:.5};
export const CHASE_FROM=15170,CHASE_SPEED=140,CHASE_GAP=200;
export const bonuses=[{x:505,y:302},{x:1165,y:330},{x:1450,y:340},{x:1920,y:205},{x:2390,y:262},{x:2930,y:318},{x:3400,y:355},{x:3850,y:200},{x:4050,y:345},{x:4470,y:330},{x:4830,y:330},{x:5595+F,y:240},{x:5960+F,y:345},
 {x:830,y:275},{x:4062,y:285},{x:5300,y:320},{x:5495,y:300},{x:5835,y:262},{x:6050,y:365},{x:6340,y:325},{x:6660,y:365},{x:6900,y:325},{x:7400,y:292},{x:7600,y:292},{x:7820,y:365},{x:8525,y:335},{x:8240,y:330},{x:8820,y:330},{x:9265,y:300},{x:9440,y:300},{x:9735,y:300},{x:9900,y:240},{x:10300,y:365},{x:10515,y:320},{x:10820,y:365},{x:11200,y:365},{x:11546,y:340},{x:11746,y:340},{x:12160,y:365},{x:12460,y:345},{x:12760,y:345},{x:13040,y:365},{x:13320,y:330},{x:13640,y:330},{x:13950,y:330},{x:15330,y:325},{x:15530,y:310}];
export const SLIPPER_PICKUPS=[{x:3130,y:365},{x:4160,y:365},{x:7060,y:365},{x:10060,y:365},{x:14060,y:365}];
export const SCREENS=[2290,2470,2640,2850,3040,7280,7480,7680,7880,10300,10640,10840,5870+F,6050+F];
export const CHECKPOINTS=[55,1000,2120,3180,4200,5100,6100,7100,8000,9100,10000,11000,12000,13100,14100,15160];
export const CONE=175,CONE_TOP=335,THROW=190,LURE_TIME=2.6,LURE_RANGE=340;
export const NURSES=[{from:2200,to:2660,speed:55},{from:2800,to:3120,speed:72},{from:10240,to:10860,speed:88},{from:5800+F,to:6130+F,speed:100}];
export const cartX=(time:number)=>1690+65*Math.sin(time*1.4);
export const robotX=(time:number)=>2980+110*Math.sin(time*1.1);
export const trolleyX=(t:{x:number;a:number;f:number;ph:number},time:number)=>t.x+t.a*Math.sin(time*t.f+t.ph);
export const ventOn=(time:number)=>time%(VENT_ON+VENT_OFF)<VENT_ON;
export const steamState=(s:{phase:number},time:number)=>{const t=(time+s.phase)%STEAM_CYCLE;return t<STEAM_ON?'on':t>STEAM_CYCLE-STEAM_WARN?'warn':'off';};
/** Plaster and plates: a shadow first, then a drop. Returns height while falling. */
export function fallState(f:{period:number;phase:number},time:number){const t=(time+f.phase)%f.period,left=f.period-t;if(left>FALL_WARN+FALL_DROP)return {warn:false,y:null as number|null};if(left>FALL_DROP)return {warn:true,y:null as number|null};return {warn:true,y:70+(GROUND-70)*(1-left/FALL_DROP)};}
/** The X-ray beam: warning lamp, one sweep across the room, a pause. */
export function xrayState(time:number){const {warn,sweep,pause,from,to}=XRAY,t=time%(warn+sweep+pause);if(t<warn)return {warn:true,x:null as number|null};if(t<warn+sweep)return {warn:false,x:from+(to-from)*(t-warn)/sweep};return {warn:false,x:null as number|null};}
export const pressState=(p:{ph:number},time:number)=>{const t=(time+p.ph)%PRESS_CYCLE;return t<PRESS_DOWN?'down':t>PRESS_CYCLE-PRESS_WARN?'warn':'up';};
export const blinkLeft=(b:{ph:number},time:number)=>{const t=(time+b.ph)%BLINK_CYCLE;return t<BLINK_ON?BLINK_ON-t:0;};
export function windAt(x:number,time:number){if(x<WIND.x||x>WIND.x+WIND.w)return 0;return time%WIND.cycle<WIND.gust?WIND.v:0;}
export const gustSoon=(time:number)=>time%WIND.cycle>WIND.cycle-WIND.warn;
// Moving platforms: two gurneys, a lift, and two robot vacuums to ride across the water.
export function movers(time:number):Rect[]{
 return [
  box(1120+75*(1+Math.sin(time*.9)),GROUND,90,14),
  box(5160+F+60*(1+Math.sin(time*1.25)),GROUND,90,14),
  box(5410+F,345-55*Math.sin(time*.8),70,14),
  box(8090+165*(1+Math.sin(time*.85)),386,64,14),
  box(8570+195*(1+Math.sin(time*.7+1)),386,64,14),
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
export type State={x:number;y:number;vx:number;vy:number;grounded:boolean;coyote:number;buffer:number;jumpHeld:boolean;hideHeld:boolean;throwHeld:boolean;time:number;patience:number;shield:number;hits:number;collected:number[];status:'playing'|'lost'|'ending'|'done';ending:number;reason:string;lives:number;checkpoint:number;card:boolean;hidden:boolean;suspicion:number;crumble:number[];on:number;caught:number;score:number;flash:string;news:number;facing:number;slippers:number;flight:Flight|null;lures:(Lure|null)[];held:number[];ride:number;used:number[];fuel:number;crashes:number;taken:number[];nearMiss:number;dark:number;squeak:number;chaser:number|null};
export const spareHearts=(losses:number)=>Math.min(2,Math.floor(losses/2));
export const initial=(spare=0):State=>({x:55,y:GROUND,vx:0,vy:0,grounded:true,coyote:.1,buffer:0,jumpHeld:false,hideHeld:false,throwHeld:false,time:0,patience:100,shield:0,hits:0,collected:[],status:'playing',ending:0,reason:'',lives:3+spare,checkpoint:0,card:false,hidden:false,suspicion:0,crumble:CRUMBLE.map(()=>0),on:-1,caught:0,score:0,flash:'',news:0,facing:1,slippers:3,flight:null,lures:NURSES.map(()=>null),held:NURSES.map(()=>0),ride:-1,used:[],fuel:0,crashes:0,taken:[],nearMiss:0,dark:0,squeak:-1,chaser:null});
export type Input={move:number;jump:boolean;hide?:boolean;throwIt?:boolean};
export const screenNear=(x:number)=>SCREENS.find(sx=>Math.abs(sx-x)<30);
export const rideKind=(s:{ride:number})=>s.ride>=0?RIDES[s.ride].kind:null;
/** A distracted nurse stands still looking at the noise; her patrol resumes where it stopped. */
export function activeNurse(s:Pick<State,'lures'|'held'>,n:number,time:number):Nurse{
 const base=nurseAt(n,time-s.held[n]);const lure=s.lures[n];
 return lure?{...base,facing:lure.x>=base.x?1:-1,turning:false,listening:true}:base;
}
const plankUp=(t:number)=>t>=0;
function blocked(s:Pick<State,'card'|'crumble'>,time:number):Rect[]{
 return [...solids,...(s.card?[]:[DOOR]),...CRUMBLE.filter((_,i)=>plankUp(s.crumble[i])),...BLINKS.filter(b=>blinkLeft(b,time)>0).map(b=>box(b.x,GROUND,b.w,14)),...movers(time)];
}
/** A nurse sees forward along the floor; furniture blocks the beam and a raised route passes above it. */
export function seen(s:Pick<State,'x'|'y'|'hidden'|'card'>,n:number,time:number,nurse=nurseAt(n,time),cone=CONE){
 if(s.hidden||s.y<CONE_TOP)return false;
 const dx=(s.x-nurse.x)*nurse.facing;
 if(dx<=0||dx>cone)return false;
 const lo=Math.min(s.x,nurse.x),hi=Math.max(s.x,nurse.x);
 return ![...solids,...(s.card?[]:[DOOR])].some(b=>b.y<GROUND&&b.x+b.w>lo&&b.x<hi&&b.y<=s.y-14&&b.y+b.h>=s.y-14);
}
const say=(s:State,flash:string):State=>({...s,flash,news:s.news+1});
function caught(s:State,reason:string):State{
 const lives=s.lives-1;if(lives<=0)return {...s,lives,status:'lost',reason};
 const x=CHECKPOINTS[s.checkpoint];
 // Vehicles ahead of the checkpoint are waiting again, so a retry is a real retry.
 return say({...s,lives,caught:s.caught+1,x,y:GROUND,vx:0,vy:0,grounded:true,on:-1,hidden:false,suspicion:0,shield:1.6,patience:Math.max(15,s.patience-8),buffer:0,ride:-1,fuel:0,chaser:null,dark:0,used:s.used.filter(i=>RIDES[i].x<x),reason},reason);
}
/** Throw a slipper ahead: it lands, makes a noise, and the nearest nurse looks at it. */
export function throwSlipper(s:State):State{
 if(s.status!=='playing'||s.slippers<=0||s.flight||s.ride>=0)return s;
 const target=s.x+s.facing*THROW;
 return {...s,slippers:s.slippers-1,flight:{x:s.x,y:s.y-40,vx:s.facing*THROW/.55,vy:-200,target}};
}
export function step(state:State,dt:number,input:Input):State{
 if(state.status==='lost'||state.status==='done')return state;
 let s:State={...state,buffer:input.jump&&!state.jumpHeld?.12:state.buffer,jumpHeld:input.jump,hideHeld:!!input.hide,throwHeld:!!input.throwIt};
 if(s.status==='playing'&&input.hide&&!state.hideHeld){
  if(s.hidden)s={...s,hidden:false};
  else if(s.grounded&&screenNear(s.x)!==undefined&&s.ride<0)s={...s,hidden:true,x:screenNear(s.x)!,vx:0,vy:0};
 }
 if(s.status==='playing'&&input.throwIt&&!state.throwHeld)s=throwSlipper(s);
 let remaining=Math.min(.1,Math.max(0,dt));
 while(remaining>1e-7){const h=Math.min(remaining,1/120);remaining-=h;
  if(s.status==='ending'){const ending=s.ending+h;s={...s,ending,status:ending>=3?'done':'ending'};continue;}if(s.status!=='playing')break;
  const time=s.time+h;
  if(s.hidden&&(input.move!==0||s.buffer>0))s={...s,hidden:false};
  let {x,y,vx,vy,patience,shield,hits,collected,score,suspicion,ride,used,fuel,crashes,slippers,taken,facing,dark,squeak,chaser}=s;let coyote=s.grounded?.1:Math.max(0,s.coyote-h),buffer=Math.max(0,s.buffer-h);
  // Ride whatever moving platform the hero stands on.
  const before=movers(s.time),after=movers(time);let on=s.on;
  if(on>=0){x+=after[on].x-before[on].x;y=after[on].y;}
  const kind=ride>=0?RIDES[ride].kind:null,auto=kind==='chair'||kind==='gurney';
  let jumped=false;
  if(buffer>0&&coyote>0&&!s.hidden&&kind!=='tank'){vy=auto?-400:-450;buffer=0;coyote=0;on=-1;jumped=true;}
  const crumble=s.crumble.map(t=>t>0?(t-h<=0?-CRUMBLE_BACK:t-h):t<0?Math.min(0,t+h):0);
  const world={card:s.card,crumble};const walls=blocked(world,time);
  if(input.move!==0&&!auto)facing=Math.sign(input.move);
  const move=Math.max(-1,Math.min(1,input.move));
  const slick=x>SLICK.x&&x<SLICK.x+SLICK.w;
  let dx:number;
  if(s.hidden){dx=0;vx=0;}
  else if(auto){vx=RIDES[ride].speed;dx=vx*h;}
  else if(kind==='scooter'){
   // Stand on it and push: it speeds up slowly and takes a while to stop.
   const target=move*RIDES[ride].speed,rate=move===0?70:260;vx=vx<target?Math.min(target,vx+rate*h):Math.max(target,vx-rate*h);dx=vx*h;
  }else if(kind==='tank'){vx=move*RIDES[ride].speed;dx=vx*h;}
  else if(slick){const target=move*165;vx=vx<target?Math.min(target,vx+420*h):Math.max(target,vx-420*h);dx=vx*h;}
  else{vx=move*165;dx=vx*h;}
  if(s.grounded&&Math.abs(y-GROUND)<1&&!auto&&!s.hidden){
   const belt=BELTS.find(b=>x>b.x&&x<b.x+b.w);if(belt)dx+=belt.v*h;
   if(!kind&&x>STICKY.x&&x<STICKY.x+STICKY.w)dx*=.45;
  }
  if(!s.hidden)dx+=windAt(x,time)*h;
  let nx=Math.max(12,Math.min(WIDTH-12,x+dx));
  // Push out by the side the hero came from. Already inside (a fall past a floor's edge)? Stay put, never get thrown to its far end.
  for(const b of walls)if(y>b.y+.01&&y-38<b.y+b.h-.01&&nx+12>b.x&&nx-12<b.x+b.w){nx=x+12<=b.x+.01?b.x-12:x-12>=b.x+b.w-.01?b.x+b.w+12:x;vx=0;}
  x=nx;
  // The tank pulls up while jump is held and only then burns; everything else just falls.
  if(kind==='tank'){if(input.jump&&fuel>0){vy=Math.max(vy-1900*h,-240);fuel=Math.max(0,fuel-h);}vy+=650*h;}
  else vy+=(input.jump?1100:1600)*h;
  let ny=y+vy*h,grounded=false;on=jumped?-1:on;let nextOn=-1;
  // Warm air from the vent carries the hero up while it blows.
  if(ventOn(time)&&x>VENT.x&&x<VENT.x+VENT.w&&ny>205){vy=Math.max(vy-1900*h,-300);ny=y+vy*h;}
  const moverBase=walls.length-after.length;
  walls.forEach((b,i)=>{if(x+12>b.x&&x-12<b.x+b.w){if(vy>=0&&y<=b.y+1.5&&ny>=b.y){ny=Math.min(ny,b.y);vy=0;grounded=true;if(i>=moverBase)nextOn=i-moverBase;}else if(vy<0&&y-38>=b.y+b.h&&ny-38<=b.y+b.h){ny=b.y+b.h+38;vy=0;}}});
  if(ny<108){ny=108;vy=Math.max(vy,0);}
  y=ny;on=nextOn;
  CRUMBLE.forEach((b,i)=>{if(grounded&&plankUp(crumble[i])&&crumble[i]===0&&Math.abs(y-b.y)<1&&x+12>b.x&&x-12<b.x+b.w)crumble[i]=CRUMBLE_DELAY;});
  // Mattress, bed and laundry basket throw the hero up.
  if(grounded&&Math.abs(y-GROUND)<1){const bounce=BOUNCERS.find(b=>x+10>b.x&&x-10<b.x+b.w);if(bounce){vy=bounce.v;grounded=false;on=-1;coyote=0;buffer=0;}}
  patience=Math.max(0,patience-h*(zoneAt(x)===LAST_ZONE?2.6:1.45));shield=Math.max(0,shield-h);dark=Math.max(0,dark-h);
  let flash=s.flash,news=s.news;const tell=(text:string)=>{flash=text;news++;};
  // Get on by walking into the vehicle.
  if(ride<0&&grounded&&y>=GROUND-2){const i=RIDES.findIndex((r,n)=>!used.includes(n)&&Math.abs(x-r.x)<20);if(i>=0){ride=i;used=[...used,i];const r=RIDES[i];if(r.kind==='tank')fuel=TANK_FUEL;else if(r.kind==='scooter')vx=0;tell(r.kind==='chair'?'В КРЕСЛО!':r.kind==='gurney'?'НА КАТАЛКУ!':r.kind==='scooter'?'НА КАПЕЛЬНИЦУ!':'БАЛЛОН!');score+=10;}}
  if(ride>=0&&x>=RIDES[ride].end&&(RIDES[ride].kind!=='tank'||grounded)){ride=-1;tell('ПРИЕХАЛИ!');}
  if(ride>=0&&RIDES[ride].kind==='tank'&&fuel<=0){ride=-1;tell('БАЛЛОН ПУСТ!');}
  const rideNow=ride>=0?RIDES[ride].kind:null;
  const atFloor=y>=GROUND-2;
  const wet=atFloor&&(puddles.some(p=>x+10>p.x&&x-10<p.x+p.w)||FLOODS.some(f=>x+10>f.x&&x-10<f.x+f.w));
  const cart=Math.abs(x-cartX(time))<30&&y>370;
  const robot=Math.abs(x-robotX(time))<24&&y>382;
  const trolley=y>370&&TROLLEYS.some(t=>Math.abs(x-trolleyX(t,time))<30);
  const steam=y>GROUND-110&&STEAM.some(k=>x+8>k.x&&x-8<k.x+k.w&&steamState(k,time)==='on');
  const bump=y>GROUND-26&&BUMPS.some(b=>Math.abs(x-b)<26);
  const lamp=y-38<LAMP_BOTTOM&&y>LAMP_BOTTOM-10&&LAMPS.some(l=>Math.abs(x-l)<20);
  const fall=FALLS.some(f=>{if(Math.abs(x-f.x)>=26)return false;const {y:drop}=fallState(f,time);return drop!==null&&drop>=y-38&&drop<=y+4;});
  const xray=xrayState(time).x;const zapped=xray!==null&&Math.abs(x-xray)<XRAY.w/2+10;
  const spark=SPARKS.some(k=>Math.hypot(x-k.x,y-20-k.y)<30);
  const press=y>GROUND-120&&PRESSES.some(p=>x+8>p.x&&x-8<p.x+p.w&&pressState(p,time)==='down');
  const crashable=rideNow==='chair'||rideNow==='gurney'||rideNow==='scooter';
  if((bump||lamp)&&crashable&&shield===0){ride=-1;vx=0;crashes++;patience=Math.max(0,patience-8);shield=1.1;hits++;vy=-260;grounded=false;on=-1;tell('АВАРИЯ! −8');}
  else if((wet||cart||robot||trolley||steam||bump||lamp||fall||zapped||spark||press)&&shield===0&&!s.hidden){patience=Math.max(0,patience-14);hits++;shield=1.4;tell(wet?'МОКРО! −14':robot?'РОБОТ-ПЫЛЕСОС! −14':steam?'ГОРЯЧО! −14':bump?'ТАБЛИЧКА! −14':lamp?'ЛАМПА! −14':fall?'БАМ! −14':zapped?'РЕНТГЕН! −14':spark?'ИСКРЫ! −14':press?'ПРЕСС! −14':'ТЕЛЕЖКА! −14');}
  for(let i=0;i<bonuses.length;i++)if(!collected.includes(i)&&Math.hypot(x-bonuses[i].x,y-20-bonuses[i].y)<30){collected=[...collected,i];patience=Math.min(100,patience+11);score+=20;tell('+11 ТЕРПЕНИЯ');}
  SLIPPER_PICKUPS.forEach((p,i)=>{if(!taken.includes(i)&&Math.hypot(x-p.x,y-20-p.y)<30){taken=[...taken,i];slippers++;score+=10;tell('+1 ТАПОК');}});
  let card=s.card;if(!card&&Math.hypot(x-CARD.x,y-20-CARD.y)<32){card=true;score+=30;tell('КАРТА-КЛЮЧ!');}
  let checkpoint=s.checkpoint;while(checkpoint<CHECKPOINTS.length-1&&x>=CHECKPOINTS[checkpoint+1]&&y>=GROUND-2){checkpoint++;tell('КОНТРОЛЬНАЯ ТОЧКА');}
  if(dark===0&&SWITCHES.some(k=>Math.abs(x-k.x)<18&&y-38<k.y&&y>k.y)){dark=DARK_TIME;score+=5;tell('ЩЁЛК! ТЕМНО');}
  // Squeaky boards wake the ward: each one counts once until you step off it.
  const board=atFloor&&grounded?SQUEAKS.findIndex(b=>x+8>b.x&&x-8<b.x+b.w):-1;
  if(board>=0&&board!==squeak){suspicion=Math.min(.99,suspicion+.42);tell('СКРИП!');}
  squeak=atFloor?board:squeak;
  // The slipper lands and whichever nurse is close turns towards the noise.
  let flight=s.flight,lures=s.lures.map(l=>l&&l.left-h>0?{...l,left:l.left-h}:null),held=s.held.map((v,i)=>s.lures[i]?v+h:v);
  if(flight){flight={...flight,x:flight.x+flight.vx*h,y:flight.y+flight.vy*h,vy:flight.vy+760*h};
   if(flight.y>=GROUND-4){const at=flight.x;const near=NURSES.map((_,n)=>({n,d:Math.abs(activeNurse({lures,held},n,time).x-at)})).sort((a,b)=>a.d-b.d)[0];
    if(near&&near.d<LURE_RANGE){lures=lures.map((l,i)=>i===near.n?{x:at,left:LURE_TIME}:l);tell('«КТО ТАМ?»');}flight=null;}}
  const hidden=s.hidden;const pose={x,y,hidden,card};const staff=NURSES.map((_,n)=>activeNurse({lures,held},n,time));
  const looking=!hidden&&staff.some((nurse,n)=>seen(pose,n,time,nurse,dark>0?DARK_CONE:CONE));
  suspicion=Math.max(0,Math.min(1,suspicion+h*(looking?1.9:-.9)));
  // The last sprint: past this line a nurse runs after you, slower than you unless you stumble.
  if(chaser===null&&x>=CHASE_FROM&&y>=GROUND-2){chaser=x-CHASE_GAP;tell('«А НУ СТОЙ!»');}
  else if(chaser!==null)chaser+=CHASE_SPEED*h;
  const touched=!hidden&&shield===0&&y>=GROUND-40&&(staff.some(nurse=>Math.abs(nurse.x-x)<22)||(chaser!==null&&Math.abs(chaser-x)<22));
  s={...s,x,y,vx,vy,grounded,coyote,buffer,time,patience,shield,hits,collected,score,suspicion,crumble,on,card,checkpoint,flash,news,reason:'',ride,used,fuel,crashes,slippers,taken,facing,flight,lures,held,dark,squeak,chaser};
  if(y>560)s=caught(s,'ПРОВАЛИЛСЯ!');
  else if(touched||suspicion>=1)s=caught(s,'«А вы куда?» Назад!');
  else if(patience<=0)s={...s,status:'lost',reason:'Терпение закончилось.'};
  else if(x>=GOAL&&y>=350)s={...s,status:'ending'};
 }
 return s;
}
export const finalScore=(s:State)=>s.score+Math.round(s.patience)*2+Math.max(0,s.lives)*40;
export const nightRating=(s:State)=>s.status==='lost'?0:s.collected.length>=bonuses.length*.6&&s.lives>=3&&s.hits<=5?3:s.lives>=2||s.collected.length>=bonuses.length*.5?2:1;
