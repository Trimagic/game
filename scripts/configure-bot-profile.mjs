import {readFile} from 'node:fs/promises';
import {BOT_USERNAME,BOT_DESCRIPTION,BOT_SHORT_DESCRIPTION,GAME_URL} from '../worker/bot-copy.ts';
import {webhookSecret} from '../worker/bot.ts';
if(!process.argv.includes('--apply'))throw new Error('Pass --apply to configure the project bot profile and welcome webhook');
const vars=await readFile(new URL('../.dev.vars',import.meta.url),'utf8');
const token=vars.match(/^\s*BOT_TOKEN\s*=\s*["']?([^\r\n"']+)/m)?.[1].trim();
if(!token||!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token))throw new Error('BOT_TOKEN is missing or invalid');
async function api(method,body){
 try{
  const response=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body??{})});
  const result=await response.json();if(!response.ok||!result.ok)throw new Error();return result.result;
 }catch{throw new Error(`Telegram ${method} failed`);}
}
const bot=await api('getMe');if(bot.username!==BOT_USERNAME)throw new Error('The configured token belongs to a different bot');
const webhook=GAME_URL+'api/telegram/webhook';const old=await api('getWebhookInfo');
if(old.url&&old.url!==webhook)throw new Error('The bot already has a different webhook; it was left unchanged');
for(const language_code of ['','ru']){
 await api('setMyDescription',{description:BOT_DESCRIPTION,language_code});
 await api('setMyShortDescription',{short_description:BOT_SHORT_DESCRIPTION,language_code});
}
await api('setMyCommands',{commands:[{command:'start',description:'🎂 Открыть именинное приключение'},{command:'help',description:'🎮 Как начать играть'},{command:'reset',description:'🔄 Сбросить свой прогресс и начать сначала'}]});
await api('setWebhook',{url:webhook,secret_token:await webhookSecret(token),allowed_updates:['message']});
const [description,short,configured]=await Promise.all([api('getMyDescription'),api('getMyShortDescription'),api('getWebhookInfo')]);
if(description.description!==BOT_DESCRIPTION||short.short_description!==BOT_SHORT_DESCRIPTION||configured.url!==webhook)throw new Error('Bot profile verification failed');
console.log(JSON.stringify({bot:bot.username,description:true,shortDescription:true,webhook:configured.url,pending:configured.pending_update_count}));
