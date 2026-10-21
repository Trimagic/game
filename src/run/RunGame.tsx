import ArcadeGame from '../arcade/ArcadeGame';
export default function RunGame(props:{onWin:()=>void;onExit:()=>void}){return <ArcadeGame kind="run" {...props}/>;}
