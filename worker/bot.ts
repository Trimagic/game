import {BOT_USERNAME,GAME_URL,WELCOME_BUTTON,WELCOME_CAPTION,WELCOME_PHOTO} from './bot-copy.ts';
type BotEnv={BOT_TOKEN?:string;DB:D1Database};
const reply=(status=200)=>new Response(null,{status});
// Derived secret avoids adding a second credential; only Telegram gets this value.
export async function webhookSecret(token:string){
 const encoder=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',encoder.encode(token),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode('telegram-webhook:v1'))),n=>n.toString(16).padStart(2,'0')).join('');
}
export async function botWebhook(request:Request,env:BotEnv,transport:typeof fetch=fetch):Promise<Response>{
 if(request.method!=='POST')return reply(405);
 if(!env.BOT_TOKEN)return reply(503);
 const secret=request.headers.get('X-Telegram-Bot-Api-Secret-Token')??'';
 if(secret.length!==64)return reply(401);
 const expected=await webhookSecret(env.BOT_TOKEN);let diff=0;
 for(let i=0;i<64;i++)diff|=secret.charCodeAt(i)^expected.charCodeAt(i);
 if(diff)return reply(401);
 if(Number(request.headers.get('content-length'))>32768)return reply(413);
 const body=await request.text();if(body.length>32768)return reply(413);
 let update:{update_id?:unknown;message?:{text?:unknown;chat?:{id?:unknown;type?:unknown}}};
 try{const parsed:unknown=JSON.parse(body);if(!parsed||typeof parsed!=='object')return reply(400);update=parsed;}catch{return reply(400);}
 const chat=update.message?.chat,text=update.message?.text,id=update.update_id;
 if(!Number.isSafeInteger(id)||(id as number)<0)return reply(400);
 if(chat?.type!=='private'||!Number.isSafeInteger(chat.id)||(chat.id as number)<=0||typeof text!=='string')return reply();
 const command=new RegExp(`^/(start|help|reset)(?:@${BOT_USERNAME})?(?:\\s|$)`,'i').exec(text)?.[1].toLowerCase();
 if(!command)return reply();
 const now=Math.floor(Date.now()/1000);
 try{
  // The Worker binding can initialise its own table when migration-CLI access is unavailable.
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS bot_updates (update_id INTEGER PRIMARY KEY,state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sent')),touched_at INTEGER NOT NULL)").run();
  // Atomic lease: duplicate deliveries cannot produce simultaneous greetings.
  const lease=await env.DB.prepare("INSERT INTO bot_updates (update_id,touched_at) VALUES (?,?) ON CONFLICT(update_id) DO UPDATE SET touched_at=excluded.touched_at WHERE state='pending' AND touched_at<? RETURNING update_id").bind(id,now,now-60).first();
  if(!lease){const previous=await env.DB.prepare('SELECT state FROM bot_updates WHERE update_id=?').bind(id).first<{state:string}>();return reply(previous?.state==='sent'?200:503);}
  const keyboard={inline_keyboard:[[{text:WELCOME_BUTTON,web_app:{url:GAME_URL}}]]};
  const send=async(method:string,payload:unknown)=>{
   const response=await transport(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   return await response.json() as {ok:boolean;error_code?:number};
  };
  let result:{ok:boolean;error_code?:number};
  if(command==='reset'){
   // Complete the reset and its receipt atomically. A retried message cannot erase a new run.
   await env.DB.batch([
    env.DB.prepare('UPDATE progress SET completed=0, updated_at=CURRENT_TIMESTAMP WHERE user_id=?').bind(String(chat.id)),
    env.DB.prepare("UPDATE bot_updates SET state='sent',touched_at=? WHERE update_id=?").bind(now,id),
   ]);
   result=await send('sendMessage',{chat_id:chat.id,text:'🔄 <b>Твой прогресс сброшен.</b>\n\nСнова открыта первая глава. Закрой игру, если она запущена, и нажми «🎮 Старт», чтобы начать сначала.',parse_mode:'HTML',reply_markup:keyboard});
  }else result=await send('sendPhoto',{chat_id:chat.id,photo:WELCOME_PHOTO,caption:WELCOME_CAPTION,parse_mode:'HTML',reply_markup:keyboard});
  // The launch button still works if Telegram cannot fetch the cover.
  if(command!=='reset'&&!result.ok&&result.error_code===400)result=await send('sendMessage',{chat_id:chat.id,text:WELCOME_CAPTION,parse_mode:'HTML',reply_markup:keyboard});
  if(!result.ok&&result.error_code!==403)throw new Error('Delivery failed');
  await env.DB.prepare("UPDATE bot_updates SET state='sent',touched_at=? WHERE update_id=?").bind(now,id).run();
  await env.DB.prepare("DELETE FROM bot_updates WHERE state='sent' AND touched_at<?").bind(now-7*86400).run();
  return reply();
 }catch{
  // No tokens, request bodies or private chat identifiers in logs.
  console.error('Bot greeting delivery failed');
  try{await env.DB.prepare("DELETE FROM bot_updates WHERE update_id=? AND state='pending'").bind(id).run();}catch{/* Lease expires if storage is temporarily unavailable. */}
  return reply(503);
 }
}
