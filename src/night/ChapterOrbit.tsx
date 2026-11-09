export const chapterBadges=[
 {name:'01 · Крути педали',x:90,y:75,tone:'#e8c586'},
 {name:'02 · Заплыв с сюрпризом',x:188,y:45,tone:'#b6d9df'},
 {name:'03 · Правильная закупка',x:332,y:45,tone:'#c7d6aa'},
 {name:'04 · Диетический ужин',x:430,y:75,tone:'#e6bda0'},
 {name:'05 · Качай в ритм',x:465,y:180,tone:'#cbc2e1'},
 {name:'06 · Ещё пять минут',x:430,y:286,tone:'#b9c8e0'},
 {name:'07 · Утренний бег',x:90,y:286,tone:'#e7c28c'},
 {name:'08 · Всё по расписанию',x:55,y:180,tone:'#bdd6bf'},
];
function GameIcon({index}:{index:number}){
 const shapes=[
 <><circle cx="13" cy="43" r="10" fill="#fff7e4"/><circle cx="50" cy="43" r="10" fill="#fff7e4"/><path d="M13 43 25 22 36 43H13L29 31H42M36 43 42 18h8M20 20h12" fill="none" stroke="#d77743" strokeWidth="4"/><path d="m42 18 8 25M24 22l5 9" fill="none"/></>,
 <><path d="M5 45q7-7 14 0t14 0t14 0t12 0M5 55q7-7 14 0t14 0t14 0t12 0" fill="none" stroke="#428d9a" strokeWidth="3"/><path d="M12 20q20-15 40 0v13H12Z" fill="#edbd63"/><rect x="12" y="24" width="16" height="12" rx="5" fill="#90c5d6"/><rect x="36" y="24" width="16" height="12" rx="5" fill="#90c5d6"/><path d="M28 29h8"/></>,
 <><path d="M12 29h42l-5 26H17Z" fill="#e7ad61"/><path d="m22 30 8-19m12 19-8-19" fill="none" strokeWidth="3"/><path d="M20 39v10m12-10v10m12-10v10" stroke="#fff7e4"/><circle cx="21" cy="23" r="7" fill="#bf6147"/><path d="M33 25V13m-4 9q-10-10 0-13 5-8 12-2 11 1 6 12-4 8-12 3" fill="#82a46b"/></>,
 <><path d="M10 33h39q0 22-20 22T10 33Z" fill="#dc8f5e"/><path d="M48 39h13" fill="none" strokeWidth="5"/><ellipse cx="29" cy="33" rx="19" ry="7" fill="#fff3cd"/><circle cx="30" cy="32" r="5" fill="#e7b448"/><path d="M20 20q-6-5 0-10m11 10q-6-5 0-10m11 10q-6-5 0-10" fill="none" stroke="#7d9e87"/></>,
 <><path d="M17 32h30" fill="none" stroke="#485a63" strokeWidth="6"/><rect x="8" y="18" width="10" height="28" rx="3" fill="#a88aba"/><rect x="1" y="24" width="7" height="16" rx="2" fill="#c4aed0"/><rect x="46" y="18" width="10" height="28" rx="3" fill="#a88aba"/><rect x="56" y="24" width="7" height="16" rx="2" fill="#c4aed0"/><path d="m25 17 6-9 7 9m-7-9v13" fill="none" stroke="#d7aa49"/></>,
 <><path d="M33 8q-13 21 13 32C18 56-2 24 20 9q6-3 13-1Z" fill="#edc662"/><path d="m43 13 5 3 5-3-1 6 4 4-6 1-3 5-3-5-6-1 4-4Z" fill="#fff3cd"/><path d="M39 42h13l-13 13h13" fill="none" stroke="#6a83a8" strokeWidth="3"/></>,
 <><path d="M10 14h18l5 15 18 8q11 4 10 15H5V35l5-7Z" fill="#df9257"/><path d="M5 48h56v8H5Z" fill="#fff5da"/><path d="m28 28 8-2m-4 8 9-2m-3 8 9-2" fill="none" stroke="#fff5da" strokeWidth="3"/><path d="M2 11h6m-8 8h6" stroke="#718d79"/></>,
 <><rect x="9" y="12" width="46" height="44" rx="5" fill="#fff7e4"/><path d="M9 24h46" stroke="#5f927c" strokeWidth="7"/><path d="M21 7v12m22-12v12" strokeWidth="4"/><path d="M17 33h10v8H17Zm16 0h14v8H33ZM17 45h20v6H17Z" fill="#94b7a0" stroke="none"/><path d="m40 47 3 3 7-8" fill="none" stroke="#d78047" strokeWidth="3"/></>,
 ];
 return <g stroke="#2a4039" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{shapes[index]}</g>;
}
export default function ChapterOrbit(){return <g aria-hidden="true"><ellipse cx="260" cy="178" rx="205" ry="125" fill="none" stroke="#819c82" strokeWidth="1.5" strokeDasharray="4 6"/><text x="260" y="16" textAnchor="middle" fill="#486958" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="700" letterSpacing="1">ДОСТИЖЕНИЯ СОБРАНЫ</text>{chapterBadges.map((badge,index)=><g key={badge.name} transform={`translate(${badge.x} ${badge.y}) rotate(${index%2?7:-7})`}><title>{badge.name}</title><circle cx="2" cy="3" r="29" fill="#263d38" opacity=".2"/><circle r="29" fill={badge.tone} stroke="#263d38" strokeWidth="2"/><circle r="25" fill="#fff7e4" stroke="#263d38" strokeWidth=".8"/><g transform="translate(-21 -22) scale(.66)"><GameIcon index={index}/></g><rect x="12" y="15" width="22" height="15" rx="5" fill="#385e4f" stroke="#263d38" strokeWidth="1"/><text x="23" y="26" textAnchor="middle" fill="#fff4d4" fontFamily="Arial,sans-serif" fontSize="9" fontWeight="700">{String(index+1).padStart(2,'0')}</text></g>)}</g>;}
