import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUDGET, CHECKOUT_MS, createShopState, offersAt, products, ready, recipe, SHOP_MS, shopReducer, total } from '../src/shop/model.ts';

test('all recipe ingredients are available twice before checkout', () => {
  const seen = new Map<string, Set<number>>();
  for (let time=0;time<CHECKOUT_MS;time+=100) for (const offer of offersAt(time)) {
    if (offer.x<0 || offer.x>70) continue;
    const product = products[offer.product];
    if (offer.product>=5) continue;
    const ids = seen.get(product.key) ?? new Set<number>(); ids.add(offer.id); seen.set(product.key,ids);
  }
  for (const item of recipe) assert.ok((seen.get(item.key)?.size ?? 0)>=2,item.key);
});
test('full minute can be won with the affordable recipe and no extras', () => {
  let state=createShopState();
  while(state.elapsed<SHOP_MS) {
    for (const offer of offersAt(state.elapsed)) if(offer.product<5 && offer.x>=0 && offer.x<=70 && !state.cart.some(item=>item.product===offer.product)) state=shopReducer(state,{type:'add',offer:offer.id});
    state=shopReducer(state,{type:'tick',delta:100});
  }
  assert.equal(state.status,'won'); assert.equal(total(state),30); assert.equal(state.cart.length,5);
});
test('the same offer cannot be bought twice and expired offers cannot be bought', () => {
  const initial=createShopState();
  const bought=shopReducer(initial,{type:'add',offer:0});
  assert.equal(bought.cart.length,1);
  assert.equal(shopReducer(bought,{type:'add',offer:0}),bought);
  assert.equal(shopReducer(initial,{type:'add',offer:200}),initial);
  assert.equal(shopReducer({...initial,elapsed:20_000},{type:'add',offer:0}).cart.length,0);
});
test('over-budget baskets can be corrected and checked out only after opening', () => {
  let state={...createShopState(),cart:[0,1,2,3,4,5].map(product=>({offer:product,product}))};
  assert.ok(total(state)>BUDGET); assert.equal(ready(state),false);
  state=shopReducer(state,{type:'remove',offer:5});
  assert.equal(total(state),30); assert.equal(ready(state),true);
  assert.equal(shopReducer(state,{type:'checkout'}).status,'playing');
  assert.equal(shopReducer({...state,elapsed:CHECKOUT_MS},{type:'checkout'}).status,'won');
});
test('premium ingredient counts by type, but its price still matters', () => {
  let state={...createShopState(),elapsed:CHECKOUT_MS,cart:[0,6,2,3,4].map(product=>({offer:product,product}))};
  assert.equal(total(state),37); assert.equal(ready(state),false);
  assert.equal(shopReducer(state,{type:'checkout'}).status,'playing');
  state=shopReducer(state,{type:'remove',offer:6});
  state=shopReducer(state,{type:'add',offer:19});
  assert.equal(ready(state),true); assert.equal(total(state),30);
});
test('time limit loses incomplete baskets and terminal states cannot change', () => {
  const lost=shopReducer({...createShopState(),elapsed:SHOP_MS-100},{type:'tick',delta:100});
  assert.equal(lost.status,'lost'); assert.equal(shopReducer(lost,{type:'add',offer:0}),lost);
  assert.equal(shopReducer(lost,{type:'checkout'}),lost);
});
