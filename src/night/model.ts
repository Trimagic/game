export type Rect={x:number;y:number;w:number;h:number};
export const WIDTH=2600,GOAL=2480;
export const solids:Rect[]=[{x:0,y:400,w:650,h:250},{x:720,y:400,w:730,h:250},{x:1530,y:400,w:1070,h:250},...[[290,365,65,35],[475,340,65,60],[900,355,75,45],[1130,330,60,70],[1700,350,70,50],[1940,365,60,35],[2120,338,70,62]].map(([x,y,w,h])=>({x,y,w,h}))];
export const puddles=[{x:800,w:50},{x:1810,w:55},{x:2280,w:60}];
export const bonuses=[{x:505,y:302},{x:1160,y:292},{x:2150,y:300}];
export const cartX=(time:number)=>1240+65*Math.sin(time*1.3);
export type State={x:number;y:number;vy:number;grounded:boolean;coyote:number;buffer:number;jumpHeld:boolean;time:number;patience:number;shield:number;hits:number;collected:number[];status:'playing'|'lost'|'ending'|'done';ending:number;reason:string};
export const initial=():State=>({x:55,y:400,vy:0,grounded:true,coyote:.1,buffer:0,jumpHeld:false,time:0,patience:100,shield:0,hits:0,collected:[],status:'playing',ending:0,reason:''});
export type Input={move:number;jump:boolean};
export function step(state:State,dt:number,input:Input):State{
 if(state.status==='lost'||state.status==='done')return state;
 let s={...state,buffer:input.jump&&!state.jumpHeld ? .12 : state.buffer,jumpHeld:input.jump},remaining=Math.min(.1,Math.max(0,dt));
 while(remaining>1e-7){const h=Math.min(remaining,1/120);remaining-=h;
  if(s.status==='ending'){const ending=s.ending+h;s={...s,ending,status:ending>=3?'done':'ending'};continue;}if(s.status!=='playing')break;
  let {x,y,vy,patience,shield,hits,collected}=s;let coyote=s.grounded ? .1 : Math.max(0,s.coyote-h),buffer=Math.max(0,s.buffer-h);
  if(buffer>0&&coyote>0){vy=-450;buffer=0;coyote=0;}
  const dx=Math.max(-1,Math.min(1,input.move))*165*h;let nx=Math.max(12,Math.min(WIDTH-12,x+dx));
  for(const b of solids)if(y>b.y+.01&&y-38<b.y+b.h-.01&&nx+12>b.x&&nx-12<b.x+b.w)nx=dx>0?b.x-12:dx<0?b.x+b.w+12:nx;
  x=nx;vy+=(input.jump?1100:1600)*h;let ny=y+vy*h,grounded=false;
  for(const b of solids)if(x+12>b.x&&x-12<b.x+b.w){if(vy>=0&&y<=b.y+.01&&ny>=b.y){ny=Math.min(ny,b.y);vy=0;grounded=true;}else if(vy<0&&y-38>=b.y+b.h&&ny-38<=b.y+b.h){ny=b.y+b.h+38;vy=0;}}
  y=ny;const time=s.time+h;patience=Math.max(0,patience-h*2.3);shield=Math.max(0,shield-h);
  const wet=y>=398&&puddles.some(p=>x+10>p.x&&x-10<p.x+p.w);
  const cart=Math.abs(x-cartX(time))<30&&y>370&&y-38<400;
  if((wet||cart)&&shield===0){patience=Math.max(0,patience-18);hits++;shield=1.4;}
  for(let i=0;i<bonuses.length;i++)if(!collected.includes(i)&&Math.hypot(x-bonuses[i].x,y-20-bonuses[i].y)<30){collected=[...collected,i];patience=Math.min(100,patience+12);}
  const lost=y>560||patience<=0;const status=lost?'lost':x>=GOAL&&y>=350?'ending':'playing';
  s={...s,x,y,vy,grounded,coyote,buffer,time,patience,shield,hits,collected,status,reason:y>560?'Не перепрыгнул ремонтный участок.':patience<=0?'Терпение закончилось.':''};
 }
 return s;
}
