import ArcadeGame from '../arcade/ArcadeGame';
export default function ShopGame(props:{onWin:()=>void;onExit:()=>void}){return <ArcadeGame kind="shop" {...props}/>;}
