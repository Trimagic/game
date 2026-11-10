import test from 'node:test';
import assert from 'node:assert/strict';
import {MUSIC,musicStep,gymBeat} from '../src/audio/music.ts';
import {Soundtrack} from '../src/audio/sound.ts';

test('all eleven games have distinct layered music, with gentle stealth/sleep and faster running',()=>{
 assert.deepEqual(Object.keys(MUSIC).sort(),['menu','bike','pool','shop','cook','sleep','run','schedule','remote','delivery','night'].sort());
 assert.ok(MUSIC.run.bpm>MUSIC.bike.bpm);assert.ok(MUSIC.sleep.bpm<MUSIC.bike.bpm);
 const phrases=Object.keys(MUSIC).map(theme=>Array.from({length:32},(_,i)=>musicStep(theme,i)));
 assert.equal(new Set(phrases.map(p=>JSON.stringify(p))).size,11);
 for(const phrase of [...phrases,Array.from({length:32},(_,i)=>gymBeat(Math.floor(i/12),i))]){
  assert.ok(phrase.flat().some(n=>n.endHz),'percussion');
  for(const n of phrase.flat()){assert.ok(n.hz>=40&&n.hz<=6000);assert.ok(n.duration>0&&n.duration<1.3);assert.ok(n.gain>0&&n.gain<=.3);}
 }
 assert.equal(gymBeat(0,-4).length,1,'count-in only, before the notes start');
 assert.deepEqual(musicStep('gym',0),[],'gym follows the chart, not a competing background loop');
});

test('audio-clock scheduler cancels on pause, mute, scene change and ending; never catches up in a burst',async(t)=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'AudioContext');
 let now=0;const starts:{at:number;stopped:boolean}[]=[];
 class Context {
  state='running';get currentTime(){return now;}destination={};resume(){return Promise.resolve();}
  createGain(){return {gain:{value:1,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  createOscillator(){let entry:{at:number;stopped:boolean};return {type:'sine',frequency:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},onended:null,connect(){},disconnect(){},start(at:number){entry={at,stopped:false};starts.push(entry)},stop(){if(entry)entry.stopped=true}};}
 }
 Object.defineProperty(globalThis,'AudioContext',{value:Context,configurable:true});t.mock.timers.enable({apis:['setInterval']});const track=new Soundtrack();
 try{
  track.enabled=true;track.set('bike',true);t.mock.timers.tick(100);assert.equal(starts.length,0);
  track.unlock();await Promise.resolve();t.mock.timers.tick(25);assert.ok(starts.length>=5);assert.ok(starts.every(n=>n.at>=now));
  track.set('bike',false);const paused=starts.length;now+=1;t.mock.timers.tick(1000);assert.equal(starts.length,paused);assert.ok(starts.every(n=>n.stopped));
  track.set('run',true);t.mock.timers.tick(25);assert.ok(starts.length>paused);
  const before=starts.length;now+=5;t.mock.timers.tick(25);assert.ok(starts.length-before<=8,'no burst after a blocked frame');assert.ok(starts.slice(before).every(n=>n.at>=now));
  track.suspend();const hidden=starts.length;now++;t.mock.timers.tick(100);track.fx('coin');assert.equal(starts.length,hidden);
  track.foreground();track.set('run',true);t.mock.timers.tick(25);assert.ok(starts.length>hidden);
  track.toggle();const muted=starts.length;now++;t.mock.timers.tick(100);track.fx('coin');assert.equal(starts.length,muted);
  track.toggle();await Promise.resolve();track.set('gym',true);const gym=starts.length;now++;t.mock.timers.tick(500);assert.equal(starts.length,gym);
  track.set('menu',true);t.mock.timers.tick(25);const menu=starts.length;track.suspend();assert.equal(track.readySnapshot(),false);now++;t.mock.timers.tick(100);assert.equal(starts.length,menu);track.foreground();assert.equal(track.readySnapshot(),true);t.mock.timers.tick(25);assert.ok(starts.length>menu,'menu resumes on returning to the foreground');
  track.set('pool',true);track.cue('win');const ending=starts.length;now++;t.mock.timers.tick(500);assert.equal(starts.length,ending);
  track.stop();now++;t.mock.timers.tick(500);assert.equal(starts.length,ending);
 }finally{track.stop();t.mock.timers.reset();if(old)Object.defineProperty(globalThis,'AudioContext',old);else Reflect.deleteProperty(globalThis,'AudioContext');}
});
