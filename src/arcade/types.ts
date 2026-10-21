export type ArcadeView={title:string;detail:string;status:'loading'|'ready'|'playing'|'paused'|'won'|'lost'|'story'|'error';actions:{id:string;label:string;disabled?:boolean}[]};
export type ArcadeControls={start:()=>void;pause:()=>void;action:(id:string)=>void};
export type ArcadeEvents={publish:(view:ArcadeView)=>void;ready:(controls:ArcadeControls)=>void;error:()=>void};

