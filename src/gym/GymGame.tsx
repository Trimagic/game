import ArcadeGame from '../arcade/ArcadeGame';
export default function GymGame(props:{onWin:()=>void;onExit:()=>void}){return <ArcadeGame kind="gym" {...props}/>;}
