export type Point={x:number;y:number};
export const END=40;
export const furniture=[{x:38,y:170,w:104,h:36},{x:275,y:170,w:104,h:36},{x:155,y:285,w:110,h:38}];
export type Rival=Point&{id:number;stun:number;cooldown:number};
export type Nut=Point&{vx:number;vy:number;life:number};
export type RemoteState={time:number;hero:Point;facing:Point;rivals:Rival[];nuts:Nut[];cooldown:number;stun:number;hits:number;bumps:number;status:'playing'|'ending'|'done'|'lost';ending:number};
export const initial=():RemoteState=>({time:0,hero:{x:210,y:385},facing:{x:0,y:-1},rivals:[{x:50,y:115},{x:370,y:115},{x:45,y:400},{x:375,y:400}].map((p,id)=>({...p,id,stun:0,cooldown:1})),nuts:[],cooldown:0,stun:0,hits:0,bumps:0,status:'playing',ending:0});
export function free(p:Point,r=13){return p.x>=20+r&&p.x<=400-r&&p.y>=98+r&&p.y<=433-r&&!furniture.some(b=>p.x+r>b.x&&p.x-r<b.x+b.w&&p.y+r>b.y&&p.y-r<b.y+b.h);}
function move(p:Point,dx:number,dy:number,r=13){let n=p;if(free({x:p.x+dx,y:p.y},r))n={x:p.x+dx,y:p.y};if(free({x:n.x,y:n.y+dy},r))n={x:n.x,y:n.y+dy};return n;}
export function fire(s:RemoteState):RemoteState{if(s.status!=='playing'||s.cooldown>0||s.stun>0)return s;const targets=s.rivals.filter(e=>e.stun===0).sort((a,b)=>Math.hypot(a.x-s.hero.x,a.y-s.hero.y)-Math.hypot(b.x-s.hero.x,b.y-s.hero.y));const target=targets[0];const d=target?{x:target.x-s.hero.x,y:target.y-s.hero.y}:s.facing;const length=Math.hypot(d.x,d.y)||1;return {...s,cooldown:.32,nuts:[...s.nuts,{...s.hero,vx:d.x/length*310,vy:d.y/length*310,life:1.4}]};}
export function tick(state:RemoteState,dt:number,input:Point):RemoteState{
 if(state.status==='done'||state.status==='lost')return state;let s=state,remaining=Math.min(.1,Math.max(0,dt));
 while(remaining>1e-6){const h=Math.min(remaining,1/120);remaining-=h;
  if(s.status==='ending'){const ending=s.ending+h;s={...s,ending,status:ending>=4?'done':'ending'};continue;}
  if(s.status==='done'||s.status==='lost')break;
  const len=Math.hypot(input.x,input.y);const dir=len?{x:input.x/len,y:input.y/len}:s.facing;
  const hero=s.stun>0||!len?s.hero:move(s.hero,dir.x*148*h,dir.y*148*h);
  let hits=s.hits,bumps=s.bumps,stun=Math.max(0,s.stun-h);
  let rivals=s.rivals.map(e=>{const cooldown=Math.max(0,e.cooldown-h),freeze=Math.max(0,e.stun-h);const d=Math.hypot(hero.x-e.x,hero.y-e.y)||1;const speed=39+s.time*.6;
   const moved=freeze?e:move(e,(hero.x-e.x)/d*speed*h,(hero.y-e.y)/d*speed*h);
   return {...moved,id:e.id,stun:freeze,cooldown};});
  const nuts:Nut[]=[];for(const n of s.nuts){const p={...n,x:n.x+n.vx*h,y:n.y+n.vy*h,life:n.life-h};if(p.life<=0||!free(p,3))continue;const index=rivals.findIndex(e=>e.stun===0&&Math.hypot(e.x-p.x,e.y-p.y)<17);if(index>=0){hits++;rivals=rivals.map((e,i)=>i===index?{...e,stun:1.8}:e);}else nuts.push(p);}
  const caught=rivals.some(e=>e.stun===0&&Math.hypot(e.x-hero.x,e.y-hero.y)<26);
  const time=Math.min(END,s.time+h);s={...s,hero,facing:dir,rivals,nuts,time,hits,bumps,stun,cooldown:Math.max(0,s.cooldown-h),status:caught?'lost':time>=END?'ending':'playing'};
 }
 return s;
}

