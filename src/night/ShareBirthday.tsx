import {useEffect,useRef,useState} from 'react';
import {BIRTHDAY_WISH,createBirthdayCard,GAME_URL,SHARE_TEXT} from './share-card';
export default function ShareBirthday({emblem,onClose}:{emblem:SVGSVGElement|null;onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [card,setCard]=useState<{file:File;url:string}>(),[message,setMessage]=useState(''),[failed,setFailed]=useState(false),[sharing,setSharing]=useState(false);
 useEffect(()=>{dialog.current?.showModal();let active=true,url:string|undefined;
  if(emblem)void createBirthdayCard(emblem).then(blob=>{if(!active)return;url=URL.createObjectURL(blob);setCard({file:new File([blob],'s-nulya-birthday.png',{type:'image/png'}),url});}).catch(()=>{if(active)setFailed(true);});else setFailed(true);
  return()=>{active=false;if(url)URL.revokeObjectURL(url);};
 },[emblem]);
 const send=async()=>{if(sharing)return;setSharing(true);setMessage('');try{
  if(card&&navigator.canShare?.({files:[card.file]}))await navigator.share({files:[card.file],title:'С днём рождения! / С нуля!'});
  else if(navigator.share)await navigator.share({title:'С днём рождения!',text:SHARE_TEXT,url:GAME_URL});
  else setMessage('Сохрани открытку или выбери Telegram / VK ниже.');
 }catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setMessage('Здесь отправка недоступна. Сохрани открытку или выбери ссылку ниже.');}finally{setSharing(false);}};
 const copy=async()=>{try{await navigator.clipboard.writeText(`${SHARE_TEXT}\n${BIRTHDAY_WISH}\n${GAME_URL}`);setMessage('Поздравление и ссылка скопированы.');}catch{setMessage('Скопируй ссылку из поля ниже.');}};
 return <dialog ref={dialog} className="birthday-share" aria-labelledby="birthday-share-title" onClose={onClose} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}>
  <header><div><span className="eyebrow">РЕЗУЛЬТАТ ДОСТОИН СТОРИС</span><h2 id="birthday-share-title">Поделиться праздником</h2></div><button className="small-button" aria-label="Закрыть окно публикации" onClick={()=>dialog.current?.close()}>×</button></header>
  {card?<img className="birthday-share-preview" src={card.url} alt="Именинная открытка: поздравление с днём рождения, прежнее пожелание и результаты 11 из 11"/>:<p role="status">{failed?'Не удалось собрать картинку. Поздравлением и ссылкой всё равно можно поделиться.':'Собираем твою открытку…'}</p>}
  <div className="birthday-share-actions">{Boolean(navigator.share)&&<button disabled={sharing||(!card&&!failed)} onClick={()=>void send()}>{sharing?'Открываем…':'Отправить друзьям →'}</button>}{card&&<a className="birthday-download" href={card.url} download="s-nulya-birthday.png">Сохранить открытку PNG ↓</a>}</div>
  <p className="birthday-share-hint">Открытка для сторис и постов. Отправь картинку или поделись ссылкой на игру.</p>
  <div className="birthday-share-links"><a href={`https://t.me/share/url?url=${encodeURIComponent(GAME_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`} target="_blank" rel="noopener noreferrer">Telegram ↗</a><a href={`https://vk.com/share.php?url=${encodeURIComponent(GAME_URL)}&title=${encodeURIComponent(SHARE_TEXT)}`} target="_blank" rel="noopener noreferrer">VK ↗</a><button className="text-button" onClick={()=>void copy()}>Скопировать текст</button></div>
  <input className="birthday-share-url" aria-label="Ссылка на игру" readOnly value={GAME_URL} onFocus={e=>e.target.select()}/><p className="birthday-share-status" role="status">{message}</p>
 </dialog>;
}
