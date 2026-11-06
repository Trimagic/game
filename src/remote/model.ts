export type Point={x:number;y:number};
export const END=40;
export const NUT_RANGE=200;
export const MAX_NUTS=9;
export const furniture=[{x:38,y:170,w:104,h:36},{x:275,y:170,w:104,h:36},{x:155,y:285,w:110,h:38}];
// The evening gets busier: more neighbours, then lunch carts, then everyone hurries.
export const PHASES=[
 {from:0,name:'Тихий вечер',news:'Двое ещё дремлют. Пока можно собирать орешки.'},
 {from:10,name:'Все проснулись',news:'Все проснулись! Шустрая делает рывки: увидел «!» — уходи вбок.'},
 {from:20,name:'Развозят обед',news:'Развозят обед! Тележка сбивает всех на своей полосе, и соседей тоже.'},
 {from:30,name:'Вот-вот начнётся',news:'Вот-вот начнётся передача! Все заметно ускорились.'},
];
export const phaseAt=(time:number)=>time>=30?3:time>=20?2:time>=10?1:0;
const CART_LANES=[135,240,355,412];
const WAKE=[0,0,10,10];
const CART_WARN=1,CART_SPEED=300;
export type Rival=Point&{id:number;stun:number;cooldown:number;wake?:number;mode?:'walk'|'wind'|'dash';modeTime?:number;dash?:Point};
export type Nut=Point&{vx:number;vy:number;life:number};
export type ItemKind='bowl'|'slippers'|'pillow';
export type Item=Point&{id:number;kind:ItemKind;life:number};
export type Cart={y:number;x:number;dir:number;warn:number};
export type Flash={text:string;x:number;y:number;good:boolean};
export type RemoteState={time:number;hero:Point;facing:Point;rivals:Rival[];nuts:Nut[];cooldown:number;stun:number;hits:number;bumps:number;status:'playing'|'ending'|'done'|'lost';ending:number;lives:number;safe:number;ammo:number;score:number;boost:number;pillow:boolean;items:Item[];nextItem:number;serial:number;cart:Cart|null;nextCart:number;cartHits:number;rand:number;flashes:Flash[]};
export const initial=(seed=1):RemoteState=>({time:0,hero:{x:210,y:385},facing:{x:0,y:-1},rivals:[{x:50,y:115},{x:370,y:115},{x:45,y:400},{x:375,y:400}].map((p,id)=>({...p,id,stun:0,cooldown:id===1?4:1,wake:WAKE[id],mode:'walk' as const,modeTime:0})),nuts:[],cooldown:0,stun:0,hits:0,bumps:0,status:'playing',ending:0,lives:3,safe:0,ammo:5,score:0,boost:0,pillow:false,items:[],nextItem:4,serial:0,cart:null,nextCart:20,cartHits:0,rand:seed>>>0,flashes:[]});
export function free(p:Point,r=13){return p.x>=20+r&&p.x<=400-r&&p.y>=98+r&&p.y<=433-r&&!furniture.some(b=>p.x+r>b.x&&p.x-r<b.x+b.w&&p.y+r>b.y&&p.y-r<b.y+b.h);}
function move(p:Point,dx:number,dy:number,r=13){let n=p;if(free({x:p.x+dx,y:p.y},r))n={x:p.x+dx,y:p.y};if(free({x:n.x,y:n.y+dy},r))n={x:n.x,y:n.y+dy};return n;}
export const awake=(s:Pick<RemoteState,'time'>,e:Rival)=>s.time>=(e.wake??0);
/** Nearest neighbour the nut can reach, so holding the button never wastes the supply. */
export function nutTarget(s:RemoteState){return s.rivals.filter(e=>e.stun===0&&awake(s,e)&&Math.hypot(e.x-s.hero.x,e.y-s.hero.y)<=NUT_RANGE).sort((a,b)=>Math.hypot(a.x-s.hero.x,a.y-s.hero.y)-Math.hypot(b.x-s.hero.x,b.y-s.hero.y))[0];}
export function fire(s:RemoteState):RemoteState{
 if(s.status!=='playing'||s.cooldown>0||s.stun>0||s.ammo<=0)return s;
 const target=nutTarget(s);if(!target)return s;
 const d={x:target.x-s.hero.x,y:target.y-s.hero.y};const length=Math.hypot(d.x,d.y)||1;
 return {...s,cooldown:.32,ammo:s.ammo-1,nuts:[...s.nuts,{...s.hero,vx:d.x/length*340,vy:d.y/length*340,life:1.4}]};
}
function nextRandom(s:RemoteState){s.rand=(Math.imul(s.rand,1664525)+1013904223)>>>0;return s.rand/4294967296;}
function spawnItem(s:RemoteState):RemoteState{
 const n={...s};let p:Point={x:210,y:385};
 for(let i=0;i<20;i++){p={x:50+nextRandom(n)*320,y:125+nextRandom(n)*290};if(free(p,18)&&Math.hypot(p.x-s.hero.x,p.y-s.hero.y)>70)break;}
 const roll=nextRandom(n);const kind:ItemKind=s.nextItem>=12&&roll<.2?'slippers':s.nextItem>=16&&roll<.38?'pillow':'bowl';
 return {...n,items:[...n.items,{...p,id:n.serial,kind,life:8}],serial:n.serial+1,nextItem:s.time+4.2-phaseAt(s.time)*.4};
}
function speedOf(e:Rival,time:number){
 const base=44+time*1.05;
 return e.id===0?base*.9:e.id===3?base*1.05:base;
}
function stepRival(s:RemoteState,e:Rival,hero:Point,dir:Point,h:number):Rival{
 const cooldown=Math.max(0,e.cooldown-h),stun=Math.max(0,e.stun-h);
 if(stun>0||!awake(s,e))return {...e,stun,cooldown,mode:'walk',modeTime:0};
 // The sprinter stops, shows "!" and then dashes along a fixed line.
 if(e.id===1&&s.time>=10){
  const modeTime=Math.max(0,(e.modeTime??0)-h);
  if(e.mode==='wind'){if(modeTime>0)return {...e,stun,cooldown,modeTime};return {...e,stun,cooldown,mode:'dash',modeTime:.65};}
  if(e.mode==='dash'){const d=e.dash??{x:0,y:0};const speed=185+s.time;const moved=move(e,d.x*speed*h,d.y*speed*h);return {...moved,id:e.id,stun,cooldown:modeTime>0?cooldown:4.2-phaseAt(s.time)*.4,wake:e.wake,mode:modeTime>0?'dash':'walk',modeTime,dash:e.dash};}
  if(cooldown===0){const dx=hero.x-e.x,dy=hero.y-e.y,len=Math.hypot(dx,dy)||1;return {...e,stun,cooldown,mode:'wind',modeTime:.6,dash:{x:dx/len,y:dy/len}};}
 }
 // The interceptor aims ahead of the hero instead of at them.
 const goal=e.id===2?{x:hero.x+dir.x*70,y:hero.y+dir.y*70}:hero;
 const d=Math.hypot(goal.x-e.x,goal.y-e.y)||1;const speed=speedOf(e,s.time);
 const moved=move(e,(goal.x-e.x)/d*speed*h,(goal.y-e.y)/d*speed*h);
 return {...moved,id:e.id,stun,cooldown,wake:e.wake,mode:'walk',modeTime:0};
}
export function tick(state:RemoteState,dt:number,input:Point):RemoteState{
 if(state.status==='done'||state.status==='lost')return state;let s:RemoteState={...state,flashes:[]},remaining=Math.min(.1,Math.max(0,dt));
 while(remaining>1e-6){const h=Math.min(remaining,1/120);remaining-=h;
  if(s.status==='ending'){const ending=s.ending+h;s={...s,ending,status:ending>=4?'done':'ending'};continue;}
  if(s.status==='done'||s.status==='lost')break;
  const len=Math.hypot(input.x,input.y);const dir=len?{x:input.x/len,y:input.y/len}:s.facing;const power=Math.min(1,len);
  const pace=148*(s.boost>0?1.35:1)*power;
  const hero=s.stun>0||!len?s.hero:move(s.hero,dir.x*pace*h,dir.y*pace*h);
  let hits=s.hits,score=s.score,stun=Math.max(0,s.stun-h),lives=s.lives,safe=Math.max(0,s.safe-h),pillow=s.pillow,ammo=s.ammo,boost=Math.max(0,s.boost-h),cartHits=s.cartHits;const flashes=[...s.flashes];
  let rivals=s.rivals.map(e=>stepRival(s,e,hero,dir,h));
  const nuts:Nut[]=[];for(const n of s.nuts){const p={...n,x:n.x+n.vx*h,y:n.y+n.vy*h,life:n.life-h};if(p.life<=0||!free(p,3))continue;const index=rivals.findIndex(e=>e.stun===0&&awake(s,e)&&Math.hypot(e.x-p.x,e.y-p.y)<17);if(index>=0){hits++;score+=10;rivals=rivals.map((e,i)=>i===index?{...e,stun:1.8,mode:'walk',modeTime:0}:e);}else nuts.push(p);}
  // Items on the floor.
  let items:Item[]=[];for(const it of s.items){const life=it.life-h;if(life<=0)continue;if(Math.hypot(it.x-hero.x,it.y-hero.y)<26){score+=20;if(it.kind==='bowl'){ammo=Math.min(MAX_NUTS,ammo+3);flashes.push({text:'+3 ОРЕШКА',x:it.x,y:it.y,good:true});}else if(it.kind==='slippers'){boost=6;flashes.push({text:'ТАПОЧКИ: БЫСТРЕЕ!',x:it.x,y:it.y,good:true});}else{pillow=true;flashes.push({text:'ПОДУШКА: ЗАЩИТА',x:it.x,y:it.y,good:true});}continue;}items.push({...it,life});}
  // The lunch cart crosses one lane after a warning and flattens whoever is in it.
  let cart=s.cart;
  if(cart){
   if(cart.warn>0)cart={...cart,warn:Math.max(0,cart.warn-h)};
   else{
    cart={...cart,x:cart.x+cart.dir*CART_SPEED*h};const c=cart;
    if(stun===0&&safe===0&&!pillow&&Math.abs(c.x-hero.x)<34&&Math.abs(c.y-hero.y)<28){stun=1;safe=1.2;flashes.push({text:'ТЕЛЕЖКА!',x:hero.x,y:hero.y,good:false});}
    rivals=rivals.map(e=>{if(e.stun>0||!awake(s,e)||Math.abs(c.x-e.x)>=34||Math.abs(c.y-e.y)>=28)return e;cartHits++;score+=30;flashes.push({text:'+30 ТЕЛЕЖКОЙ!',x:e.x,y:e.y,good:true});return {...e,stun:2.2,mode:'walk',modeTime:0};});
    if(c.x<-40||c.x>460)cart=null;
   }
  }
  const time=Math.min(END,s.time+h);
  // A catch costs a heart unless the pillow takes it; the catcher is left stunned.
  const catcher=safe>0?-1:rivals.findIndex(e=>e.stun===0&&awake(s,e)&&Math.hypot(e.x-hero.x,e.y-hero.y)<24);
  if(catcher>=0){
   rivals=rivals.map((e,i)=>i===catcher?{...e,stun:1.5,mode:'walk',modeTime:0}:e);safe=1.9;
   if(pillow){pillow=false;flashes.push({text:'ПОДУШКА СПАСЛА!',x:hero.x,y:hero.y,good:true});}
   else{lives--;flashes.push({text:'ЧУТЬ НЕ ОТОБРАЛИ!',x:hero.x,y:hero.y,good:false});}
  }
  s={...s,hero,facing:dir,rivals,nuts,time,hits,score,stun,lives,safe,pillow,ammo,boost,items,cart,cartHits,flashes,cooldown:Math.max(0,s.cooldown-h),status:lives<=0?'lost':time>=END?'ending':'playing'};
  if(s.status==='playing'&&time>=s.nextItem&&s.items.length<4)s=spawnItem(s);
  if(s.status==='playing'&&time>=s.nextCart&&!s.cart){const dirSign=nextRandom(s)<.5?1:-1;const lane=CART_LANES[Math.floor(nextRandom(s)*CART_LANES.length)];s={...s,cart:{y:lane,x:dirSign>0?-30:450,dir:dirSign,warn:CART_WARN},nextCart:time+(phaseAt(time)===3?3.6:5)};}
 }
 return s;
}
export const totalScore=(s:RemoteState)=>s.score+s.lives*50;
export const remoteRating=(s:RemoteState)=>s.status==='lost'?0:s.lives>=2&&totalScore(s)>=450?3:s.lives>=2||totalScore(s)>=300?2:1;
