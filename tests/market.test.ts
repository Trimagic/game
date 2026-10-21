import {test} from 'node:test';
import assert from 'node:assert/strict';
import {aisles,MARKET_MS,marketInitial,marketStep,marketReady,marketCost} from '../src/shop/market.ts';
test('Three departments provide a complete affordable dinner and require explicit checkout',()=>{
 let s=marketInitial();for(let aisle=0;aisle<3;aisle++){s=marketStep(s,{type:'aisle',index:aisle});for(const product of aisles[aisle].items.filter(id=>id<5))s=marketStep(s,{type:'buy',product});}
 assert.equal(marketCost(s),30);assert.ok(marketReady(s));assert.equal(s.status,'playing');s=marketStep(s,{type:'checkout'});assert.equal(s.status,'won');assert.equal(marketStep(s,{type:'remove',product:0}),s);
});
test('Purchases require current department and duplicates cannot charge twice',()=>{
 let s=marketInitial();assert.equal(marketStep(s,{type:'buy',product:4}),s);s=marketStep(s,{type:'buy',product:0});assert.equal(marketStep(s,{type:'buy',product:0}),s);assert.equal(marketStep(s,{type:'aisle',index:9}),s);
});
test('Premium trap can be corrected by returning products',()=>{
 let s=marketInitial();for(let aisle=0;aisle<3;aisle++){s=marketStep(s,{type:'aisle',index:aisle});for(const product of aisles[aisle].items.filter(id=>id!==1&&id!==5&&id!==7&&id!==8))s=marketStep(s,{type:'buy',product});}
 assert.equal(marketCost(s),37);assert.equal(marketReady(s),false);assert.equal(marketStep(s,{type:'checkout'}).status,'playing');s=marketStep(s,{type:'remove',product:6});s=marketStep(s,{type:'aisle',index:1});s=marketStep(s,{type:'buy',product:1});assert.ok(marketReady(s));
});
test('Closing time loses even with a full basket if checkout was not used',()=>{let s={...marketInitial(),cart:[0,1,2,3,4]};assert.ok(marketReady(s));for(let t=0;t<MARKET_MS;t+=100)s=marketStep(s,{type:'tick',delta:100});assert.equal(s.status,'lost');assert.equal(marketStep(s,{type:'checkout'}),s);});
