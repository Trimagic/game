import ArcadeGame from '../arcade/ArcadeGame';
export default function ScheduleGame(props:{onWin:()=>void;onExit:()=>void}){return <ArcadeGame kind="schedule" {...props}/>;}
