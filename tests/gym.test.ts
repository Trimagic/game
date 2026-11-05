import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chart, END, initial, input, phases, tick, secondWind, regular, accuracy, gymRating, multiplier, bonusSets, BONUS_POINTS, FEVER_STREAK, FEVER_MS } from '../src/gym/model.ts';

test('perfect full chart wins including chords and holds', () => {
  let s = initial();
  const events = chart.flatMap(n => [{ time: n.at, lane: n.lane, down: true }, { time: n.end ?? n.at + 20, lane: n.lane, down: false }]).sort((a,b) => a.time - b.time);
  for (const e of events) s = input(s, e.lane, e.down, e.time);
  s = tick(s, END);
  assert.equal(s.status, 'won'); assert.equal(s.score, regular.length * 100); assert.equal(s.best, chart.length); assert.equal(s.bonusHits, chart.length - regular.length); assert.equal(gymRating(s), 3); assert.ok(s.fevers >= 3);
});
test('chart increases tempo and has playable same-lane spacing', () => {
  assert.ok(phases[0].bpm < phases[1].bpm && phases[1].bpm < phases[2].bpm);
  for (const lane of [0,1]) {
    const notes = chart.filter(n => n.lane === lane);
    for(let i=1;i<notes.length;i++) assert.ok(notes[i].at - (notes[i-1].end ?? notes[i-1].at) > 180);
  }
});
test('early hold release fails, accurate release succeeds', () => {
  const n = chart.find(n => n.end)!;
  const base = {...initial(), results: Object.fromEntries(chart.filter(x => x.at < n.at).map(x => [x.id,100]))};
  let s = input(base,n.lane,true,n.at);
  assert.equal(s.holding[n.lane],n.id);
  assert.equal(input(s,n.lane,false,n.at+100).results[n.id],0);
  assert.equal(input(s,n.lane,false,n.end!).results[n.id],100);
  assert.equal(tick(s,n.end!+181).results[n.id],0);
});
test('duplicate keydown does not score twice; loose timing earns 70', () => {
  const n=chart[0]; let s=input(initial(),n.lane,true,n.at+130);
  assert.equal(s.score,70); assert.equal(input(s,n.lane,true,n.at+140).score,70);
});
test('idling and spamming cannot win', () => {
  assert.equal(tick(initial(), END).status,'lost');
  let s=initial(); for(let i=0;i<40;i++){s=input(s,0,true,i*2);s=input(s,0,false,i*2+1);}
  assert.equal(s.status,'lost');
});
test('failed results cannot later be rescued and terminal state is immutable', () => {
  let s=tick(initial(),chart[0].at+181);
  assert.equal(s.results[0],0);
  s=tick(s,END);assert.deepEqual(input(s,0,true,END),s);
});
test('paused hold can be regripped without losing its result', () => {
  const n=chart.find(n=>n.end)!;
  const base={...initial(),results:Object.fromEntries(chart.filter(x=>x.at<n.at).map(x=>[x.id,100]))};
  let s=input(base,n.lane,true,n.at);s={...s,pressed:[false,false]};
  s=input(s,n.lane,true,n.at+250);s=input(s,n.lane,false,n.end!);
  assert.equal(s.results[n.id],100);
});
test('good timing can win without perfect hits; low accuracy still loses with energy left', () => {
  function play(misses: boolean) {
    let s = initial();
    const events = chart.filter(n => !misses || n.id % 10 !== 5).flatMap(n => [
      { time: n.at + 130, lane: n.lane, down: true },
      { time: (n.end ?? n.at + 20) + 130, lane: n.lane, down: false },
    ]).sort((a,b) => a.time-b.time);
    for(const e of events) s=input(s,e.lane,e.down,e.time);
    return tick(s,END);
  }
  assert.equal(play(false).status,'won');
  const low=play(true);assert.ok(low.energy>0);assert.equal(low.status,'lost');
});

test('second wind requires a streak, restores capped energy once, and cannot rescue a finished round',()=>{
 const start=initial();assert.equal(secondWind(start),start);
 const ready={...start,combo:8,energy:40};const used=secondWind(ready);
 assert.equal(used.energy,65);assert.equal(used.windUsed,true);assert.equal(secondWind(used),used);
 assert.equal(secondWind({...ready,energy:90}).energy,100);
 const lost={...ready,status:'lost' as const};assert.equal(secondWind(lost),lost);
});

test('bonus reps sit in the rests and skipping them costs nothing',()=>{
 const bonus=chart.filter(n=>n.bonus);assert.equal(bonus.length,bonusSets.flat().length);
 for(const b of bonus)assert.ok(!regular.some(n=>Math.abs(n.at-b.at)<400||(n.end&&b.at>n.at-400&&b.at<n.end+400)));
 const b=bonus[0];const before={...initial(),combo:5,results:Object.fromEntries(regular.filter(n=>n.at<b.at).map(n=>[n.id,100]))};
 const skipped=tick(before,b.at+WINDOW_PLUS);assert.equal(skipped.energy,100);assert.equal(skipped.combo,5);assert.equal(skipped.results[b.id],0);
 const hit=input(before,b.lane,true,b.at);assert.equal(hit.points,BONUS_POINTS*multiplier(6));assert.equal(hit.combo,6);assert.equal(hit.score,before.score);
});
const WINDOW_PLUS=181;
test('a streak of twenty starts beast mode with double points until a miss',()=>{
 const notes=regular.filter(n=>!n.end).slice(0,FEVER_STREAK+2);let s=initial();
 for(const n of notes.slice(0,FEVER_STREAK)){s=input(s,n.lane,true,n.at);s=input(s,n.lane,false,n.at+20);}
 assert.equal(s.fevers,1);assert.equal(s.feverUntil,notes[FEVER_STREAK-1].at+FEVER_MS);
 const n=notes[FEVER_STREAK];const plain={...s,feverUntil:0};
 assert.equal(input(s,n.lane,true,n.at).points-s.points,2*(input(plain,n.lane,true,n.at).points-plain.points));
 assert.equal(tick(s,n.at+WINDOW_PLUS).feverUntil,0);
});
test('rating follows accuracy on regular notes only',()=>{
 const all=Object.fromEntries(regular.map(n=>[n.id,100]));
 assert.equal(gymRating({...initial(),score:regular.length*100,results:all}),3);
 assert.equal(gymRating({...initial(),score:regular.length*80}),2);
 assert.equal(gymRating({...initial(),score:regular.length*70}),1);
 assert.equal(accuracy({...initial(),score:regular.length*100,points:99999}),1);
});
