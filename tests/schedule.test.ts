import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canPlace,complete,reconcile,tasksFor,type Plan,type Task} from '../src/schedule/model.ts';
function solve(tasks:Task[],plan:Plan={}):Plan|null{
 const task=tasks.find(t=>plan[t.id]===undefined);if(!task)return complete(tasks,plan)?plan:null;
 for(let start=0;start<16;start++)if(canPlace(tasks,plan,task.id,start)){const result=solve(tasks,{...plan,[task.id]:start});if(result)return result;}return null;
}
test('Every day and both Friday events have a solution including rest',()=>{
 for(const [day,event] of [[0,0],[1,0],[2,0],[2,1],[2,2]]){const tasks=tasksFor(day,event);const result=solve(tasks);assert.ok(result);assert.equal(complete(tasks,result),true);assert.ok(result.rest!==undefined);}
});
test('Time windows, sleep boundary, collisions and fixed appointments are enforced',()=>{
 const tasks=tasksFor(1);assert.equal(canPlace(tasks,{},'work',3),false);assert.equal(canPlace(tasks,{},'work',4),true);
 assert.equal(canPlace(tasks,{work:4},'exercise',3),false);assert.equal(canPlace(tasks,{},'dinner',15),false);
 assert.equal(canPlace(tasks,{},'breakfast',3),false);assert.equal(canPlace(tasks,{},'rest',10.5),false);
 assert.equal(canPlace(tasks,{exercise:1},'exercise',1),true);
});
test('Friday delivery displaces conflicting rest without losing other placements',()=>{
 const plan={breakfast:0,exercise:1,work:3,lunch:7,rest:10,dinner:12};assert.ok(complete(tasksFor(2),plan));
 const next=reconcile(tasksFor(2,1),plan);assert.equal(next.delivery,10);assert.equal(next.rest,undefined);assert.equal(next.breakfast,0);assert.equal(complete(tasksFor(2,1),next),false);
});
test('Longer work returns to tray if it collides and rest is required to finish',()=>{
 const tasks=tasksFor(2,2),next=reconcile(tasks,{work:3,lunch:7,rest:12});assert.equal(next.work,3);assert.equal(next.lunch,undefined);
 const solution=solve(tasks)!;delete solution.rest;assert.equal(complete(tasks,solution),false);
});
