import test from 'node:test';
import assert from 'node:assert/strict';
import {canOpenChapter,resumeChapter,chapterScreen,completeChapter,type Chapter} from '../src/chapters.ts';

test('only completed chapters and the next chapter can open',()=>{
 for(let completed=0;completed<=11;completed++) for(let id=1;id<=11;id++) {
  assert.equal(canOpenChapter(completed,id as Chapter),id<=completed+1);
 }
 assert.equal(resumeChapter(0),1);assert.equal(resumeChapter(5),6);assert.equal(resumeChapter(10),11);assert.equal(resumeChapter(11),1);
});
test('every saved chapter advances directly to the next story, including 8→9 and 10→11',async()=>{
 for(let id=1;id<=11;id++){
  const result=await completeChapter(id as Chapter,async level=>{assert.equal(level,id);return level});
  assert.equal(result.next,id===11?null:id+1);
  if(result.next)assert.equal(chapterScreen(result.next),id>=8?'game':'comic');
 }
});
test('no transition happens before persistence succeeds',async()=>{
 let resolve!:(value:number)=>void;let advanced=false;
 const pending=completeChapter(2,()=>new Promise<number>(r=>resolve=r)).then(r=>{advanced=true;return r});
 await Promise.resolve();assert.equal(advanced,false);resolve(2);assert.equal((await pending).next,3);
 await assert.rejects(completeChapter(2,async()=>{throw new Error('offline')}),/offline/);
 await assert.rejects(completeChapter(2,async()=>0),/предыдущую/);
});
test('replaying an old chapter preserves progress and continues in story order',async()=>{
 assert.deepEqual(await completeChapter(2,async()=>8),{completed:8,next:3});
});
