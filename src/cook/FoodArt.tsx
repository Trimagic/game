import { useId } from 'react';
export function FoodArt({index}:{index:number}) {
  const clip=useId(); const x=(index%3)*512, y=Math.floor(index/3)*512;
  return <svg className="food-art" viewBox={`${x} ${y} 512 512`} aria-hidden="true"><defs><clipPath id={clip}><rect x={x} y={y} width="512" height="512"/></clipPath></defs><image href="/art/chapter-04-food.png" width="1536" height="1024" clipPath={`url(#${clip})`}/></svg>;
}
