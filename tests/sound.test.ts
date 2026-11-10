import test from 'node:test';
import assert from 'node:assert/strict';
import {Soundtrack} from '../src/audio/sound.ts';

test('sound is gesture-gated, mute persists, pause stops voices, gym has no extra music',async()=>{
 let created=0,started=0,stopped=0;const storage=new Map<string,string>();
 const oldAudio=Object.getOwnPropertyDescriptor(globalThis,'AudioContext'),oldStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 class Context{state='running';currentTime=0;destination={};constructor(){created++;}resume(){return Promise.resolve();}createGain(){return {gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}createOscillator(){return {type:'sine',frequency:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},onended:null,connect(){},disconnect(){},start(){started++;},stop(){stopped++;}};}}
 Object.defineProperty(globalThis,'AudioContext',{value:Context,configurable:true});Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>storage.get(k),setItem:(k:string,v:string)=>storage.set(k,v)},configurable:true});
 const sound=new Soundtrack();
 try{
  sound.set('bike',true);sound.cue('good');assert.equal(created,0);assert.equal(started,0);
  sound.unlock();await Promise.resolve();sound.cue('good');assert.equal(created,1);assert.equal(started,2);
  sound.toggle();assert.equal(storage.get('game-sound'),'off');const count=started;sound.cue('win');assert.equal(started,count);assert.equal(new Soundtrack().enabled,false);
  sound.toggle();await Promise.resolve();sound.cue('jump');assert.equal(started,count+2);sound.suspend();sound.cue('hit');assert.equal(started,count+2);assert.ok(stopped>=started);
  sound.foreground();sound.set('gym',true);const before=started;await new Promise(r=>setTimeout(r,300));assert.equal(started,before);sound.tone(660);assert.equal(started,before+1);
  sound.set('gym',false);sound.stop();assert.equal(created,1);
 }finally{sound.stop();if(oldAudio)Object.defineProperty(globalThis,'AudioContext',oldAudio);else Reflect.deleteProperty(globalThis,'AudioContext');if(oldStorage)Object.defineProperty(globalThis,'localStorage',oldStorage);else Reflect.deleteProperty(globalThis,'localStorage');}
});

test('birthday melody starts after unlock, mute stops it and leaving cancels the loop',async(t)=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');const notes:number[]=[];let stopped=0;
 class Context{state='running';currentTime=0;destination={};resume(){return Promise.resolve();}createGain(){return {gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}createOscillator(){const node={type:'sine',frequency:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},onended:null,connect(){},disconnect(){},start(){notes.push(node.frequency.value);},stop(){stopped++;}};return node;}}
 Object.defineProperty(globalThis,'AudioContext',{value:Context,configurable:true});t.mock.timers.enable({apis:['setInterval']});const track=new Soundtrack();
 try{
  track.set('birthday',true);assert.equal(notes.length,0);track.unlock();await Promise.resolve();assert.ok(Math.abs(notes[0]-392)<1);
  t.mock.timers.tick(520);assert.ok(notes.some(hz=>Math.abs(hz-440)<1));track.toggle();const muted=notes.length;t.mock.timers.tick(1000);assert.equal(notes.length,muted);assert.ok(stopped>0);
  track.toggle();await Promise.resolve();t.mock.timers.tick(520);assert.ok(notes.length>muted);track.stop();const ended=notes.length;t.mock.timers.tick(2000);assert.equal(notes.length,ended);
 }finally{track.stop();t.mock.timers.reset();if(previous)Object.defineProperty(globalThis,'AudioContext',previous);else Reflect.deleteProperty(globalThis,'AudioContext');}
});
