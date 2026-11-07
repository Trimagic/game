import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EFFECTS,Soundtrack,type Fx} from '../src/audio/sound.ts';
import {isTappable,listenForTaps} from '../src/audio/ui-feedback.ts';
test('Buttons and control surfaces answer a touch; plain text and empty space do not',()=>{
 const asked:string[]=[];const hit={closest:(selector:string)=>{asked.push(selector);return {};}};
 assert.equal(isTappable(hit),true);assert.match(asked[0],/button:not\(:disabled\)/);
 assert.equal(isTappable({closest:()=>null}),false);assert.equal(isTappable(null),false);assert.equal(isTappable({}),false);
 let handler:((e:{target:unknown})=>void)|undefined,played=0;listenForTaps({addEventListener:(_t,l)=>{handler=l;}},()=>played++);
 handler!({target:hit});handler!({target:{closest:()=>null}});assert.equal(played,1);
});
test('Every effect has notes within a sane range, vibrates even when muted and stops while suspended',()=>{
 for(const [name,e] of Object.entries(EFFECTS)){assert.ok(e.notes.length>0,name);for(const [hz,duration,,gain] of e.notes){assert.ok(hz>30&&hz<4000,name);assert.ok(duration>0&&duration<.5,name);assert.ok(gain>0&&gain<=.34,name);}}
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window');const calls:string[]=[];
 Object.defineProperty(globalThis,'window',{configurable:true,value:{Telegram:{WebApp:{HapticFeedback:{impactOccurred:(v:string)=>calls.push(v),notificationOccurred:(v:string)=>calls.push(v)}}}}});
 try{const s=new Soundtrack();s.enabled=false;(['thud'] as Fx[]).forEach(n=>s.fx(n));assert.deepEqual(calls,['heavy']);s.suspend();s.fx('crash');assert.equal(calls.length,1);}
 finally{if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else Reflect.deleteProperty(globalThis,'window');}
});
