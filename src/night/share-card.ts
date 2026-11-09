export const GAME_URL='https://telegram-comic-game.trimadgic.workers.dev/';
export const BIRTHDAY_WISH='Желаю недолгих, но очень счастливых и радостных лет жизни! )))';
export const SHARE_TEXT='С днём рождения! Все 11 глав «С нуля!» пройдены. 40 лет приснилось, фикус выжил, хорошее настроение разблокировано!';
export async function createBirthdayCard(emblem:SVGSVGElement):Promise<Blob>{
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
 const c=canvas.getContext('2d');if(!c)throw new Error('Canvas unavailable');
 const ink='#263d38',cream='#fff7e4',green='#dce8d6',gold='#f0c758';
 c.fillStyle='#ecdfb8';c.fillRect(0,0,1080,1920);c.fillStyle=ink;c.fillRect(48,52,990,1820);c.fillStyle=cream;c.fillRect(38,38,990,1820);c.strokeStyle=ink;c.lineWidth=6;c.strokeRect(38,38,990,1820);
 c.fillStyle=ink;c.fillRect(38,38,990,86);c.fillStyle=cream;c.font='bold 26px Arial';c.fillText('С НУЛЯ! / ИМЕНИННЫЙ ВЫПУСК',76,92);c.textAlign='right';c.fillStyle=gold;c.fillText('11 / 11',988,92);c.textAlign='center';
 const svg=emblem.cloneNode(true) as SVGSVGElement;svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','880');svg.setAttribute('height','520');
 const imageUrl=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
 try{const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('Artwork unavailable'));img.src=imageUrl;});c.drawImage(img,180,135,720,425);}finally{URL.revokeObjectURL(imageUrl);}
 c.fillStyle=ink;c.font='bold 76px Arial';c.fillText('С днём рождения!',540,610);
 c.fillStyle='#bf542e';c.font='bold 28px Arial';c.fillText('СЧАСТЛИВЫЙ ФИНАЛ РАЗБЛОКИРОВАН',540,661);
 const wish=new Image();await new Promise<void>((resolve,reject)=>{wish.onload=()=>resolve();wish.onerror=()=>reject(new Error('Lettering unavailable'));wish.src='/art/birthday-wish.svg';});c.drawImage(wish,90,695,900,675);
 const stats=[['11 / 11','глав пройдено'],['40','лет приснилось'],['1','фикус выжил']];
 stats.forEach(([n,label],i)=>{const x=90+i*302;c.fillStyle=green;c.fillRect(x,1410,280,140);c.strokeStyle='#adc0a7';c.lineWidth=2;c.strokeRect(x,1410,280,140);c.fillStyle=ink;c.font='bold 48px Arial';c.fillText(n,x+140,1473);c.font='24px Arial';c.fillText(label,x+140,1517);});
 c.strokeStyle=ink;c.lineWidth=3;c.save();c.translate(540,1620);c.rotate(-.035);c.strokeRect(-343,-31,686,62);c.fillStyle=ink;c.font='bold 27px Arial';c.fillText('ДОСТИЖЕНИЕ: ПРОСТО ЖИТЬ И РАДОВАТЬСЯ',0,9);c.restore();
 c.fillStyle=ink;c.font='26px Arial';c.fillText('Мой главный результат — хорошее настроение.',540,1740);c.font='22px Arial';c.fillStyle='#59715f';c.fillText('Пройди свою историю: telegram-comic-game.trimadgic.workers.dev',540,1810);
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG unavailable')),'image/png'));
}
