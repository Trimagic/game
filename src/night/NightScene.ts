import {sound} from '../audio/sound';
import {haptics} from '../haptics';
import {saveBest} from '../best';
import Phaser from 'phaser';
import SceneBase from '../arcade/SceneBase';
import type {ArcadeEvents} from '../arcade/types';
import {activeNurse,BELTS,blinkLeft,BLINKS,bonuses,BOUNCERS,BUMPS,CARD,cartX,CHECKPOINTS,CONE,CONE_TOP,CRUMBLE,DARK_CONE,DOOR,fallState,FALLS,finalScore,FLOODS,GOAL,GROUND,gustSoon,initial,JOKE_DOOR,LAMP_BOTTOM,LAMPS,LAST_ZONE,LURE_RANGE,movers,nightRating,NURSES,pressState,PRESSES,puddles,rideKind,RIDES,robotX,SCREENS,screenNear,SLICK,SLIPPER_PICKUPS,solids,spareHearts,SPARKS,SQUEAKS,STEAM,steamState,step,STICKY,SWITCHES,TANK_FUEL,THROW,trolleyX,TROLLEYS,VENT,ventOn,WIDTH,WIND,windAt,XRAY,xrayState,ZONES,zoneAt,type RideKind,type State} from './model';
// Survives retries within a visit: the scene is rebuilt, the kindness is not.
let losses=0;
const SKY=[0x223d4c,0x2b3a48,0x2a3550,0x1f4450,0x2f3450,0x41403a,0x254a55,0x1d2c33,0x24383f,0x1a2228,0x262c44,0x213f3c,0x141f3a,0x38304a,0x3a2f46];
const SKIN=0xe8c4a4;
type Spark={x:number;y:number;vx:number;vy:number;life:number;max:number;color:number;size:number;gravity:number};
type Ring={x:number;y:number;life:number;color:number};
type Pose={nurse?:boolean;facing?:number;phase?:number;move?:number;sx?:number;sy?:number;air?:number;sit?:boolean;barefoot?:boolean;fidget?:number;alpha?:number};
const PATIENCE_LINES:[number,string][]=[[70,'Спокойно. Я взрослый человек.'],[45,'Не думать о водопаде.'],[25,'Только бы никто не чихнул…'],[12,'СЕЙЧАС. ПРЯМО СЕЙЧАС.']];
const ZONE_LINES=['','Кто чинит коридор ночью?','Тихо. Я тень.','Столько воды вокруг. Издеваются.','Ого, кресло! Вот это транспорт.','Компот. Только не компот.','Осторожно, мокрый пол. Спасибо, заметил.','Сейчас все увидят, что я съел.','Кто забыл закрыть кран? Весь кран.','Пола нет. Зато есть кислород.','Тш-ш-ш. Все спят, один я страдаю.','Руками ничего не трогать. Ногами тоже.','Свежий воздух. И дождик. Зачем дождик?!','Вниз! Каталка, родная, выручай!','Вот она, дверь! Почти!'];
const FLASH_LINES:Record<string,string>={'МОКРО! −14':'Это НЕ я! Честно.','РОБОТ-ПЫЛЕСОС! −14':'Он меня заметил!','ГОРЯЧО! −14':'Горячо, горячо, горячо!','ТАБЛИЧКА! −14':'Да вижу я, что мокро!','ЛАМПА! −14':'Кто вешает их так низко?','БАМ! −14':'Обед подан. На голову.','РЕНТГЕН! −14':'Ну вот, все кости видно.','ИСКРЫ! −14':'Бодрит!','ПРЕСС! −14':'Теперь я плоский и всё ещё хочу.','ТЕЛЕЖКА! −14':'Осторожно, пациент!','АВАРИЯ! −8':'Права отберут.','ПРИЕХАЛИ!':'Вот это сервис.','КАРТА-КЛЮЧ!':'Кто оставил ключ на шкафу?','«КТО ТАМ?»':'Это тапок. Просто тапок.','В КРЕСЛО!':'Полный вперёд!','НА КАТАЛКУ!':'Держитесь, больной!','НА КАПЕЛЬНИЦУ!':'Самокат выписан врачом.','БАЛЛОН!':'Дышите глубже. Летим!','БАЛЛОН ПУСТ!':'Ой.','ЩЁЛК! ТЕМНО':'Кто выключил свет? Не я.','СКРИП!':'Я мышка. Большая мышка.','«А НУ СТОЙ!»':'Только не подгузники!','«А вы куда?» Назад!':'Я лунатик! Честно!','ПРОВАЛИЛСЯ!':'Ремонт идёт по плану.'};
const mix=(a:number,b:number,t:number)=>{const c=(s:number)=>Math.round(((a>>s)&255)+(((b>>s)&255)-((a>>s)&255))*t);return (c(16)<<16)|(c(8)<<8)|c(0);};
export default class NightScene extends SceneBase{
 private spare=spareHearts(losses);private model=initial(this.spare);private ink!:Phaser.GameObjects.Graphics;private hud!:Phaser.GameObjects.Text;private sign!:Phaser.GameObjects.Text;private bubble!:Phaser.GameObjects.Text;private held=new Map<string,string>();private stamp=0;private zone=0;private seenNews=0;private tapped=new Set<string>();
 // Everything below only decorates the model: particles, squash, camera, hit-stop.
 private sparks:Spark[]=[];private rings:Ring[]=[];private camX=0;private walk=0;private dustAt=0;private squash=0;private freeze=0;private flashAlpha=0;private flashColor=0xd9473a;private streak=0;private lastToken=-9;private barPulse=0;private sky=SKY[0];private bubbleLeft=0;private said=new Set<string>();private beat=0;private wrecks:{x:number;kind:RideKind}[]=[];private bones=0;private lastX=55;
 constructor(events:ArcadeEvents){super('night',events);}
 create(){
  this.view={status:'ready',title:'Ночной маршрут',detail:'Доберись до туалета через пятнадцать зон. Терпение тает всё время, жетоны его возвращают. Держи прыжок, чтобы взлететь выше. Катайся на всём, что движется: кресло, капельница, робот-пылесос, кислородный баллон, каталка. От луча фонаря прячься за ширму или брось тапок. Контрольные точки и три сердца.',actions:[]};
  if(this.spare)this.view.detail=`Ночная смена притомилась: +${this.spare} к сердцам. `+this.view.detail;this.setup();
  this.box(210,280,420,560,0x172d3b);this.ink=this.add.graphics();this.hud=this.text(16,16,'',14,'#f8e9bd');this.sign=this.text(210,478,'',13,'#eee0b8',true);this.sign.setWordWrapWidth(390);
  this.bubble=this.add.text(0,0,'',{fontFamily:'Arial, sans-serif',fontSize:'13px',fontStyle:'bold',color:'#293a34',backgroundColor:'#fff5dd',padding:{x:6,y:3},resolution:2}).setOrigin(.5,1).setDepth(45).setVisible(false);
  this.camX=this.camTarget(this.model);
  this.input.keyboard?.on('keyup',(e:KeyboardEvent)=>this.held.delete(e.code));this.paint();
 }
 protected key(e:KeyboardEvent){const map:Record<string,string>={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',ArrowDown:'hide',KeyS:'hide',KeyE:'throw',KeyF:'throw'};const dir=map[e.code];if(dir){e.preventDefault();this.held.set(e.code,dir);if(dir!=='left'&&dir!=='right')this.tapped.add(dir);}}
 protected pause(){this.held.clear();this.tapped.clear();super.pause();}
 action(id:string){if(!this.running)return;if(id.startsWith('down:')){const [,dir,...source]=id.split(':');if(['left','right','jump','hide','throw'].includes(dir)){this.held.set(source.join(':'),dir);if(dir!=='left'&&dir!=='right')this.tapped.add(dir);}}else if(id.startsWith('up:'))this.held.delete(id.slice(3));}
 protected sync(){const s=this.model;this.view={status:'playing',title:s.status==='ending'?'Наконец-то дверь…':`${ZONES[zoneAt(s.x)].name} · до туалета ${Math.ceil(Math.max(0,GOAL-s.x)/20)} м · терпение ${Math.ceil(s.patience)}%`,detail:s.status==='ending'?'Кажется, самое трудное позади.':ZONES[zoneAt(s.x)].hint,actions:s.status==='playing'?[{id:'hide',label:s.hidden?'ВЫЙТИ':'ЗА ШИРМУ',disabled:!s.hidden&&screenNear(s.x)===undefined},{id:'throw',label:`ТАПОК ×${s.slippers}`,disabled:s.slippers<=0||!!s.flight||s.ride>=0}]:[]};this.bridge.publish(this.view);}
 private camTarget(s:State){const kind=rideKind(s),ahead=kind==='chair'||kind==='gurney'?150:kind==='tank'?110:kind==='scooter'?120:s.facing*60;return Phaser.Math.Clamp(s.x-210+ahead,0,WIDTH-420);}
 private emit(x:number,y:number,count:number,color:number,speed=90,size=3,gravity=420,up=.6){if(this.reduced)return;for(let i=0;i<count&&this.sparks.length<140;i++){const a=Math.random()*Math.PI*2,v=speed*(.4+Math.random()*.6),max=.3+Math.random()*.35;this.sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-speed*up,life:max,max,color,size:size*(.6+Math.random()*.6),gravity});}}
 private say(line:string,seconds=2.2){this.bubble.setText(line).setVisible(true);this.bubbleLeft=seconds;}
 private once(line:string){if(!this.said.has(line)){this.said.add(line);this.say(line);}}
 private person(x:number,y:number,o:Pose={}){const g=this.ink,nurse=!!o.nurse,f=o.facing??1,sx=o.sx??1,sy=o.sy??1,m=o.move??0,ph=o.phase??0,air=o.air??0,al=o.alpha??1,sit=!!o.sit,fidget=o.fidget??0;
  const bob=Math.abs(Math.sin(ph))*2.4*m,lift=sit?6:0,X=(d:number)=>x+d*sx,Y=(d:number)=>y+(d-bob-lift)*sy;
  const swing=Math.sin(ph)*8*m,step1=-5-swing+(sit?f*14:0),step2=5+swing+(sit?f*10:0),knock=fidget>0?Math.sin(this.model.time*16)*2:0;
  const foot=(a:number)=>y-(sit?10:Math.max(0,a)*4*m+air*7);
  g.lineStyle(5,nurse?0x32485b:SKIN,al);
  const fx1=fidget>0?-2+knock:step1,fx2=fidget>0?2-knock:step2,fy1=foot(Math.cos(ph)),fy2=foot(-Math.cos(ph));
  g.lineBetween(X(-5),Y(-8),X(fx1),fy1-2);g.lineBetween(X(5),Y(-8),X(fx2),fy2-2);
  g.fillStyle(nurse?0x32485b:o.barefoot?SKIN:0xeaa064,al);g.fillRoundedRect(X(fx1)-5.5+f*2,fy1-5,11,7,3);g.fillRoundedRect(X(fx2)-5.5+f*2,fy2-5,11,7,3);
  g.fillStyle(nurse?0x83afbf:0x3a9b8c,al);g.fillRoundedRect(X(-11),Y(-30),22*sx,27*sy,5);
  if(!nurse){g.fillStyle(0xf0e8d5,al);g.fillEllipse(X(0),Y(-27),16*sx,10*sy);}
  // Arms swing opposite the legs, go up in a jump, clutch the belly when it is urgent.
  const armEnd=fidget>0?{x:f*3,y:-12}:air>0?{x:f*11,y:-34}:sit?{x:f*12,y:-17}:{x:f*2-swing*.9,y:-12};
  g.lineStyle(4,SKIN,al);g.lineBetween(X(f*3),Y(-25),X(armEnd.x),Y(armEnd.y));
  g.fillStyle(SKIN,al);g.fillCircle(X(f),Y(-35),10*(sx+sy)/2);
  g.fillStyle(nurse?0x60453d:0xf0e8d5,al);g.fillEllipse(X(0),Y(-42),22*sx,10*sy);
  if(nurse){g.fillStyle(0xf4f1e6,al);g.fillRoundedRect(X(-7),Y(-51),14*sx,6*sy,2);}
  g.fillStyle(0x30453e,al);g.fillCircle(X(f*5),Y(-36),1.7);
  if(!nurse&&fidget>.5){g.lineStyle(1.5,0x30453e,al);g.lineBetween(X(f*2),Y(-30),X(f*8),Y(-30));}
 }
 /** Caught by the X-ray: for a moment the hero is a skeleton. */
 private skeleton(x:number,y:number){const g=this.ink;g.fillStyle(0x0f1c22,.9);g.fillRoundedRect(x-14,y-48,28,50,6);g.lineStyle(3,0xeafff8);g.lineBetween(x,y-26,x,y-8);g.lineBetween(x,y-8,x-6,y);g.lineBetween(x,y-8,x+6,y);for(let i=0;i<3;i++)g.lineBetween(x-8,y-24+i*5,x+8,y-24+i*5);g.fillStyle(0xeafff8);g.fillCircle(x,y-36,8);g.fillStyle(0x0f1c22);g.fillCircle(x-3,y-37,2);g.fillCircle(x+3,y-37,2);}
 private vehicle(kind:RideKind,x:number,y:number,tilt=0){const g=this.ink,t=this.model.time,spin=this.model.ride>=0?t*22:0,cos=Math.cos(tilt),sin=Math.sin(tilt),P=(dx:number,dy:number)=>({x:x+dx*cos-dy*sin,y:y+dy*cos+dx*sin});
  if(kind==='chair'){const wheel=P(-2,-11),seat1=P(-14,-20),seat2=P(14,-20),back=P(-15,-44),front=P(18,-5);
   g.lineStyle(4,0x4f6a78);g.lineBetween(seat1.x,seat1.y,seat2.x,seat2.y);g.lineBetween(seat1.x,seat1.y,back.x,back.y);g.lineBetween(seat2.x,seat2.y,front.x,front.y);
   g.lineStyle(3,0x1c3038);g.strokeCircle(wheel.x,wheel.y,11);g.lineStyle(2,0x8a9aa0);g.lineBetween(wheel.x-Math.cos(spin)*10,wheel.y-Math.sin(spin)*10,wheel.x+Math.cos(spin)*10,wheel.y+Math.sin(spin)*10);g.lineBetween(wheel.x+Math.sin(spin)*10,wheel.y-Math.cos(spin)*10,wheel.x-Math.sin(spin)*10,wheel.y+Math.cos(spin)*10);
   g.fillStyle(0x1c3038);g.fillCircle(front.x,front.y,4);return;}
  if(kind==='gurney'){const a=P(-34,-16),b=P(34,-16),w1=P(-24,-5),w2=P(24,-5),s1=P(-24,-16),s2=P(24,-16);g.lineStyle(7,0xdfe7e4);g.lineBetween(a.x,a.y,b.x,b.y);g.lineStyle(3,0x4f5d63);g.lineBetween(s1.x,s1.y,w1.x,w1.y);g.lineBetween(s2.x,s2.y,w2.x,w2.y);g.fillStyle(0x1c3038);g.fillCircle(w1.x,w1.y,5);g.fillCircle(w2.x,w2.y,5);return;}
  if(kind==='scooter'){const top=P(8,-62),base=P(8,-5),left=P(-16,-4),right=P(18,-4);g.lineStyle(3,0xb9c4c9);g.lineBetween(top.x,top.y,base.x,base.y);g.lineStyle(5,0x8a9aa0);g.lineBetween(left.x,left.y,right.x,right.y);g.fillStyle(0x1c3038);g.fillCircle(left.x,left.y+2,4);g.fillCircle(right.x,right.y+2,4);g.fillStyle(0xbfe3ec,.85);g.fillRoundedRect(top.x+1,top.y+2,14,20,4);return;}
  // Oxygen tank, ridden like a broom.
  const nose=P(26,-14),tail=P(-22,-14);g.lineStyle(11,0x6eb394);g.lineBetween(tail.x,tail.y,nose.x,nose.y);g.fillStyle(0xeafff8);g.fillCircle(nose.x,nose.y,5);g.lineStyle(2,0xeafff8);g.lineBetween(x-4,y-19,x-4,y-9);
 }
 private cart(x:number,food=false){const g=this.ink;g.fillStyle(food?0xbfa98a:0xa7b4af);g.fillRoundedRect(x-22,375,44,20,3);if(food){g.fillStyle(0xf4f1e6);g.fillCircle(x-9,371,6);g.fillCircle(x+9,371,6);g.fillStyle(0xd9473a);g.fillCircle(x-9,369,3);g.fillStyle(0x83b48e);g.fillCircle(x+9,369,3);}else{g.fillStyle(0xe7b577);g.fillRect(x-18,365,28,10);}g.fillStyle(0x1c3038);g.fillCircle(x-15,398,5);g.fillCircle(x+15,398,5);}
 private backdrop(cam:number,s:State){const g=this.ink,span=(from:number,to:number,gap:number,w:number,draw:(x:number,wx:number)=>void)=>{const first=Math.max(from,from+Math.floor((cam-w-from)/gap)*gap);for(let wx=first;wx<to&&wx-cam<440;wx+=gap)if(wx-cam>-w-20)draw(wx-cam,wx);};
  // Laundry: washing machines with turning drums and sheets hanging from a line.
  span(3210,4140,128,64,(x,wx)=>{g.fillStyle(0x2b5560);g.fillRoundedRect(x,GROUND-92,64,92,4);g.fillStyle(0x1b3d48);g.fillCircle(x+32,GROUND-52,21);g.lineStyle(3,0x75a7b0,.7);const a=s.time*(wx%3+3);g.lineBetween(x+32-Math.cos(a)*15,GROUND-52-Math.sin(a)*15,x+32+Math.cos(a)*15,GROUND-52+Math.sin(a)*15);g.fillStyle(0x75a7b0,.5);g.fillRect(x+8,GROUND-86,20,5);});
  span(3240,4150,190,90,(x,wx)=>{const sway=this.reduced?0:Math.sin(s.time*1.6+wx)*5;g.lineStyle(2,0x8fa6a8,.7);g.lineBetween(x-30,86,x+90,86);g.fillStyle(wx%380===0?0xe3d7c0:0xb9d0d2,.8);g.fillTriangle(x-12,86,x+38,86,x+12+sway,146);g.fillRect(x-12,86,50,26);});
  // Corridor: numbered doors and ceiling lamps.
  span(4240,5100,150,60,x=>{g.fillStyle(0x3b4068);g.fillRoundedRect(x,GROUND-110,56,110,3);g.fillStyle(0x565d8c);g.fillRect(x+10,GROUND-98,36,26);g.fillStyle(0xd9cfa8);g.fillCircle(x+46,GROUND-52,3);g.fillStyle(0xfff2b0,.8);g.fillRect(x+6,74,44,5);g.fillStyle(0xfff2b0,.08);g.fillTriangle(x+6,79,x+50,79,x+28,GROUND);});
  // Canteen: serving hatch, pots and a menu nobody wants.
  span(5140,6100,300,150,x=>{g.fillStyle(0x5a5a4e);g.fillRoundedRect(x,GROUND-140,146,60,3);g.fillStyle(0x2c2e2a);g.fillRect(x+8,GROUND-132,130,40);g.fillStyle(0x8f9aa0);g.fillRoundedRect(x+22,GROUND-112,30,20,3);g.fillRoundedRect(x+84,GROUND-112,34,20,3);if(!this.reduced){g.fillStyle(0xffffff,.28);g.fillCircle(x+36,GROUND-118-(s.time*14%10),3);g.fillCircle(x+100,GROUND-118-((s.time*14+5)%10),3);}g.fillStyle(0xe8dfc4);g.fillRect(x+40,GROUND-250,62,38);g.fillStyle(0x7c6f58);for(let i=0;i<3;i++)g.fillRect(x+47,GROUND-242+i*10,48,3);});
  // Wet hall: a shine on the floor and big reception windows.
  span(6140,7100,240,120,x=>{g.fillStyle(0x7fb7c6,.12);g.fillRect(x,GROUND-180,110,180);g.lineStyle(3,0x4d7a88,.6);g.strokeRect(x,GROUND-180,110,180);g.lineBetween(x+55,GROUND-180,x+55,GROUND);});
  // X-ray: lead walls and lightboxes with a very familiar ribcage.
  span(7130,8000,180,70,x=>{g.fillStyle(0x2f4148);g.fillRect(x,GROUND-230,70,230);g.fillStyle(0xbfe3ec,.5);g.fillRoundedRect(x+13,GROUND-205,44,58,3);g.lineStyle(2,0x1d2c33,.8);g.lineBetween(x+35,GROUND-200,x+35,GROUND-152);for(let i=0;i<4;i++)g.lineBetween(x+22,GROUND-196+i*10,x+48,GROUND-196+i*10);});
  // Warehouse: racks of boxes above the water, dripping pipes.
  span(8020,9100,210,160,x=>{g.lineStyle(4,0x4c5f66);g.lineBetween(x,GROUND-240,x,GROUND-110);g.lineBetween(x+150,GROUND-240,x+150,GROUND-110);g.lineBetween(x,GROUND-180,x+150,GROUND-180);g.lineBetween(x,GROUND-115,x+150,GROUND-115);g.fillStyle(0x8a6f4f);g.fillRect(x+12,GROUND-210,50,30);g.fillRect(x+82,GROUND-146,48,31);g.fillStyle(0x6d8087);g.fillRect(x-20,84,190,8);});
  // Shaft: no windows, cables and rungs in the dark.
  if(9100-cam<420&&10000-cam>0){g.fillStyle(0x10171b);g.fillRect(Math.max(0,9200-cam),70,Math.min(420,9960-cam)-Math.max(0,9200-cam),350);span(9220,9960,90,4,x=>{g.lineStyle(2,0x34464c);g.lineBetween(x,70,x+Math.sin(x*.03)*6,420);});}
  // Quiet ward: everybody asleep, with little Z's rising.
  span(10030,11000,260,110,(x,wx)=>{g.fillStyle(0xcfd8d6);g.fillRoundedRect(x,GROUND-34,100,22,4);g.fillStyle(0x7a8fb0);g.fillRoundedRect(x+26,GROUND-44,74,22,8);g.fillStyle(SKIN);g.fillCircle(x+14,GROUND-42,9);g.lineStyle(3,0x4f5d63);g.lineBetween(x+4,GROUND-14,x+4,GROUND);g.lineBetween(x+96,GROUND-14,x+96,GROUND);if(!this.reduced){const t=(s.time*.7+wx*.01)%1;g.lineStyle(2,0xe7e0c6,1-t);const zx=x+14+t*14,zy=GROUND-60-t*34,r=4+t*3;g.lineBetween(zx-r,zy-r,zx+r,zy-r);g.lineBetween(zx+r,zy-r,zx-r,zy+r);g.lineBetween(zx-r,zy+r,zx+r,zy+r);}});
  // Lab: shelves of flasks, slowly bubbling.
  span(11030,12000,230,120,(x,wx)=>{g.fillStyle(0x2c5650);g.fillRect(x,GROUND-170,120,8);g.fillRect(x,GROUND-100,120,8);[0xd8667a,0x83e2d6,0xf3d27b].forEach((c,i)=>{const fx=x+20+i*38;g.fillStyle(0xbfe3ec,.35);g.fillRoundedRect(fx-9,GROUND-198,18,28,5);g.fillStyle(c,.8);g.fillRoundedRect(fx-8,GROUND-186,16,15,4);if(!this.reduced){g.fillStyle(0xffffff,.5);g.fillCircle(fx,GROUND-186-((s.time*12+wx+i*7)%10),1.8);}});});
  // Bridge: outdoors, the only stretch with a real night sky.
  if(12000-cam<420&&13100-cam>0){const l=Math.max(0,12000-cam),r=Math.min(420,13100-cam);g.fillStyle(0x0e1630);g.fillRect(l,70,r-l,350);g.fillStyle(0xf3eeda);for(let i=0;i<44;i++){const sx=(i*73)%1100+12000-cam;if(sx<l||sx>r)continue;g.fillCircle(sx,84+(i*37)%190,i%5===0?1.8:1);}
   const moon=320-(cam-12000)*.06;if(moon>l-40&&moon<r+40){g.fillStyle(0xf3e7b4);g.fillCircle(moon,130,26);g.fillStyle(0x0e1630);g.fillCircle(moon+11,124,23);}
   span(12000,13100,110,6,x=>{g.lineStyle(3,0x5d6b78);g.lineBetween(x,GROUND-44,x,GROUND);g.lineBetween(x-55,GROUND-44,x+55,GROUND-44);});}
  // Ramp: arrows on the wall egg the gurney on.
  span(13120,14100,170,60,x=>{g.lineStyle(5,0xc9a46a,.5);g.lineBetween(x,GROUND-170,x+26,GROUND-150);g.lineBetween(x+26,GROUND-150,x,GROUND-130);g.lineBetween(x+22,GROUND-170,x+48,GROUND-150);g.lineBetween(x+48,GROUND-150,x+22,GROUND-130);});
 }
 private paint(){const s=this.model,g=this.ink,cam=this.camX,zone=zoneAt(s.x),vis=(x:number,w=0)=>x+w>cam-60&&x<cam+480;g.clear();
  g.fillStyle(this.sky);g.fillRect(0,70,420,350);const wall=mix(this.sky,0xffffff,.1);g.fillStyle(wall);for(let i=0;i<90;i++){const x=i*190-cam*.6;if(x<-90||x>430)continue;g.fillRoundedRect(x,110,80,105,4);g.fillStyle(0xe9d9a0);g.fillCircle(x+56,135,10);g.fillStyle(wall);g.fillCircle(x+61,131,10);g.lineStyle(3,mix(this.sky,0xffffff,.22));g.lineBetween(x+40,110,x+40,215);}
  this.backdrop(cam,s);
  if(zone===LAST_ZONE&&!this.reduced){g.fillStyle(0xd9473a,.06+.05*Math.sin(s.time*5));g.fillRect(0,70,420,350);}
  // Checkpoints are water coolers.
  CHECKPOINTS.forEach((c,i)=>{if(i===0||!vis(c))return;const x=c-cam;g.fillStyle(0xcfe7ef);g.fillRoundedRect(x-9,GROUND-52,18,20,4);g.fillStyle(i<=s.checkpoint?0x6eb394:0xb9c4c9);g.fillRoundedRect(x-11,GROUND-32,22,32,3);if(!this.reduced&&i===s.checkpoint){g.fillStyle(0xffffff,.8);g.fillCircle(x-3,GROUND-40-(s.time*24%12),2);}});
  for(const sx of SCREENS){if(!vis(sx))continue;const x=sx-cam,near=screenNear(s.x)===sx,lead=sx>=XRAY.from&&sx<=XRAY.to;g.fillStyle(lead?(near?0x9aa8ad:0x738188):near?0xf3e8c9:0xd9cfb4);for(const dx of [-22,-7,8])g.fillRect(x+dx,GROUND-60,14,60);g.lineStyle(2,lead?0x3b4a50:0x8a7d60);g.strokeRect(x-22,GROUND-60,44,60);}
  // Fake door: everyone in this hospital has tried it once.
  if(vis(JOKE_DOOR)){const x=JOKE_DOOR-cam;g.fillStyle(0x6b5a4c);g.fillRoundedRect(x-22,GROUND-92,44,92,3);g.fillStyle(0xd8e9cf);g.fillRect(x-13,GROUND-82,26,17);g.fillStyle(0x213942);g.fillCircle(x,GROUND-77,2.5);g.fillRect(x-2.5,GROUND-74,5,6);g.lineStyle(3,0xd9473a);g.lineBetween(x-15,GROUND-84,x+15,GROUND-63);g.fillStyle(0xd9cfa8);g.fillCircle(x+14,GROUND-44,3);}
  // Water, puddles, kissel and the wet shine of the hall.
  for(const f of FLOODS){if(!vis(f.x,f.w))continue;const x=f.x-cam;g.fillStyle(0x4f93a8,.75);g.fillRect(x,GROUND-6,f.w,12);if(!this.reduced){g.lineStyle(2,0xcfe7ef,.7);for(let i=0;i<f.w/46;i++){const w=x+i*48+Math.sin(s.time*3+i)*8;if(w>-20&&w<440)g.lineBetween(w,GROUND-5,w+14,GROUND-5);}}}
  for(const p of puddles){if(vis(p.x,p.w)){g.fillStyle(0x78b7c2,.8);g.fillEllipse(p.x+p.w/2-cam,398,p.w,8);}}
  for(const b of solids){if(!vis(b.x,b.w))continue;const low=b.y===GROUND,h=low?30:Math.min(b.h,430-b.y);g.fillStyle(low?0x6b807e:b.h<=14?0x9a8c74:b.w<40?0x4c5d63:0x8a7968);g.fillRoundedRect(b.x-cam,b.y,b.w,h,3);g.fillStyle(0xb6b99d);g.fillRect(b.x-cam,b.y,b.w,4);if(!low&&b.h>14&&b.w>=40){g.lineStyle(2,0x4f514d);g.lineBetween(b.x-cam+8,b.y+17,b.x-cam+b.w-8,b.y+17);}}
  if(vis(SLICK.x,SLICK.w)){g.lineStyle(2,0xcfe7ef,.5);for(let wx=SLICK.x+10;wx<SLICK.x+SLICK.w;wx+=70){const x=wx-cam;if(x>-30&&x<440)g.lineBetween(x,GROUND+2,x+34,GROUND+2);}g.fillStyle(0x9fd8e6,.16);g.fillRect(SLICK.x-cam,GROUND,SLICK.w,6);}
  if(vis(STICKY.x,STICKY.w)){const x=STICKY.x-cam;g.fillStyle(0xc65d84,.9);g.fillRoundedRect(x,GROUND-3,STICKY.w,9,4);if(!this.reduced){g.fillStyle(0xe88aac);for(let i=0;i<4;i++)g.fillCircle(x+18+i*34,GROUND-3-Math.abs(Math.sin(s.time*2+i))*3,4);}}
  // Squeaky boards: visibly cracked and a shade lighter.
  for(const b of SQUEAKS){if(!vis(b.x,b.w))continue;const x=b.x-cam,on=s.squeak>=0&&SQUEAKS[s.squeak]===b;g.fillStyle(on?0xe7c48a:0xa98e63);g.fillRect(x,GROUND-2,b.w,6);g.lineStyle(2,0x5c4630);g.lineBetween(x+8,GROUND-2,x+18,GROUND+4);g.lineBetween(x+30,GROUND+4,x+38,GROUND-2);}
  // Belts: chevrons run the way the belt pulls.
  for(const b of BELTS){if(!vis(b.x,b.w))continue;const x=b.x-cam;g.fillStyle(0x26343a);g.fillRoundedRect(x,GROUND-2,b.w,14,5);g.fillStyle(0x4f5d63);g.fillCircle(x+7,GROUND+5,6);g.fillCircle(x+b.w-7,GROUND+5,6);const dir=Math.sign(b.v),off=this.reduced?0:(s.time*b.v%26+26)%26;g.lineStyle(3,b.v<0?0xe47e65:0x83e2d6);for(let i=0;i<b.w;i+=26){const cx=x+(i+off)%b.w;if(cx<x+8||cx>x+b.w-14)continue;g.lineBetween(cx,GROUND+1,cx+dir*6,GROUND+5);g.lineBetween(cx+dir*6,GROUND+5,cx,GROUND+9);}}
  // Vent: warm air is visible while it blows.
  if(vis(VENT.x,VENT.w)){const x=VENT.x-cam,on=ventOn(s.time);g.fillStyle(on?0x8fd6c6:0x57666c);g.fillRect(x,GROUND-5,VENT.w,7);g.lineStyle(2,0x26343a);for(let i=8;i<VENT.w;i+=10)g.lineBetween(x+i,GROUND-5,x+i,GROUND+2);if(on){g.fillStyle(0xbdf0e3,.13);g.fillRect(x,205,VENT.w,GROUND-205);if(!this.reduced){g.lineStyle(2,0xeafff8,.65);for(let i=0;i<5;i++){const y=GROUND-((s.time*210+i*38)%190);g.lineBetween(x+6+i*8,y,x+6+i*8,y-14);}}}}
  // Steam: a warning fizz, then a scalding column.
  for(const k of STEAM){if(!vis(k.x,k.w))continue;const x=k.x-cam,state=steamState(k,s.time);g.fillStyle(0x7a5a4c);g.fillRoundedRect(x+k.w/2-13,GROUND-10,26,12,3);if(state==='warn'){g.fillStyle(0xd9473a);g.fillCircle(x+k.w/2,GROUND-16,Math.floor(s.time*10)%2?5:3);}else if(state==='on'){g.fillStyle(0xffe6da,.55);g.fillRoundedRect(x+4,GROUND-110,k.w-8,102,12);g.fillStyle(0xe47e65,.45);g.fillRoundedRect(x+12,GROUND-90,k.w-24,82,8);}}
  CRUMBLE.forEach((b,i)=>{const t=s.crumble[i];if(t<0||!vis(b.x,b.w))return;const shake=t>0&&!this.reduced?Math.sin(s.time*50)*2:0;g.fillStyle(t>0?0xb9825a:0xa08a6c);g.fillRect(b.x-cam+shake,b.y,b.w,b.h);g.lineStyle(2,0x5c4630);g.lineBetween(b.x-cam+b.w*.35+shake,b.y,b.x-cam+b.w*.5+shake,b.y+b.h);g.lineBetween(b.x-cam+b.w*.7+shake,b.y,b.x-cam+b.w*.6+shake,b.y+b.h);});
  // Platforms over the lab pit flicker before they go.
  for(const b of BLINKS){if(!vis(b.x,b.w))continue;const x=b.x-cam,left=blinkLeft(b,s.time);if(left>0){const fading=left<.6&&Math.floor(s.time*14)%2===0;g.fillStyle(0x83e2d6,fading?.35:.95);g.fillRoundedRect(x,GROUND,b.w,14,3);g.fillStyle(0xeafff8,fading?.2:.7);g.fillRect(x+4,GROUND+2,b.w-8,3);}else{g.lineStyle(2,0x83e2d6,.28);g.strokeRoundedRect(x,GROUND,b.w,14,3);}}
  movers(s.time).forEach((b,i)=>{const x=b.x-cam;if(x+b.w<0||x>420)return;if(i===2){g.lineStyle(3,0x8a9aa0);g.lineBetween(x+6,b.y,x+6,GROUND);g.lineBetween(x+b.w-6,b.y,x+b.w-6,GROUND);g.fillStyle(0xc4a24f);g.fillRect(x,b.y,b.w,b.h);}else if(i>=3){g.fillStyle(0x4f5d63);g.fillEllipse(x+b.w/2,b.y+7,b.w,18);g.fillStyle(0x76868c);g.fillEllipse(x+b.w/2,b.y+3,b.w-14,9);g.fillStyle(Math.floor(s.time*4)%2?0xd9473a:0xf08a78);g.fillCircle(x+b.w/2,b.y+2,3);}else{g.fillStyle(0xdfe7e4);g.fillRoundedRect(x,b.y,b.w,b.h,4);g.lineStyle(2,0x4f5d63);g.strokeRoundedRect(x,b.y,b.w,b.h,4);g.fillStyle(0x30453e);g.fillCircle(x+14,b.y+18,4);g.fillCircle(x+b.w-14,b.y+18,4);}});
  // Things that throw you: bed, mattress, laundry basket.
  for(const b of BOUNCERS){if(!vis(b.x,b.w))continue;const x=b.x-cam,near=Math.abs(s.x-b.x-b.w/2)<40&&s.y<GROUND&&s.vy<0,h=near?16:12;if(b.kind==='basket'){g.fillStyle(0xc9a46a);g.fillRoundedRect(x,GROUND-h-6,b.w,h+8,3);g.fillStyle(0xf0e8d5);g.fillEllipse(x+b.w/2,GROUND-h-6,b.w-6,10);}else{g.fillStyle(b.kind==='bed'?0x9fb6cf:0xe59370);g.fillRoundedRect(x,GROUND-h+2,b.w,h,4);g.lineStyle(2,0xfff3d6);for(let i=1;i<4;i++)g.lineBetween(x+i*12,GROUND-h+4,x+i*12,GROUND-2);if(b.kind==='bed'){g.fillStyle(0xf0e8d5);g.fillRoundedRect(x+2,GROUND-h-1,14,6,2);}}}
  if(!s.card){const x=CARD.x-cam;if(x>-20&&x<440){g.fillStyle(0xe8c04f);g.fillRoundedRect(x-12,CARD.y-8+(this.reduced?0:Math.sin(s.time*4)*3),24,16,3);g.fillStyle(0x30453e);g.fillRect(x-8,CARD.y-4,16,3);}
   const d=DOOR.x-cam;if(d>-40&&d<440){g.fillStyle(0x5c6f7a);g.fillRect(d,DOOR.y,DOOR.w,DOOR.h);g.fillStyle(0xd9473a);g.fillCircle(d+11,GROUND-70,5);}}
  else{const d=DOOR.x-cam;if(d>-40&&d<440){g.fillStyle(0x5c6f7a,.35);g.fillRect(d,DOOR.y,DOOR.w,DOOR.h);g.fillStyle(0x6eb394);g.fillCircle(d+11,GROUND-70,5);}}
  // Moon tokens spin; slippers bob.
  for(let i=0;i<bonuses.length;i++)if(!s.collected.includes(i)){const b=bonuses[i],x=b.x-cam;if(x<-20||x>440)continue;const turn=this.reduced?1:Math.abs(Math.cos(s.time*2.6+i)),y=b.y+(this.reduced?0:Math.sin(s.time*3+i)*2);g.fillStyle(0xf3d27b);g.fillEllipse(x,y,22*Math.max(.2,turn),22);if(turn>.5){g.fillStyle(0x294552);g.fillEllipse(x+5*turn,y-3,18*turn,18);}}
  SLIPPER_PICKUPS.forEach((p,i)=>{if(s.taken.includes(i)||!vis(p.x))return;const x=p.x-cam,y=p.y+(this.reduced?0:Math.sin(s.time*4+i)*3);g.fillStyle(0xfff3d6,.25);g.fillCircle(x,y,16);g.fillStyle(0xeaa064);g.fillRoundedRect(x-11,y-5,22,10,5);g.fillStyle(0xb9652f);g.fillRect(x-6,y-5,8,4);});
  {const cx=cartX(s.time)-cam;if(cx>-40&&cx<460)this.cart(cx);}
  for(const t of TROLLEYS){const cx=trolleyX(t,s.time)-cam;if(cx>-40&&cx<460)this.cart(cx,true);}
  {const rx=robotX(s.time)-cam;if(rx>-30&&rx<450){g.fillStyle(0x4f5d63);g.fillEllipse(rx,GROUND-7,38,14);g.fillStyle(Math.floor(s.time*4)%2?0xd9473a:0xf08a78);g.fillCircle(rx,GROUND-10,3);}}
  // Boxes in corridors, yellow signs on the wet floor.
  for(const b of BUMPS){if(!vis(b))continue;const x=b-cam;if(b>SLICK.x&&b<SLICK.x+SLICK.w){g.fillStyle(0xe8c04f);g.fillTriangle(x-15,GROUND,x+15,GROUND,x,GROUND-27);g.lineStyle(2,0x5c4f22);g.strokeTriangle(x-15,GROUND,x+15,GROUND,x,GROUND-27);g.fillStyle(0x30302a);g.fillRect(x-1.5,GROUND-18,3,8);g.fillCircle(x,GROUND-6,2);}else{g.fillStyle(0xc49a68);g.fillRect(x-17,GROUND-25,34,25);g.fillStyle(0xe2c79c);g.fillRect(x-4,GROUND-25,8,25);g.lineStyle(2,0x7c5c38);g.strokeRect(x-17,GROUND-25,34,25);}}
  // Low lamps on a cord.
  for(const l of LAMPS){if(!vis(l))continue;const x=l-cam;g.lineStyle(2,0x8a9aa0);g.lineBetween(x,70,x,LAMP_BOTTOM-16);g.fillStyle(0xd9cfa8);g.fillTriangle(x-20,LAMP_BOTTOM,x+20,LAMP_BOTTOM,x,LAMP_BOTTOM-18);g.fillStyle(0xfff2b0,.9);g.fillCircle(x,LAMP_BOTTOM+1,5);}
  // Falling things announce themselves with a growing shadow.
  for(const f of FALLS){if(!vis(f.x))continue;const st=fallState(f,s.time),x=f.x-cam;if(st.warn){g.fillStyle(0x0f1c22,.55);g.fillEllipse(x,GROUND+1,48,9);}if(st.y!==null){if(f.x>8000&&f.x<9100){g.fillStyle(0x9fd8e6);g.fillEllipse(x,st.y-8,12,22);}else if(f.x>5100&&f.x<6100){g.fillStyle(0xf4f1e6);g.fillEllipse(x,st.y-6,34,11);g.fillStyle(0xcfc8b4);g.fillEllipse(x,st.y-7,18,5);}else{g.fillStyle(0xcfc7b4);g.fillRoundedRect(x-17,st.y-14,34,14,3);}}}
  // Presses: the block drops on its beat and shakes before it does.
  for(const p of PRESSES){if(!vis(p.x,p.w))continue;const st=pressState(p,s.time),x=p.x-cam+(st==='warn'&&!this.reduced?Math.sin(s.time*60)*1.5:0),bottom=st==='down'?GROUND-2:GROUND-150;g.fillStyle(0x4f5d63);g.fillRect(x+p.w/2-7,70,14,bottom-70);g.fillStyle(st==='warn'?0xd9843a:st==='down'?0xd9473a:0x76868c);g.fillRoundedRect(x,bottom-34,p.w,34,3);g.lineStyle(2,0xf3d27b);for(let i=0;i<p.w-8;i+=14)g.lineBetween(x+4+i,bottom-6,x+10+i,bottom-1);}
  // Live wires in the shaft crackle.
  for(const k of SPARKS){if(!vis(k.x))continue;const x=k.x-cam,j=this.reduced?0:Math.sin(s.time*40+k.x)*6;g.lineStyle(3,0xfff2b0);g.lineBetween(x-14,k.y-8+j,x+2,k.y+j*.3);g.lineBetween(x+2,k.y+j*.3,x-3,k.y+6-j);g.lineBetween(x-3,k.y+6-j,x+14,k.y+10+j);g.fillStyle(0xfff2b0,.2);g.fillCircle(x,k.y,24);}
  // Wall switch: jump into it.
  for(const k of SWITCHES){if(!vis(k.x))continue;const x=k.x-cam;g.fillStyle(0xf0e8d5);g.fillRoundedRect(x-9,k.y-13,18,26,3);g.fillStyle(s.dark>0?0x60758a:0xe8c04f);g.fillRect(x-4,s.dark>0?k.y:k.y-8,8,8);if(s.dark===0&&!this.reduced){g.lineStyle(2,0xfff2b0,.4+.3*Math.sin(s.time*5));g.strokeRoundedRect(x-12,k.y-16,24,32,4);}}
  // Waiting vehicles and an arrow pointing at them; wrecks stay where they fell.
  RIDES.forEach((r,i)=>{if(s.used.includes(i)||!vis(r.x))return;const x=r.x-cam;this.vehicle(r.kind,x,GROUND);if(!this.reduced){const y=GROUND-82+Math.sin(s.time*6)*5;g.fillStyle(0xfff3d6);g.fillTriangle(x-9,y,x+9,y,x,y+12);}});
  for(const w of this.wrecks)if(vis(w.x))this.vehicle(w.kind,w.x-cam,GROUND,.9);
  // X-ray room: red alert, then the beam walks through it.
  const ray=xrayState(s.time);if(vis(XRAY.from,XRAY.to-XRAY.from)){if(ray.warn){g.fillStyle(0xd9473a,Math.floor(s.time*8)%2?.9:.3);for(let wx=XRAY.from;wx<XRAY.to;wx+=160){const x=wx-cam;if(x>-20&&x<440)g.fillCircle(x,82,7);}g.fillStyle(0xd9473a,.07);g.fillRect(Math.max(0,XRAY.from-cam),70,Math.min(420,XRAY.to-cam)-Math.max(0,XRAY.from-cam),330);}if(ray.x!==null){const x=ray.x-cam;g.fillStyle(0x9affd9,.32);g.fillRect(x-XRAY.w/2,70,XRAY.w,330);g.fillStyle(0xeafff8,.6);g.fillRect(x-3,70,6,330);}}
  // Wind over the bridge: streaks when it blows, a flag warns when it is about to.
  if(vis(WIND.x,WIND.w)){const blow=windAt(s.x,s.time)!==0;if(blow&&!this.reduced){g.lineStyle(2,0xcfe7ef,.6);for(let i=0;i<10;i++){const y=95+(i*31)%300,x=430-((s.time*520+i*137)%470);g.lineBetween(x,y,x+30+i*2,y);}}const pole=Math.max(WIND.x,Math.min(WIND.x+WIND.w,s.x+150))-cam;g.lineStyle(3,0x8a9aa0);g.lineBetween(pole,GROUND,pole,GROUND-70);const warn=gustSoon(s.time);g.fillStyle(blow?0xd9473a:warn?0xe8c04f:0x6eb394);if(blow)g.fillTriangle(pole,GROUND-70,pole,GROUND-48,pole-30,GROUND-59);else g.fillTriangle(pole,GROUND-70,pole,GROUND-48,pole+(warn?-20:6),GROUND-44);}
  if(s.dark>0){g.fillStyle(0x050b12,.5);g.fillRect(0,70,420,350);}
  NURSES.forEach((_,n)=>{const nurse=activeNurse(s,n,s.time),x=nurse.x-cam;if(x<-210||x>630)return;
   const reach=nurse.facing*(s.dark>0?DARK_CONE:CONE);g.fillStyle(0xfff2b0,s.suspicion>.05?.34:.2);g.fillTriangle(x+nurse.facing*8,GROUND-32,x+reach,CONE_TOP-8,x+reach,GROUND);
   const moving=!nurse.turning&&!nurse.listening;this.person(x,GROUND,{nurse:true,facing:nurse.facing,phase:nurse.x*.09,move:moving?.8:0});g.fillStyle(0x30453e);g.fillRect(x+nurse.facing*8-3,GROUND-34,7,5);
   if(nurse.turning){g.fillStyle(0xd9473a);g.fillCircle(x,GROUND-66,8);g.fillStyle(0xfff3d6);g.fillRect(x-1.5,GROUND-71,3,7);g.fillCircle(x,GROUND-62,1.6);}
   if(nurse.listening){g.fillStyle(0xf3d27b);g.fillCircle(x,GROUND-66,9);g.lineStyle(2.5,0x294552);g.beginPath();g.arc(x,GROUND-69,3.5,Math.PI,Math.PI*2.3);g.strokePath();g.fillStyle(0x294552);g.fillCircle(x,GROUND-60.5,1.6);}});
  const door=GOAL-cam;g.fillStyle(0x669b91);g.fillRoundedRect(door-17,308,48,92,3);g.fillStyle(0xd8e9cf);g.fillRect(door-8,319,29,18);g.fillStyle(0x213942);g.fillCircle(door+8,326,3);g.fillRect(door+5,329,6,6);
  const plant=door-70;g.fillStyle(0xb57f5a);g.fillRoundedRect(plant-12,378,25,22,3);g.fillStyle(0x649a68);g.fillEllipse(plant-7,368,17,28);g.fillEllipse(plant+7,361,17,30);
  if(s.status==='ending'||s.status==='done'){g.lineStyle(4,0xf0c373);g.strokeCircle(door+7,349,8);g.fillStyle(0xf0c373);g.fillRect(door-3,348,20,16);if(s.ending>1.2)this.person(door-140+Math.min(1,s.ending-1.2)*65,400,{nurse:true,phase:s.ending*7,move:s.ending<2.2?.8:0});}
  // The last nurse runs waving a pack of diapers.
  if(s.chaser!==null&&s.status==='playing'){const x=s.chaser-cam;this.person(x,GROUND,{nurse:true,phase:s.time*14,move:1});g.fillStyle(0xf4f1e6);g.fillRoundedRect(x+8,GROUND-52,22,18,3);g.fillStyle(0x83b48e);g.fillRect(x+12,GROUND-47,14,5);}
  // A thrown slipper tumbles; where it would land is marked while a nurse is around.
  const nurseNear=NURSES.some((_,n)=>Math.abs(activeNurse(s,n,s.time).x-s.x)<LURE_RANGE+THROW);
  if(s.status==='playing'&&s.slippers>0&&!s.flight&&s.ride<0&&nurseNear){const mark=s.x+s.facing*THROW-cam;g.lineStyle(2,0xeaa064,.8);g.strokeEllipse(mark,GROUND-1,24,7);g.fillStyle(0xeaa064,.8);g.fillCircle(mark,GROUND-1,2);}
  if(s.flight){const x=s.flight.x-cam,a=s.time*16,cos=Math.cos(a)*11,sin=Math.sin(a)*11;g.lineStyle(9,0xeaa064);g.lineBetween(x-cos,s.flight.y-sin,x+cos,s.flight.y+sin);}
  for(const r of this.rings){const t=1-r.life/.6;g.lineStyle(3,r.color,r.life/.6);g.strokeCircle(r.x-cam,r.y,10+t*46);}
  // The hero: walks, squashes, stretches, dances on the spot when it is urgent.
  const sx=s.x-cam,kind=rideKind(s),seated=kind==='chair'||kind==='gurney',air=(s.grounded&&kind!=='tank')||seated?0:1,moving=Math.abs(s.x-this.lastX)>.2&&s.grounded&&!kind,urgency=Phaser.Math.Clamp((40-s.patience)/30,0,1),idleDance=!moving&&s.grounded&&!s.hidden&&!kind&&urgency>0;
  const stretch=air&&!this.reduced?Phaser.Math.Clamp(Math.abs(s.vy)/1500,0,.22):0,scaleY=this.reduced?1:1-this.squash+stretch,scaleX=this.reduced?1:1+this.squash*.9-stretch*.6;
  const jitter=!this.reduced&&idleDance?Math.sin(s.time*(10+urgency*10))*(1+urgency*2.5):0,hopY=!this.reduced&&idleDance?Math.abs(Math.sin(s.time*(5+urgency*5)))*urgency*3:0;
  if(kind&&kind!=='scooter')this.vehicle(kind,sx,s.y);
  if(kind==='tank'&&s.jumpHeld&&s.fuel>0){const len=16+Math.sin(s.time*40)*5;g.fillStyle(0xf0a63d);g.fillTriangle(sx-24,s.y-20,sx-24,s.y-8,sx-24-len,s.y-14);g.fillStyle(0xfff2b0);g.fillTriangle(sx-24,s.y-17,sx-24,s.y-11,sx-24-len*.5,s.y-14);}
  if(this.bones>0)this.skeleton(sx,s.y);
  else if(s.shield===0||Math.floor(s.time*12)%2===0)this.person(sx+jitter,s.y-hopY-(kind==='scooter'?6:kind==='tank'?14:kind==='gurney'?8:0),{facing:s.facing,phase:this.walk,move:moving?1:0,sx:scaleX,sy:scaleY,air,sit:seated||kind==='tank',barefoot:s.slippers===0,fidget:idleDance?urgency:0,alpha:s.hidden?.35:1});
  if(kind==='scooter')this.vehicle(kind,sx,s.y);
  if(seated&&!this.reduced){g.lineStyle(2,0xeafff8,.55);for(let i=0;i<7;i++){const y=120+(i*43)%260,x=(i*97-s.time*900)%460+440;g.lineBetween(x,y,x+46,y);}}
  // Particles sit above the scene but under the HUD.
  for(const p of this.sparks){const a=Math.max(0,p.life/p.max);g.fillStyle(p.color,a);g.fillCircle(p.x-cam,p.y,p.size*(.5+a*.5));}
  // Urgency: the edges of the screen throb.
  if(s.patience<30&&s.status==='playing'&&!this.reduced){const a=(.12+.1*Math.sin(s.time*(5+(30-s.patience)*.2)))*(1-s.patience/40)+.04;g.fillStyle(0xd9473a,a);g.fillRect(0,70,420,16);g.fillRect(0,404,420,16);g.fillRect(0,86,14,318);g.fillRect(406,86,14,318);}
  if(this.flashAlpha>0){g.fillStyle(this.flashColor,this.flashAlpha);g.fillRect(0,70,420,350);}
  // A bubble tells the player what to press at a screen.
  const near=s.status==='playing'&&!s.hidden&&screenNear(s.x)!==undefined;if(near){g.fillStyle(0xfff3d6);g.fillRoundedRect(sx-9,s.y-72,18,18,4);g.fillStyle(0x294552);g.fillTriangle(sx-5,s.y-67,sx+5,s.y-67,sx,s.y-58);}
  this.hud.setText(`${zone+1}/${ZONES.length} ${ZONES[zone].name.toUpperCase()}\n${'♥'.repeat(Math.max(0,s.lives))}${'♡'.repeat(Math.max(0,3-s.lives))} · ТАПКИ ${s.slippers}${s.card?' · КАРТА':''} · ${Math.ceil(Math.max(0,GOAL-s.x)/20)} М · ${Math.ceil(s.patience)}%`);
  const barH=6+this.barPulse*5;g.fillStyle(0x425a60);g.fillRect(16,61-barH/2,388,barH);g.fillStyle(this.barPulse>.05?0xfff3d6:s.patience<25?0xe47e65:0xebc977);g.fillRect(16,61-barH/2,388*s.patience/100,barH);
  if(s.suspicion>0){g.fillStyle(0x1c3038);g.fillRect(sx-20,s.y-70,40,6);g.fillStyle(0xd9473a);g.fillRect(sx-20,s.y-70,40*s.suspicion,6);}
  if(kind==='tank'){g.fillStyle(0x1c3038);g.fillRect(sx-22,s.y-66,44,7);g.fillStyle(s.fuel<2?0xe47e65:0x6eb394);g.fillRect(sx-22,s.y-66,44*s.fuel/TANK_FUEL,7);}
  this.bubble.setPosition(Phaser.Math.Clamp(sx,this.bubble.width/2+6,414-this.bubble.width/2),Math.max(112,s.y-78));
  this.sign.setText(s.status==='ending'?'ЩЁЛК. Дверь не открывается.':s.hidden?'За ширмой не видно. Отсюда можно бросить тапок. Двинься, чтобы выйти.':near?'Нажми «За ширму», пока свет не дошёл':seated?'Едет само. Прыжок — через коробки, под лампами не прыгай!':kind==='scooter'?'Держи → для разгона. Тормозит не сразу. Прыжок — через таблички.':kind==='tank'?'Держи прыжок: баллон тянет вверх. Полоска — запас кислорода.':s.chaser!==null?'БЕГИ! Запнёшься — догонит!':zone===2&&!s.card&&s.x>DOOR.x-120?'Дверь заперта. Карта-ключ на высокой полке в зоне ремонта.':ZONES[zone].hint);
 }
 private fxStep(dt:number){for(const p of this.sparks){p.life-=dt;p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}this.sparks=this.sparks.filter(p=>p.life>0);for(const r of this.rings)r.life-=dt;this.rings=this.rings.filter(r=>r.life>0);this.flashAlpha=Math.max(0,this.flashAlpha-dt*2.6);this.barPulse=Math.max(0,this.barPulse-dt*4);this.bones=Math.max(0,this.bones-dt);if(this.bubbleLeft>0){this.bubbleLeft-=dt;if(this.bubbleLeft<=0)this.bubble.setVisible(false);}}
 /** Turns what changed in the model this frame into feedback. */
 private react(before:State,s:State,dt:number){
  const moved=Math.abs(s.x-before.x);if(s.grounded)this.walk+=moved*.085;
  this.squash+=(0-this.squash)*(1-Math.exp(-dt*13));
  const wet=s.y>=GROUND-2&&(puddles.some(p=>s.x>p.x&&s.x<p.x+p.w)||FLOODS.some(f=>s.x>f.x&&s.x<f.x+f.w)||(s.x>SLICK.x&&s.x<SLICK.x+SLICK.w));
  const kind=rideKind(s),wasKind=rideKind(before);
  // Landing, take-off, whatever threw you.
  if(!before.grounded&&s.grounded&&before.vy>120){this.squash=Phaser.Math.Clamp(before.vy/1300,.14,.42);this.emit(s.x,s.y-2,wet?10:7,wet?0xa7dbe5:0xc4c9b6,70,2.6,300,.35);sound.tone(110+Math.min(60,before.vy*.1),.07,'sine',.16);}
  if(before.grounded&&!s.grounded&&s.vy<0&&kind!=='tank'){if(s.vy<-480){this.squash=.3;this.emit(s.x,s.y,12,0xe59370,150,3);sound.tone(260,.1,'triangle',.22);sound.tone(620,.16,'triangle',.2,.06);this.once('Держись!');}else{this.squash=-.1;this.emit(s.x,s.y-2,4,0xc4c9b6,50,2.2,240,.2);sound.cue('jump');}}
  // Footsteps and wheels leave dust or splashes.
  this.dustAt+=moved;if(s.grounded&&this.dustAt>(kind?20:36)){this.dustAt=0;this.emit(s.x-s.facing*7,s.y-2,wet?4:kind?3:2,wet?0xa7dbe5:0xbcc2b0,wet?85:42,2.2,280,.4);}
  if(!this.reduced&&ventOn(s.time)&&s.x>VENT.x-10&&s.x<VENT.x+VENT.w+10&&s.y<GROUND&&Math.random()<dt*14)this.emit(s.x,s.y,1,0xeafff8,40,2.2,-120,.5);
  if(kind==='tank'&&s.jumpHeld&&s.fuel>0&&Math.random()<dt*30){this.emit(s.x-36,s.y-14,1,0xf0a63d,70,2.6,120,.1);if(Math.random()<.2)sound.tone(90+Math.random()*30,.05,'sawtooth',.05);}
  // Tokens: sparks and a pitch that climbs if you keep the streak going.
  if(s.collected.length>before.collected.length){const b=bonuses[s.collected[s.collected.length-1]];this.streak=s.time-this.lastToken<9?this.streak+1:0;this.lastToken=s.time;this.barPulse=1;this.emit(b.x,b.y,14,0xf3d27b,150,3,220,.15);const root=523*2**(Math.min(this.streak,10)*2/12);sound.tone(root,.09,'triangle',.24);sound.tone(root*1.5,.14,'triangle',.22,.07);haptics.cue('good');}
  if(s.taken.length>before.taken.length||(s.card&&!before.card)){this.emit(s.x,s.y-30,12,0xffe7a8,130,3,200,.2);sound.tone(660,.1,'triangle',.22);sound.tone(990,.16,'triangle',.2,.08);haptics.cue('good');}
  if(s.checkpoint>before.checkpoint){this.emit(CHECKPOINTS[s.checkpoint],GROUND-50,10,0x8fe3bd,110,2.6,200,.3);sound.tone(440,.1,'sine',.2);sound.tone(660,.15,'sine',.2,.09);}
  // The slipper lands with a noise that is visible as a ring.
  if(before.flight&&!s.flight){this.rings.push({x:before.flight.x,y:GROUND-6,life:.6,color:0xfff3d6});this.emit(before.flight.x,GROUND-4,6,0xc4c9b6,70,2.4);sound.tone(170,.09,'square',.2);}
  if(s.slippers<before.slippers)sound.tone(420,.08,'sine',.16);
  if(kind&&!wasKind){this.emit(s.x,s.y-10,8,0xbcc2b0,90,2.6);sound.tone(196,.12,'sawtooth',.14);sound.tone(392,.2,'sawtooth',.12,.09);}
  if(s.dark>0&&before.dark===0)sound.tone(900,.04,'square',.2);
  if(s.chaser!==null&&before.chaser===null)sound.tone(740,.3,'sawtooth',.14);
  if(s.crashes>before.crashes&&wasKind){this.wrecks.push({x:s.x+20,kind:wasKind});this.emit(s.x,s.y-14,22,0xe2c79c,220,3.4);}
  // Hits: stop the world for an instant so the blow lands.
  const caught=s.caught>before.caught;
  if(s.hits>before.hits&&!caught){this.emit(s.x,s.y-24,10,0xf08a78,160,3);this.flashAlpha=.22;this.flashColor=0xd9473a;if(!this.reduced){this.freeze=75;this.cameras.main.shake(120,.006);}if(s.status!=='lost')sound.cue('hit');}
  if(caught){this.emit(before.x,before.y-24,18,0xf8e9bd,200,3.2);this.flashAlpha=.5;this.flashColor=0xffffff;this.squash=.3;this.camX=this.camTarget(s);this.wrecks=this.wrecks.filter(w=>w.x<CHECKPOINTS[s.checkpoint]);haptics.cue('error');sound.tone(150,.2,'sawtooth',.18);if(!this.reduced){this.freeze=130;this.cameras.main.shake(180,.009);}}
  // Patience: lines at thresholds and a heartbeat when it is close.
  for(const [at,line] of PATIENCE_LINES)if(s.patience<at&&before.patience>=at)this.say(line,2.6);
  if(s.patience<25&&s.status==='playing'){this.beat-=dt;if(this.beat<=0){this.beat=.45+s.patience*.022;sound.tone(68,.1,'sine',.24);sound.tone(58,.11,'sine',.2,.13);}}
  if(s.hidden&&!before.hidden)this.once('Я ширма. Меня нет.');
  if(s.suspicion>.55&&before.suspicion<=.55&&this.bubbleLeft<=0)this.say('Я вешалка. Я просто вешалка.',1.4);
  if(Math.abs(s.x-JOKE_DOOR)<34&&s.y>=GROUND-2)this.once('«Туалет»? Табличка врёт: кладовка.');
  if(s.news!==this.seenNews){this.seenNews=s.news;if(s.flash==='РЕНТГЕН! −14'&&!this.reduced)this.bones=.55;if(s.flash==='СКРИП!')sound.tone(1200,.06,'square',.08);this.pop(Phaser.Math.Clamp(s.x-this.camX,80,340),Math.max(110,s.y-118),s.flash,caught||s.flash==='ПРОВАЛИЛСЯ!'?'#aa4933':'#286b56',false);const line=FLASH_LINES[s.flash];if(line)this.say(line);}
  const zone=zoneAt(s.x);if(zone>this.zone){this.zone=zone;this.pop(210,120,`${zone+1}/${ZONES.length} ${ZONES[zone].name.toUpperCase()}`,'#9b5725');if(ZONE_LINES[zone])this.say(ZONE_LINES[zone]);}
  this.sky=mix(this.sky,SKY[zoneAt(s.x)],1-Math.exp(-dt*2.5));
  this.camX+=(this.camTarget(s)-this.camX)*(1-Math.exp(-dt*(kind?6:3.6)));
 }
 update(_t:number,delta:number){if(!this.running)return;if(delta>500){this.pause();return;}const dt=delta/1000;this.fxStep(dt);
  if(this.freeze>0){this.freeze-=delta;this.paint();return;}
  const values=[...this.held.values()];const before=this.model;
  // A press shorter than one frame still counts for that frame.
  const press=(name:string)=>values.includes(name)||this.tapped.has(name);
  this.model=step(this.model,dt,{move:Number(values.includes('right'))-Number(values.includes('left')),jump:press('jump'),hide:press('hide'),throwIt:press('throw')});this.tapped.clear();const s=this.model;
  this.lastX=before.x;this.react(before,s,dt);
  this.paint();
  if(s.status==='lost'){losses++;this.held.clear();this.finish(false,'Не добрался.',`${s.reason} Зона ${zoneAt(s.x)+1} из ${ZONES.length}, «${ZONES[zoneAt(s.x)].name}». Жетоны возвращают терпение, у ширмы жми «За ширму», тапок отвлекает медсестру. ${losses%2===1?'В следующий раз смена устанет: будет лишнее сердце.':''}`);return;}
  if(s.status==='done'){losses=0;this.running=false;const stars=nightRating(s),total=finalScore(s),saved=saveBest('night-best',total);this.bridge.publish({status:'story',title:`${'★'.repeat(stars)}${'☆'.repeat(3-stars)} Закрыто на ночь.`,detail:`${total} очков, жетонов ${s.collected.length} из ${bonuses.length}, поймали ${s.caught} раз. ${saved.record?'Новый личный рекорд!':`Рекорд: ${saved.best}.`} До туалета добрался. Осталось решить последнюю проблему.`,actions:[]});return;}
  this.stamp+=delta;if(this.stamp>150){this.stamp=0;this.sync();}}
}
