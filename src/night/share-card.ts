export const GAME_URL='https://telegram-comic-game.trimadgic.workers.dev/';
export const BIRTHDAY_WISH='Желаю недолгих, но очень счастливых и радостных лет жизни! )))';
export const SHARE_TEXT='С днём рождения! Все 11 глав «Ещё один годик» пройдены. 40 лет приснилось, фикус выжил, хорошее настроение разблокировано!';
export async function createBirthdayCard(emblem:SVGSVGElement):Promise<Blob>{
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
 const c=canvas.getContext('2d');if(!c)throw new Error('Canvas unavailable');
 const ink='#263d38',cream='#fff7e4',green='#dce8d6',gold='#f0c758';
 c.fillStyle='#ecdfb8';c.fillRect(0,0,1080,1920);c.fillStyle=ink;c.fillRect(48,52,990,1820);c.fillStyle=cream;c.fillRect(38,38,990,1820);c.strokeStyle=ink;c.lineWidth=6;c.strokeRect(38,38,990,1820);
 c.fillStyle=ink;c.fillRect(38,38,990,86);c.fillStyle=cream;c.font='bold 26px Arial';c.fillText('ЕЩЁ ОДИН ГОДИК / ИМЕНИННЫЙ ВЫПУСК',76,92);c.textAlign='right';c.fillStyle=gold;c.fillText('11 / 11',988,92);c.textAlign='center';
 const svg=emblem.cloneNode(true) as SVGSVGElement;svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','1040');svg.setAttribute('height','720');
 const imageUrl=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
 try{const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Artwork unavailable'));img.src=imageUrl;});c.drawImage(img,168,130,744,515);}finally{URL.revokeObjectURL(imageUrl);}
 const title=new Image();await new Promise<void>((resolve,reject)=>{title.onload=()=>resolve();title.onerror=()=>reject(new Error('Title unavailable'));title.src='/art/birthday-title.svg';});c.drawImage(title,180,590,720,270);
 const wish=new Image();await new Promise<void>((resolve,reject)=>{wish.onload=()=>resolve();wish.onerror=()=>reject(new Error('Lettering unavailable'));wish.src='/art/birthday-wish.svg';});c.drawImage(wish,120,870,840,630);
 const stats=[['11 / 11','глав пройдено','chapters'],['40','лет приснилось','dream'],['1','фикус выжил','plant']];
 for(const [i,[n,label,kind]]of stats.entries()){const x=90+i*302;c.fillStyle=green;c.fillRect(x,1510,280,155);c.strokeStyle='#adc0a7';c.lineWidth=2;c.strokeRect(x,1510,280,155);const badge=new Image();await new Promise<void>((resolve,reject)=>{badge.onload=()=>resolve();badge.onerror=()=>reject(new Error('Badge unavailable'));badge.src='/art/achievement-'+kind+'.svg';});c.drawImage(badge,x+111,1518,58,67);c.fillStyle=ink;c.font='bold 38px Arial';c.fillText(n,x+140,1622);c.font='20px Arial';c.fillText(label,x+140,1650);}
 c.strokeStyle=ink;c.lineWidth=3;c.save();c.translate(540,1720);c.rotate(-.035);c.strokeRect(-343,-31,686,62);c.fillStyle=ink;c.font='bold 27px Arial';c.fillText('ДОСТИЖЕНИЕ: ПРОСТО ЖИТЬ И РАДОВАТЬСЯ',0,9);c.restore();
 c.fillStyle=ink;c.font='26px Arial';c.fillText('Мой главный результат — хорошее настроение.',540,1800);c.font='22px Arial';c.fillStyle='#59715f';c.fillText('Пройди свою историю: telegram-comic-game.trimadgic.workers.dev',540,1840);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG unavailable')),'image/png'));
}
