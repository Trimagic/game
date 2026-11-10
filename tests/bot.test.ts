import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {botWebhook,webhookSecret} from '../worker/bot.ts';
import {BOT_DESCRIPTION,BOT_SHORT_DESCRIPTION,WELCOME_CAPTION,GAME_URL} from '../worker/bot-copy.ts';

function fixture(){
 const rows=new Map<number,{state:string;touched:number}>();
 const DB={prepare(sql:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this},async first(){
  const id=Number(args[0]),row=rows.get(id);
  if(sql.startsWith('INSERT')){if(row&&(row.state==='sent'||row.touched>=Number(args[2])))return null;rows.set(id,{state:'pending',touched:Number(args[1])});return {update_id:id};}
  return row?{state:row.state}:null;
 },async run(){if(sql.startsWith('UPDATE'))rows.set(Number(args[1]),{state:'sent',touched:Number(args[0])});else if(sql.includes('update_id=?')){const id=Number(args[0]);if(rows.get(id)?.state==='pending')rows.delete(id);}return {success:true}}}}};
 const sent:{method:string;body:any}[]=[];const replies:{ok:boolean;error_code?:number}[]=[];
 const transport=(async(url:unknown,options:RequestInit)=>{sent.push({method:String(url).split('/').at(-1)!,body:JSON.parse(options.body as string)});return Response.json(replies.shift()??{ok:true})}) as typeof fetch;
 const token='unit-test-token',env={BOT_TOKEN:token,DB:DB as unknown as D1Database};
 const request=async(body:unknown,secret?:string)=>new Request('https://test/api/telegram/webhook',{method:'POST',headers:{'X-Telegram-Bot-Api-Secret-Token':secret??await webhookSecret(token)},body:JSON.stringify(body)});
 const update=(text='/start',type='private')=>({update_id:123,message:{text,chat:{id:42,type}}});
 return {env,rows,sent,replies,transport,request,update};
}
test('profile copy fits Telegram limits and webhook secrets match the deployment script',async()=>{
 assert.ok(BOT_DESCRIPTION.length<=512);assert.ok(BOT_SHORT_DESCRIPTION.length<=120);assert.ok(WELCOME_CAPTION.length<1024);
 assert.equal(await webhookSecret('test'),createHmac('sha256','test').update('telegram-webhook:v1').digest('hex'));
});
test('only authenticated private start/help messages send a welcome, and duplicates do not',async()=>{
 const f=fixture();
 assert.equal((await botWebhook(await f.request(f.update(),'0'.repeat(64)),f.env,f.transport)).status,401);
 assert.equal((await botWebhook(await f.request(f.update('/start','group')),f.env,f.transport)).status,200);
 assert.equal((await botWebhook(await f.request(f.update('hello')),f.env,f.transport)).status,200);
 assert.equal((await botWebhook(await f.request(f.update('/start@another_bot')),f.env,f.transport)).status,200);assert.equal(f.sent.length,0);
 assert.equal((await botWebhook(await f.request(f.update('/start birthday')),f.env,f.transport)).status,200);
 assert.equal(f.sent.length,1);assert.equal(f.sent[0].method,'sendPhoto');assert.equal(f.sent[0].body.parse_mode,'HTML');assert.equal(f.sent[0].body.chat_id,42);
 assert.equal(f.sent[0].body.reply_markup.inline_keyboard[0][0].web_app.url,GAME_URL);
 assert.equal((await botWebhook(await f.request(f.update()),f.env,f.transport)).status,200);assert.equal(f.sent.length,1);
});
test('photo failures fall back to the formatted text; blocked bots are acknowledged',async()=>{
 const f=fixture();f.replies.push({ok:false,error_code:400},{ok:true});assert.equal((await botWebhook(await f.request(f.update()),f.env,f.transport)).status,200);
 assert.deepEqual(f.sent.map(s=>s.method),['sendPhoto','sendMessage']);assert.equal(f.rows.get(123)?.state,'sent');
 const blocked=fixture();blocked.replies.push({ok:false,error_code:403});assert.equal((await botWebhook(await blocked.request(blocked.update()),blocked.env,blocked.transport)).status,200);
});
test('transient failures retry, simultaneous deliveries wait, malformed requests are rejected',async()=>{
 const f=fixture();f.replies.push({ok:false,error_code:429});assert.equal((await botWebhook(await f.request(f.update()),f.env,f.transport)).status,503);assert.equal(f.rows.size,0);
 assert.equal((await botWebhook(await f.request(f.update()),f.env,f.transport)).status,200);
 const busy=fixture();busy.rows.set(123,{state:'pending',touched:Math.floor(Date.now()/1000)});assert.equal((await botWebhook(await busy.request(busy.update()),busy.env,busy.transport)).status,503);assert.equal(busy.sent.length,0);
 assert.equal((await botWebhook(await f.request(null),f.env,f.transport)).status,400);
 assert.equal((await botWebhook(new Request('https://test'),f.env,f.transport)).status,405);
 assert.equal((await botWebhook(await f.request({}),{...f.env,BOT_TOKEN:undefined},f.transport)).status,503);
});
