export const BUDGET = 35;
export const SHOP_MS = 60_000;
export const CHECKOUT_MS = 45_000;
export const recipe = [
  { key: 'chicken', name: 'Курица', amount: '400 г' },
  { key: 'rice', name: 'Рис', amount: '500 г' },
  { key: 'broccoli', name: 'Брокколи', amount: '400 г' },
  { key: 'tomato', name: 'Помидоры', amount: '500 г' },
  { key: 'oil', name: 'Масло', amount: '500 мл' },
] as const;
export const products = [
  { name: 'Куриное филе', key: 'chicken', amount: '400 г', price: 12, icon: 0, label: 'К УЖИНУ' },
  { name: 'Рис', key: 'rice', amount: '500 г', price: 4, icon: 1, label: 'ОБЫЧНЫЙ' },
  { name: 'Брокколи', key: 'broccoli', amount: '400 г', price: 6, icon: 2, label: 'СВЕЖАЯ' },
  { name: 'Помидоры', key: 'tomato', amount: '500 г', price: 3, icon: 3, label: 'НА ВЕС' },
  { name: 'Масло', key: 'oil', amount: '500 мл', price: 5, icon: 4, label: 'ДЛЯ ГОТОВКИ' },
  { name: 'Торт «Лёгкость»', key: 'cake', amount: '1 кусок', price: 9, icon: 5, label: 'ЛЁГКО КУПИТЬ' },
  { name: 'Рис «Премиум»', key: 'rice', amount: '500 г', price: 11, icon: 1, label: 'ТЕ ЖЕ 500 Г' },
  { name: 'Ведро соуса', key: 'sauce', amount: '2 литра', price: 8, icon: 6, label: 'ОПТОМ ВЫГОДНЕЕ' },
  { name: 'Шоколад «Фитнес»', key: 'chocolate', amount: '100 г', price: 6, icon: 7, label: 'ЗЕЛЁНАЯ ОБЁРТКА' },
] as const;
export type Purchase = { offer: number; product: number };
export type ShopState = { elapsed: number; cart: Purchase[]; taken: number[]; status: 'playing' | 'won' | 'lost'; notice: string };
export type ShopAction = { type: 'tick'; delta: number } | { type: 'add'; offer: number } | { type: 'remove'; offer: number } | { type: 'checkout' };
export function createShopState(): ShopState { return { elapsed: 0, cart: [], taken: [], status: 'playing', notice: 'Список вверху. Цены в игровых монетах.' }; }
export function offersAt(elapsed: number) {
  const current = Math.floor(elapsed / 2500);
  return Array.from({ length: 5 }, (_, n) => current + n - 2).filter(id => id >= 0).map(id => ({ id, product: id % products.length, x: 100 - (elapsed - (id - 2) * 2500) * .014 })).filter(item => item.x > -30 && item.x < 100);
}
export const total = (state: ShopState) => state.cart.reduce((sum, item) => sum + products[item.product].price, 0);
export const hasIngredient = (state: ShopState, key: string) => state.cart.some(item => products[item.product].key === key);
export const ready = (state: ShopState) => total(state) <= BUDGET && recipe.every(item => hasIngredient(state, item.key));
export function shopReducer(state: ShopState, action: ShopAction): ShopState {
  if (state.status !== 'playing') return state;
  if (action.type === 'tick') {
    const elapsed = Math.min(SHOP_MS, state.elapsed + Math.max(0, Math.min(250, action.delta)));
    return { ...state, elapsed, status: elapsed === SHOP_MS ? ready(state) ? 'won' : 'lost' : 'playing' };
  }
  if (action.type === 'add') {
    const offer = offersAt(state.elapsed).find(item => item.id === action.offer);
    if (!offer || state.taken.includes(action.offer)) return state;
    if (state.cart.length >= 12) return { ...state, notice: 'Корзина полна. Убери лишнее.' };
    const next = { ...state, cart: [...state.cart, { offer: offer.id, product: offer.product }], taken: [...state.taken, offer.id] };
    return { ...next, notice: total(next) > BUDGET ? 'Бюджет превышен. Убери лишнее до кассы.' : products[offer.product].name + ' — в корзине.' };
  }
  if (action.type === 'remove') return { ...state, cart: state.cart.filter(item => item.offer !== action.offer), taken: state.taken.filter(id => id !== action.offer), notice: 'Товар возвращён, монеты тоже.' };
  if (state.elapsed < CHECKOUT_MS) return { ...state, notice: 'Касса откроется в последние 15 секунд.' };
  return { ...state, status: ready(state) ? 'won' : 'playing', notice: 'Проверь список и бюджет. Ещё можно исправить корзину.' };
}
