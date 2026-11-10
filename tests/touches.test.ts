import {test} from 'node:test';
import assert from 'node:assert/strict';
import {guardTouches,staleSlots,type TouchSlot} from '../src/arcade/touches.ts';
const slot=(id:number,identifier:number,active=true)=>{const s:TouchSlot&{resets:number}={id,identifier,active,resets:0,reset(){s.active=false;s.resets++;}};return s;};
test('a slot holding a finger the browser no longer lists is a ghost; the mouse and free slots are not',()=>{
 const mouse=slot(0,0),live=slot(1,11),ghost=slot(2,12),free=slot(3,13,false);
 assert.deepEqual(staleSlots([mouse,live,ghost,free],[11,14]),[ghost]);
 assert.deepEqual(staleSlots([live],[11]),[]);
});
test('each new touch frees the ghosts before the game sees it',()=>{
 let handler:((e:Event)=>void)|undefined;const target={addEventListener:(_t:string,l:(e:Event)=>void)=>{handler=l;},removeEventListener(){handler=undefined;}} as unknown as EventTarget;
 const live=slot(1,21),ghost=slot(2,22);const stop=guardTouches(target,()=>[live,ghost]);
 handler!({touches:[{identifier:21},{identifier:23}]} as unknown as Event);assert.equal(ghost.resets,1);assert.equal(live.resets,0);
 stop();assert.equal(handler,undefined);
});
