import ArcadeGame from '../arcade/ArcadeGame';
export default function CookGame(props:{onWin:()=>void;onExit:()=>void}){return <ArcadeGame kind="cook" {...props}/>;}
