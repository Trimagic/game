export type MusicNote={hz:number;duration:number;type:OscillatorType;gain:number;delay?:number;endHz?:number};
type Arrangement={bpm:number;root:number;melody:number[];chords:number[];lead:OscillatorType;soft?:boolean;syncopated?:boolean};
// Eighth-note patterns; one chord per bar, four bars per phrase.
export const MUSIC:Record<string,Arrangement>={
 menu:{bpm:118,root:261.63,melody:[12,7,9,12,14,12,9,7,4,7,9,12,7,4,2,7],chords:[0,5,0,7],lead:'triangle',syncopated:true},
 bike:{bpm:116,root:220,melody:[0,4,7,12,7,4,2,7,4,7,12,14,12,7,4,2],chords:[0,5,7,0],lead:'triangle'},
 pool:{bpm:108,root:196,melody:[0,7,4,9,7,4,2,4,7,12,9,7,4,2,7,4],chords:[0,5,0,7],lead:'sine',syncopated:true},
 shop:{bpm:122,root:246.94,melody:[0,4,7,4,2,5,9,5,4,7,11,7,9,7,4,2],chords:[0,5,7,0],lead:'triangle',syncopated:true},
 cook:{bpm:112,root:220,melody:[0,7,9,7,4,2,4,7,9,12,9,7,4,7,2,4],chords:[0,5,0,7],lead:'triangle',syncopated:true},
 sleep:{bpm:78,root:174.61,melody:[0,7,12,7,4,7,11,7,2,7,9,7,4,2,7,4],chords:[0,5,0,7],lead:'sine',soft:true},
 run:{bpm:142,root:220,melody:[0,7,12,7,4,7,9,7,12,14,12,7,9,7,4,7],chords:[0,5,7,0],lead:'triangle'},
 schedule:{bpm:104,root:261.63,melody:[0,2,4,7,9,7,4,2,4,7,9,12,9,7,4,2],chords:[0,5,7,0],lead:'triangle'},
 remote:{bpm:116,root:196,melody:[0,3,7,3,5,3,2,7,10,7,5,3,7,5,3,2],chords:[0,5,3,7],lead:'triangle',syncopated:true},
 delivery:{bpm:98,root:196,melody:[0,3,7,10,7,5,3,2,0,7,3,5,7,10,7,2],chords:[0,5,3,7],lead:'triangle',soft:true,syncopated:true},
 night:{bpm:94,root:174.61,melody:[0,7,3,7,2,7,5,3,0,3,7,10,7,5,3,2],chords:[0,5,3,7],lead:'sine',soft:true},
};
export function musicStep(theme:string,step:number):MusicNote[]{
 const p=MUSIC[theme];if(!p)return [];
 const eighth=30/p.bpm,bar=Math.floor(step/8)%4,n=step%8,chord=p.chords[bar],soft=p.soft;
 const hz=(semi:number)=>p.root*2**(semi/12),notes:MusicNote[]=[];
 const add=(semi:number,duration:number,type:OscillatorType,gain:number)=>notes.push({hz:hz(semi),duration,type,gain});
 // A little breathing space at the end of each phrase keeps the loop musical.
 if(step%32!==31)add(p.melody[step%16]+chord,eighth*(n%2?.65:.85),p.lead,soft?.085:.105);
 if(n%2===0)add(chord-12+(n===4?7:0),eighth*1.45,'triangle',soft?.10:.15);
 if(n===0){add(chord,eighth*3,'sine',.025);add(chord+7,eighth*3,'sine',.02);}
 // Pitched electronic percussion: no random noise, no vibration on the beat.
 if(n===(p.syncopated?3:4)||n===0)notes.push({hz:105,duration:.11,type:'sine',gain:soft?.09:.18,endHz:44});
 if(n===2||n===6)notes.push({hz:soft?700:1250,duration:.045,type:'triangle',gain:soft?.025:.055,endHz:180});
 if(!soft||n%2===1)notes.push({hz:5600,duration:.018,type:'square',gain:soft?.007:.012,endHz:3400});
 return notes;
}

// The rhythm game calls this from its own chart clock, never a second timer.
export function gymBeat(stage:number,beat:number):MusicNote[]{
 const notes:MusicNote[]=[{hz:beat%4===0?660:330,duration:.09,type:'sine',gain:.3}];
 if(beat<0)return notes;
 const root=[110,98,130.81][stage],step=beat%8;
 notes.push({hz:root*2**([0,0,7,0,3,3,10,7][step]/12),duration:.34,type:'triangle',gain:.24});
 if(beat%2===1)notes.push({hz:root*2*2**([12,15,19,15,17,15,14,10][step]/12),duration:.16,type:'triangle',gain:.11});
 notes.push({hz:beat%2===0?110:1400,duration:beat%2===0?.10:.04,type:beat%2===0?'sine':'triangle',gain:.10,endHz:beat%2===0?45:220});
 notes.push({hz:5600,duration:.02,type:'square',gain:.012,endHz:3400});
 return notes;
}
