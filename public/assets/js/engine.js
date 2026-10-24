/* ---------- ILLUSTRATION ENGINE (men): heads, hair, beards, figures, garments ---------- */
let UID=0;
function shade(h,p){if(!h||h[0]!=='#')return h;let n=parseInt(h.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;const t=p<0?0:255,a=Math.abs(p);r=Math.round(r+(t-r)*a);g=Math.round(g+(t-g)*a);b=Math.round(b+(t-b)*a);return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}
const P=(d,f,x='')=>`<path d="${d}" fill="${f}" ${x}/>`;
const FOLD='stroke="rgba(0,0,0,.16)" stroke-width="1.1" fill="none" stroke-linecap="round"';
const MIR=(s,cx=100)=>`<g transform="matrix(-1 0 0 1 ${cx*2} 0)">${s}</g>`;
const both=(s,cx=100)=>s+MIR(s,cx);
const SKINS=['#F3D2B3','#E6B48E','#D19A6E','#B47A52','#8E5A38','#5E3A24'];
const HAIRCOLS=[['#1A1210','Black'],['#3A2416','Dark brown'],['#6B4428','Brown'],['#A9773F','Light brown'],['#8C8C8C','Grey'],['#D9D4CC','Silver']];

/* face shapes: tw temple, cw cheekbone, jw jaw half-width, jy jaw corner y, chy chin y, chw chin half-width */
const FACES={
  oval:{n:'Oval',tw:41,cw:44,jw:33,jy:136,chy:161,chw:12},
  round:{n:'Round',tw:43,cw:48,jw:40,jy:140,chy:157,chw:19},
  square:{n:'Square',tw:44,cw:45,jw:43,jy:144,chy:159,chw:23},
  oblong:{n:'Oblong',tw:39,cw:41,jw:33,jy:148,chy:170,chw:14},
  heart:{n:'Heart',tw:46,cw:45,jw:29,jy:134,chy:161,chw:8},
  diamond:{n:'Diamond',tw:36,cw:47,jw:30,jy:137,chy:161,chw:9}
};
function facePath(f){
  const {tw,cw,jw,jy,chy,chw}=f;
  const R=`C ${100+tw*.6},38 ${100+tw},50 ${100+tw},80 C ${100+tw+1},90 ${100+cw},96 ${100+cw},110 C ${100+cw},${(110+jy)/2} ${100+jw+3},${jy-10} ${100+jw},${jy} C ${100+jw-4},${jy+8} ${100+chw+8},${chy-3} ${100+chw},${chy} Q 100,${chy+4} ${100-chw},${chy}`;
  const L=`C ${100-chw-8},${chy-3} ${100-jw+4},${jy+8} ${100-jw},${jy} C ${100-jw-3},${jy-10} ${100-cw},${(110+jy)/2} ${100-cw},110 C ${100-cw},96 ${100-tw-1},90 ${100-tw},80 C ${100-tw},50 ${100-tw*.6},38 100,38`;
  return `M 100,38 ${R} ${L} Z`;
}

/* ---------- hair ---------- */
// Each style returns {back, front} SVG using the face geometry f and colour H.
// sides: how short the sides are, 0 = skin, 1 = full hair.
function hairParts(id,f,H){
  const {tw}=f, dk=shade(H,-.35), lt=shade(H,.18);
  const Lx=100-tw, Rx=100+tw;
  const strands=(arr)=>arr.map(d=>`<path d="${d}" stroke="${dk}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/>`).join('');
  const shine=(d)=>`<path d="${d}" stroke="${lt}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45"/>`;
  // closely cropped cap over the skull with a natural hairline
  const cap=(o=3,hl=73)=>`M ${Lx-o},102 C ${Lx-o-4},58 ${100-tw*.58},${34-o} 100,${33-o} C ${100+tw*.58},${34-o} ${Rx+o+4},58 ${Rx+o},102 L ${Rx-2},102 C ${Rx-2},90 ${Rx-4},82 ${Rx-9},78 C ${100+tw*.4},${hl-1} ${100-tw*.4},${hl-1} ${Lx+9},78 C ${Lx+4},82 ${Lx+2},90 ${Lx+2},102 Z`;
  // side panels (temple to sideburn)
  // the cap fades from full colour on top to the side length near the ears (fades and tapers)
  let sideA=.6;
  const cx=100-f.cw;
  const sides=(a)=>{sideA=a;return a<=.05?'':both(`<path d="M ${cx+3},92 L ${cx+9},92 L ${cx+8},106 Q ${cx+6},112 ${cx+4.5},106 Z" fill="${H}" opacity="${Math.min(.9,a+.15)}"/>`)};
  const top=(d,extra='')=>`<path d="${d}" fill="${H}"/>${extra}`;
  const capF=(o,hl)=>`<path d="${cap(o,hl)}" fill="url(#fd${id}${f.tw})"/>`;
  const S={
    shaved:()=>({front:`<path d="${cap(1,74)}" fill="${H}" opacity=".10"/>`+shine(`M ${100-tw*.5},44 Q 100,38 ${100+tw*.2},42`)}),
    buzz:()=>({front:`<path d="${cap(1.5,74)}" fill="${H}" opacity=".62"/>`+sides(.45)}),
    crew:()=>({front:capF(3,72)+top(`M ${Lx+6},76 C ${100-tw*.4},64 ${100+tw*.4},64 ${Rx-6},76 C ${100+tw*.4},70 ${100-tw*.4},70 ${Lx+6},76Z`)+sides(.55)+strands([`M 88,50 l2,12`,`M 100,46 l1,12`,`M 112,50 l-1,12`])}),
    ivy:()=>({front:capF(4,72)+top(`M ${Lx+6},80 C ${100-tw*.7},60 ${100+tw*.2},58 ${Rx-4},70 C ${100+tw*.2},66 ${100-tw*.5},68 ${Lx+6},80Z`)+sides(.55)+strands([`M ${100-tw*.45},44 C ${100-tw*.4},54 ${100-tw*.42},62 ${100-tw*.5},70`,`M 104,44 C 112,52 118,58 126,66`])}),
    caesar:()=>({front:capF(4,72)+top(`M ${Lx+4},84 C ${Lx+6},74 ${Rx-6},74 ${Rx-4},84 L ${Rx-6},80 C 120,76 80,76 ${Lx+6},80Z`)+top(`M ${Lx+5},70 L ${Rx-5},70 L ${Rx-5},82 Q 100,78 ${Lx+5},82Z`)+sides(.6)+strands([`M 80,72 l-1,8`,`M 92,72 l-1,8`,`M 104,72 l-1,8`,`M 116,72 l-1,8`])}),
    crop:()=>({front:capF(5,72)+top(`M ${Lx+4},86 C ${Lx+2},70 ${100-tw*.6},62 100,62 C ${100+tw*.6},62 ${Rx-2},70 ${Rx-4},86 L ${Rx-8},82 L ${Rx-14},86 L ${100+tw*.45},80 L ${100+tw*.2},85 L 100,79 L ${100-tw*.2},85 L ${100-tw*.45},80 L ${Lx+14},86 L ${Lx+8},82 Z`)+sides(.25)+strands([`M 84,50 l-3,14`,`M 96,46 l-2,16`,`M 108,48 l-1,14`,`M 118,52 l1,12`])}),
    textcrop:()=>({front:capF(7,72)+top(`M ${Lx+2},84 C ${Lx-2},58 ${100-tw*.5},${24} 100,24 C ${100+tw*.5},24 ${Rx+2},58 ${Rx-2},84 L ${Rx-9},76 L ${Rx-12},84 L ${100+tw*.4},74 L ${100+tw*.15},82 L 100,72 L ${100-tw*.2},81 L ${100-tw*.45},73 L ${Lx+12},83 L ${Lx+8},76Z`)+sides(.2)+strands([`M 80,40 l-4,18`,`M 92,30 l-4,22`,`M 106,30 l0,22`,`M 118,38 l3,18`])}),
    messy:()=>({front:capF(6,72)+top(`M ${Lx},88 C ${Lx-6},50 ${100-tw*.5},22 100,24 C ${100+tw*.6},20 ${Rx+8},48 ${Rx},88 L ${Rx-6},74 L ${Rx-10},86 L ${100+tw*.5},70 L ${100+tw*.3},84 L ${100+tw*.05},70 L ${100-tw*.2},86 L ${100-tw*.4},70 L ${Lx+10},88 L ${Lx+6},76Z`)+top(`M 76,28 l-8,-6 l12,2Z M 120,26 l10,-8 l-4,10Z M 98,22 l2,-10 l4,10Z`)+sides(.5)+strands([`M 78,36 l-6,20`,`M 96,28 l-6,24`,`M 112,30 l4,22`,`M 124,40 l6,16`])}),
    brushup:()=>({front:capF(4,73)+top(`M ${Lx+5},72 C ${Lx+2},48 ${Lx+8},20 ${100-tw*.3},16 L ${100+tw*.3},16 C ${Rx-8},20 ${Rx-2},48 ${Rx-5},72 C ${100+tw*.4},68 ${100-tw*.4},68 ${Lx+5},72Z`)+sides(.25)+strands([`M 84,66 L 82,22`,`M 94,66 L 93,18`,`M 106,66 L 107,18`,`M 116,66 L 118,22`])+shine(`M 100,22 L 100,56`)}),
    spiky:()=>({front:capF(4,73)+top(`M ${Lx+4},74 L ${Lx},40 L ${Lx+12},50 L ${100-tw*.5},18 L ${100-tw*.2},42 L 100,10 L ${100+tw*.2},42 L ${100+tw*.5},18 L ${Rx-12},50 L ${Rx},40 L ${Rx-4},74 C ${100+tw*.4},68 ${100-tw*.4},68 ${Lx+4},74Z`)+sides(.4)}),
    fauxhawk:()=>({front:top(cap(2,73),'')+`<path d="${cap(2,73)}" fill="${H}" opacity="0"/>`+top(`M ${100-tw*.5},72 C ${100-tw*.55},50 ${100-tw*.3},26 100,6 C ${100+tw*.3},26 ${100+tw*.55},50 ${100+tw*.5},72 C ${100+tw*.2},68 ${100-tw*.2},68 ${100-tw*.5},72Z`)+sides(.15)+strands([`M 92,66 L 98,16`,`M 108,66 L 102,16`])+shine(`M 100,14 L 100,50`)}),
    quiff:()=>({front:capF(5,73)+top(`M ${Lx+6},76 C ${Lx+2},50 ${100-tw*.6},24 ${100-tw*.1},18 C ${100+tw*.5},10 ${Rx+6},26 ${Rx-2},50 C ${Rx-8},44 ${100+tw*.3},40 ${100+tw*.1},46 C ${100+tw*.4},56 ${Rx-4},62 ${Rx-6},76 C ${100+tw*.4},70 ${100-tw*.4},70 ${Lx+6},76Z`)+sides(.22)+strands([`M 84,70 C 82,46 92,26 108,20`,`M 96,68 C 96,48 104,32 122,26`,`M 110,64 C 112,52 120,40 132,36`])+shine(`M 90,34 C 98,24 110,20 122,22`)}),
    pompadour:()=>({front:capF(5,73)+top(`M ${Lx+5},76 C ${Lx-4},44 ${100-tw*.7},8 100,6 C ${100+tw*.7},8 ${Rx+4},44 ${Rx-5},76 C ${100+tw*.4},68 ${100-tw*.4},68 ${Lx+5},76Z`)+sides(.35)+strands([`M 80,70 C 72,46 84,18 100,14`,`M 92,68 C 88,46 96,24 112,18`,`M 106,68 C 108,48 114,30 126,26`,`M 118,70 C 124,54 128,40 132,36`])+shine(`M 84,30 C 92,16 108,12 120,16`)}),
    sidepart:()=>({front:capF(6,72)+top(`M ${Lx+5},82 C ${Lx},56 ${100-tw*.62},34 ${100-tw*.45},32 C ${100-tw*.2},26 ${100+tw*.5},24 ${Rx+2},44 C ${Rx+6},56 ${Rx},70 ${Rx-4},80 C ${100+tw*.5},64 ${100},58 ${100-tw*.4},66 L ${100-tw*.45},40 C ${100-tw*.55},52 ${Lx+8},64 ${Lx+5},82Z`)+sides(.55)+`<path d="M ${100-tw*.45},36 L ${100-tw*.42},64" stroke="${shade(H,.35)}" stroke-width="1.4" opacity=".7"/>`+strands([`M ${100-tw*.3},38 C 100,36 116,40 128,52`,`M ${100-tw*.3},48 C 98,46 114,50 126,62`,`M ${100-tw*.6},44 C ${Lx+8},54 ${Lx+6},66 ${Lx+5},78`])+shine(`M ${100-tw*.2},32 C 104,30 118,34 128,44`)}),
    combover:()=>({front:capF(4,72)+top(`M ${100-tw*.5},40 C ${100-tw*.2},22 ${100+tw*.6},20 ${Rx+4},40 C ${Rx+6},54 ${Rx-2},66 ${Rx-6},74 C ${100+tw*.5},62 ${100},58 ${100-tw*.45},64 Z`)+sides(.2)+`<path d="M ${100-tw*.5},36 L ${100-tw*.46},66" stroke="${'#F2E6DA'}" stroke-width="2" opacity=".75"/>`+strands([`M ${100-tw*.35},34 C 98,28 116,32 132,46`,`M ${100-tw*.35},46 C 96,40 114,44 130,58`])+shine(`M ${100-tw*.2},30 C 104,24 120,28 130,40`)}),
    slickback:()=>({front:capF(6,71)+top(`M ${Lx+4},80 C ${Lx-2},50 ${100-tw*.6},24 100,22 C ${100+tw*.6},24 ${Rx+2},50 ${Rx-4},80 C ${Rx-8},70 ${100+tw*.5},64 100,64 C ${100-tw*.5},64 ${Lx+8},70 ${Lx+4},80Z`)+sides(.65)+strands([`M 82,66 C 80,48 86,34 96,28`,`M 94,64 C 92,46 96,32 104,26`,`M 106,64 C 106,46 108,34 112,28`,`M 118,66 C 120,50 118,38 114,30`])+shine(`M 88,40 C 96,28 108,26 116,32`)}),
    undercut:()=>({front:top(`M ${Lx+2},70 C ${Lx-4},40 ${100-tw*.5},16 100,16 C ${100+tw*.7},14 ${Rx+10},34 ${Rx+4},62 C ${Rx},70 ${Rx-6},70 ${Rx-8},74 C ${100+tw*.4},62 ${100-tw*.3},60 ${Lx+8},76 Z`)+`<path d="${cap(1,73)}" fill="${H}" opacity=".18"/>`+strands([`M 82,64 C 84,40 98,24 118,22`,`M 94,62 C 98,44 110,32 130,30`,`M 108,62 C 114,50 124,42 136,44`])+shine(`M 86,36 C 98,22 116,18 128,24`)}),
    middlepart:()=>({front:capF(6,72)+top(`M 100,34 C ${100-tw*.5},34 ${Lx-6},52 ${Lx-4},96 L ${Lx+4},96 C ${Lx+6},80 ${Lx+12},74 ${100-tw*.4},76 C ${100-tw*.15},70 98,58 100,46 C 102,58 ${100+tw*.15},70 ${100+tw*.4},76 C ${Rx-12},74 ${Rx-6},80 ${Rx-4},96 L ${Rx+4},96 C ${Rx+6},52 ${100+tw*.5},34 100,34Z`)+sides(.9)+strands([`M 98,40 C 88,50 80,62 ${Lx+4},86`,`M 102,40 C 112,50 120,62 ${Rx-4},86`,`M 96,50 C 90,58 86,66 82,74`,`M 104,50 C 110,58 114,66 118,74`])}),
    curlytop:()=>{let c='';const pts=[[78,44],[90,36],[102,34],[114,37],[124,46],[84,56],[96,50],[108,50],[120,58],[74,58],[128,60],[88,66],[100,62],[112,66]];pts.forEach(([x,y])=>c+=`<circle cx="${x}" cy="${y-6}" r="9.5" fill="${H}"/><path d="M ${x-4},${y-8} q4,-4 8,0" stroke="${dk}" stroke-width="1.2" fill="none" opacity=".6"/>`);return {front:capF(4,72)+c+sides(.2)}},
    afro:()=>{let c='';for(let a=0;a<360;a+=18){const r=a*Math.PI/180,x=100+Math.cos(r)*60,y=70+Math.sin(r)*48;if(y<118)c+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="14" fill="${H}"/>`}
      let t='';for(let i=0;i<40;i++){const a=(i*137.5)%360*Math.PI/180,rr=Math.sqrt(i/40)*56;const x=100+Math.cos(a)*rr,y=66+Math.sin(a)*rr*.8;if(y<100)t+=`<path d="M ${(x-3).toFixed(1)},${y.toFixed(1)} q3,-3 6,0" stroke="${dk}" stroke-width="1.2" fill="none" opacity=".5"/>`}
      return {back:`<ellipse cx="100" cy="68" rx="62" ry="52" fill="${H}"/>`+c,front:top(`M ${Lx-8},96 C ${Lx-10},46 ${100-tw*.6},20 100,20 C ${100+tw*.6},20 ${Rx+10},46 ${Rx+8},96 L ${Rx},96 C ${Rx},84 ${Rx-6},78 ${Rx-10},76 C ${100+tw*.3},70 ${100-tw*.3},70 ${Lx+10},76 C ${Lx+6},78 ${Lx},84 ${Lx},96Z`)+t}},
    twists:()=>{let c='';[[80,40],[90,32],[100,30],[110,32],[120,40],[84,52],[96,46],[108,46],[118,52]].forEach(([x,y])=>c+=`<rect x="${x-4}" y="${y-14}" width="8" height="24" rx="4" fill="${H}"/><path d="M ${x-3},${y-8} l6,3 M ${x-3},${y-1} l6,3 M ${x-3},${y+6} l6,3" stroke="${dk}" stroke-width="1" opacity=".6"/>`);return {front:capF(3,72)+c+sides(.15)}},
    manbun:()=>({back:`<circle cx="100" cy="26" r="15" fill="${H}"/><path d="M 88,22 q12,-8 24,0 M 90,30 q10,6 20,0" stroke="${dk}" stroke-width="1.3" fill="none" opacity=".55"/>`,front:capF(5,71)+top(`M ${Lx+4},84 C ${Lx-2},52 ${100-tw*.5},30 100,30 C ${100+tw*.5},30 ${Rx+2},52 ${Rx-4},84 C ${Rx-8},72 ${100+tw*.4},66 100,66 C ${100-tw*.4},66 ${Lx+8},72 ${Lx+4},84Z`)+sides(.8)+strands([`M 84,66 C 84,48 92,36 100,32`,`M 116,66 C 116,48 108,36 100,32`,`M 100,66 L 100,34`])}),
    longflow:()=>({back:`<path d="M ${Lx-6},70 C ${Lx-12},110 ${Lx-8},140 ${Lx+2},156 L ${Rx-2},156 C ${Rx+8},140 ${Rx+12},110 ${Rx+6},70Z" fill="${shade(H,-.1)}"/>`,front:capF(6,71)+top(`M ${Lx-2},120 C ${Lx-8},60 ${100-tw*.5},24 100,24 C ${100+tw*.5},24 ${Rx+8},60 ${Rx+2},120 L ${Rx-3},118 C ${Rx-1},96 ${Rx-6},76 ${100+tw*.4},68 C ${100+tw*.2},64 ${100-tw*.2},64 ${100-tw*.4},68 C ${Lx+6},76 ${Lx+1},96 ${Lx+3},118Z`)+strands([`M 86,64 C 84,44 92,32 104,28`,`M 112,64 C 114,46 110,34 102,28`,`M ${Lx+2},80 C ${Lx},96 ${Lx+1},108 ${Lx+2},118`,`M ${Rx-2},80 C ${Rx},96 ${Rx-1},108 ${Rx-2},118`])+shine(`M 90,36 C 98,28 110,28 116,34`)}),
    shoulder:()=>({back:`<path d="M ${Lx-8},70 C ${Lx-16},120 ${Lx-14},170 ${Lx-10},196 L ${Rx+10},196 C ${Rx+14},170 ${Rx+16},120 ${Rx+8},70Z" fill="${shade(H,-.12)}"/>`,front:capF(6,71)+top(`M 100,32 C ${100-tw*.6},32 ${Lx-10},60 ${Lx-8},170 L ${Lx},170 C ${Lx-2},120 ${Lx+4},84 ${100-tw*.35},74 C ${100-tw*.1},66 99,52 100,42 C 101,52 ${100+tw*.1},66 ${100+tw*.35},74 C ${Rx-4},84 ${Rx+2},120 ${Rx},170 L ${Rx+8},170 C ${Rx+10},60 ${100+tw*.6},32 100,32Z`)+strands([`M 98,40 C 84,52 ${Lx-2},80 ${Lx-4},150`,`M 102,40 C 116,52 ${Rx+2},80 ${Rx+4},150`,`M 94,50 C 84,62 ${Lx+4},96 ${Lx+2},160`,`M 106,50 C 116,62 ${Rx-4},96 ${Rx-2},160`])}),
    mullet:()=>({back:`<path d="M ${Lx-4},80 C ${Lx-8},120 ${Lx-2},150 ${Lx+8},160 L ${Rx-8},160 C ${Rx+2},150 ${Rx+8},120 ${Rx+4},80Z" fill="${shade(H,-.1)}"/>`,front:capF(6,72)+top(`M ${Lx+3},84 C ${Lx},62 ${100-tw*.5},28 100,28 C ${100+tw*.5},28 ${Rx},62 ${Rx-3},84 L ${Rx-8},78 L ${100+tw*.4},84 L ${100+tw*.1},76 L ${100-tw*.2},84 L ${100-tw*.45},76 L ${Lx+8},82Z`)+sides(.3)+strands([`M 86,40 l-3,20`,`M 100,34 l-1,24`,`M 114,40 l2,20`])}),
    taperfade:()=>({front:capF(5,72)+top(`M ${Lx+6},78 C ${Lx+2},54 ${100-tw*.5},30 100,28 C ${100+tw*.5},30 ${Rx-2},54 ${Rx-6},78 C ${100+tw*.4},68 ${100-tw*.4},68 ${Lx+6},78Z`)+sides(.12)+strands([`M 86,44 C 92,40 104,40 114,46`,`M 84,56 C 92,52 106,52 118,58`])+shine(`M 90,36 C 98,32 106,32 112,34`)})
  };
  const r=(S[id]||S.crew)();
  // gradient used by capF; defined after the style ran so it knows the side length
  const grad=`<defs><linearGradient id="fd${id}${f.tw}" gradientUnits="userSpaceOnUse" x1="0" y1="62" x2="0" y2="104"><stop offset="0" stop-color="${H}"/><stop offset="1" stop-color="${H}" stop-opacity="${sideA}"/></linearGradient></defs>`;
  r.front=grad+(r.front||'');
  return r;
}

/* ---------- beards ---------- */
function beard(id,f,H,S){
  if(!id||id==='clean')return '';
  const {cw,jw,jy,chy,chw,tw}=f, my=chy-19, dk=shade(H,-.3);
  const outer=(t)=>`M ${100-tw},96 C ${100-cw},104 ${100-cw},${jy-14} ${100-jw-1},${jy} C ${100-jw+3},${jy+12+t*.5} ${100-chw-10},${chy+t*.6} 100,${chy+t} C ${100+chw+10},${chy+t*.6} ${100+jw-3},${jy+12+t*.5} ${100+jw+1},${jy} C ${100+cw},${jy-14} ${100+cw},104 ${100+tw},96`;
  const inner=`L ${100+cw-6},98 C ${100+cw-8},116 ${100+jw-6},${my-6} ${100+20},${my-8} C 112,${my-12} 88,${my-12} 80,${my-8} C ${100-jw+6},${my-6} ${100-cw+8},116 ${100-cw+6},98 Z`;
  const mou=`M ${100-17},${my+1} C 92,${my-8} 108,${my-8} ${100+17},${my+1} C 110,${my-3} 90,${my-3} ${100-17},${my+1}Z`;
  const lip=`<path d="M 92,${my+3} Q 100,${my+6} 108,${my+3}" stroke="${shade(S,-.35)}" stroke-width="1.6" fill="none"/>`;
  const goat=(t)=>`M ${100-14},${my+5} C ${100-15},${chy-2} ${100-10},${chy+t} 100,${chy+t+1} C ${100+10},${chy+t} ${100+15},${chy-2} ${100+14},${my+5} Q 100,${my+10} ${100-14},${my+5}Z`;
  const fill=(d,o=1)=>`<path d="${d}" fill="${H}" opacity="${o}"/>`;
  const tex=(o)=>{let s='';for(let i=0;i<70;i++){const a=i*2.39996,r=Math.sqrt(i/70);const x=100+Math.cos(a)*r*(jw+4),y=my+4+Math.abs(Math.sin(a))*r*(chy-my+2);s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r=".8" fill="${dk}"/>`}return `<g opacity="${o}">${s}</g>`};
  const B={
    stubble:()=>fill(outer(1)+inner,.22)+fill(mou,.22),
    heavystubble:()=>fill(outer(2)+inner,.42)+fill(mou,.45)+tex(.35),
    short:()=>fill(outer(4)+inner,.92)+fill(mou)+lip+tex(.4),
    full:()=>fill(outer(16)+inner)+fill(mou)+lip+tex(.5),
    long:()=>fill(outer(36)+inner)+fill(mou)+lip+tex(.5),
    goatee:()=>fill(goat(4))+fill(mou)+lip,
    circle:()=>fill(goat(2))+fill(mou)+lip,
    moustache:()=>fill(`M ${100-19},${my+2} C 90,${my-9} 110,${my-9} ${100+19},${my+2} C 110,${my-2} 90,${my-2} ${100-19},${my+2}Z`)
  };
  return (B[id]||B.stubble)();
}

/* ---------- head ---------- */
// o: {face, hair, hc (hair colour), beard, skin, bust (draw shoulders), shirt (bust colour), expr}
function head(o={}){
  const id='h'+(UID++);
  const f=FACES[o.face]||FACES.oval, S=o.skin||SKINS[2], H=o.hc||HAIRCOLS[0][0];
  const hp=hairParts(o.hair||'crew',f,H);
  const dk=shade(S,-.22), my=f.chy-19;
  const neckW=f.jw*.62;
  const defs=`<defs><radialGradient id="g${id}" cx=".42" cy=".38" r=".75"><stop offset="0" stop-color="${shade(S,.08)}"/><stop offset=".7" stop-color="${S}"/><stop offset="1" stop-color="${dk}"/></radialGradient></defs>`;
  let s=defs;
  s+=`<path d="M ${100-neckW},${f.jy-6} L ${100-neckW},${o.bust?176:200} L ${100+neckW},${o.bust?176:200} L ${100+neckW},${f.jy-6}Z" fill="${dk}"/><path d="M ${100-neckW},${f.chy-6} Q 100,${f.chy+14} ${100+neckW},${f.chy-6} L ${100+neckW},${f.chy+6} Q 100,${f.chy+18} ${100-neckW},${f.chy+6}Z" fill="${shade(S,-.4)}" opacity=".35"/>`;
  if(o.bust){const C=o.shirt||'#2E3A4F';s+=`<path d="M 18,200 C 22,178 46,170 ${100-neckW-6},166 Q 100,${184} ${100+neckW+6},166 C 154,170 178,178 182,200Z" fill="${C}"/><path d="M ${100-neckW-6},166 Q 100,${184} ${100+neckW+6},166" fill="none" stroke="${shade(C,-.25)}" stroke-width="2.5"/>`}
  s+=hp.back||'';
  s+=both(`<ellipse cx="${100-f.cw-1}" cy="108" rx="6.5" ry="12" fill="${dk}"/><path d="M ${100-f.cw+1},101 q-5,6 0,14" stroke="${shade(S,-.4)}" stroke-width="1.2" fill="none"/>`);
  s+=`<path d="${facePath(f)}" fill="url(#g${id})"/>`;
  // eyes, brows, nose, mouth
  const ey=106,ex=17;
  s+=both(`<path d="M ${100-ex-7},${ey} Q ${100-ex},${ey-5} ${100-ex+7},${ey} Q ${100-ex},${ey+3.5} ${100-ex-7},${ey}Z" fill="#F7F1EA"/><circle cx="${100-ex+.5}" cy="${ey-.4}" r="3" fill="#2B1A10"/><circle cx="${100-ex+1.4}" cy="${ey-1.4}" r=".9" fill="#fff"/><path d="M ${100-ex-7.5},${ey} Q ${100-ex},${ey-6} ${100-ex+7.5},${ey-.5}" stroke="#1E120B" stroke-width="1.4" fill="none" stroke-linecap="round"/>`);
  s+=both(`<path d="M ${100-ex-9},${ey-10} Q ${100-ex-1},${ey-15} ${100-ex+9},${ey-11.5} L ${100-ex+9},${ey-9} Q ${100-ex-1},${ey-12} ${100-ex-9},${ey-8}Z" fill="${shade(H,-.1)}"/>`);
  s+=`<path d="M 101,${ey+3} C 102,${ey+12} 105,${ey+18} 104,${ey+21} Q 100,${ey+24} 95,${ey+21}" stroke="${shade(S,-.35)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  s+=`<path d="M 90,${my} Q 100,${my+5} 110,${my}" stroke="${shade(S,-.42)}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M 92,${my+3.5} Q 100,${my+6.5} 108,${my+3.5}" stroke="${shade(S,-.12)}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>`;
  s+=`<clipPath id="bc${id}"><path d="${facePath(f)}"/>${o.beard==='full'||o.beard==='long'?`<rect x="${100-f.jw-2}" y="${f.chy-12}" width="${2*f.jw+4}" height="80"/>`:''}</clipPath><g clip-path="url(#bc${id})">${beard(o.beard,f,H,S)}</g>`;
  s+=hp.front||'';
  return s;
}
const headSVG=(o,size)=>`<svg viewBox="0 0 200 200" ${size?`width="${size}" height="${size}"`:''} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${o.label||'Hairstyle illustration'}">${o.bg?`<rect width="200" height="200" fill="${o.bg}"/>`:''}${head(o)}</svg>`;

/* ---------- body ---------- */
const BODY={
  slim:{n:'Slim',w:.9,wa:.88},
  athletic:{n:'Athletic',w:1.06,wa:.88},
  regular:{n:'Regular',w:1,wa:1},
  broad:{n:'Broad',w:1.12,wa:1.08},
  plus:{n:'Plus-size',w:1.2,wa:1.32},
  tall:{n:'Tall',w:.97,wa:.95,h:1.05}
};

/* fabric patterns: A base, B accent, C detail */
function pattern(p,id,A,B,C){
  const o=`<pattern id="${id}" patternUnits="userSpaceOnUse"`;
  switch(p){
    case 'check':return `${o} width="12" height="12"><rect width="12" height="12" fill="${A}"/><rect width="12" height="3" fill="${B}" opacity=".55"/><rect width="3" height="12" fill="${B}" opacity=".55"/></pattern>`;
    case 'gingham':return `${o} width="8" height="8"><rect width="8" height="8" fill="${A}"/><rect width="8" height="4" fill="${B}" opacity=".45"/><rect width="4" height="8" fill="${B}" opacity=".45"/></pattern>`;
    case 'pinstripe':return `${o} width="6" height="6"><rect width="6" height="6" fill="${A}"/><rect width=".7" height="6" fill="${B}" opacity=".7"/></pattern>`;
    case 'stripe':return `${o} width="8" height="8"><rect width="8" height="8" fill="${A}"/><rect width="3" height="8" fill="${B}"/></pattern>`;
    case 'dots':return `${o} width="8" height="8"><rect width="8" height="8" fill="${A}"/><circle cx="4" cy="4" r="1.1" fill="${C}"/></pattern>`;
    case 'floral':return `${o} width="16" height="16"><rect width="16" height="16" fill="${A}"/><g fill="${B}"><circle cx="8" cy="5.8" r="1.8"/><circle cx="8" cy="10.2" r="1.8"/><circle cx="5.8" cy="8" r="1.8"/><circle cx="10.2" cy="8" r="1.8"/></g><circle cx="8" cy="8" r="1.2" fill="${C}"/></pattern>`;
    case 'brocade':return `${o} width="12" height="12"><rect width="12" height="12" fill="${A}"/><ellipse cx="6" cy="6" rx="1.6" ry="2.8" fill="${C}" transform="rotate(30 6 6)" opacity=".85"/><circle cx="0" cy="0" r=".9" fill="${C}"/><circle cx="12" cy="12" r=".9" fill="${C}"/><circle cx="12" cy="0" r=".9" fill="${C}"/><circle cx="0" cy="12" r=".9" fill="${C}"/></pattern>`;
    case 'chikan':return `${o} width="14" height="14"><rect width="14" height="14" fill="${A}"/><g fill="none" stroke="${C}" stroke-width=".7" opacity=".9"><circle cx="7" cy="7" r="2.6"/><path d="M7 2.5v2M7 9.5v2M2.5 7h2M9.5 7h2"/></g></pattern>`;
    case 'ikat':return `${o} width="16" height="12"><rect width="16" height="12" fill="${A}"/><path d="M0 6 L4 1.5 L8 6 L4 10.5Z M8 6 L12 1.5 L16 6 L12 10.5Z" fill="${B}" opacity=".85"/><path d="M2.6 6 L4 4.4 L5.4 6 L4 7.6Z M10.6 6 L12 4.4 L13.4 6 L12 7.6Z" fill="${C}"/></pattern>`;
    case 'block':return `${o} width="16" height="16"><rect width="16" height="16" fill="${A}"/><circle cx="8" cy="8" r="3" fill="none" stroke="${B}" stroke-width="1.2"/><circle cx="8" cy="8" r="1" fill="${C}"/><circle cx="0" cy="0" r="1.1" fill="${B}"/><circle cx="16" cy="16" r="1.1" fill="${B}"/></pattern>`;
    case 'tropical':return `${o} width="22" height="22"><rect width="22" height="22" fill="${A}"/><path d="M5 16 C4 9 9 5 13 4 C11 8 10 12 5 16Z" fill="${B}"/><path d="M14 20 C15 15 19 13 22 13 C20 16 18 19 14 20Z" fill="${B}" opacity=".8"/><circle cx="17" cy="6" r="2" fill="${C}"/></pattern>`;
    case 'denim':return `${o} width="4" height="4"><rect width="4" height="4" fill="${A}"/><path d="M0 4 L4 0" stroke="${shade(A,.12)}" stroke-width=".8"/></pattern>`;
    case 'tweed':return `${o} width="6" height="6"><rect width="6" height="6" fill="${A}"/><path d="M0 6 L6 0 M-1 1 L1 -1 M5 7 L7 5" stroke="${B}" stroke-width=".8" opacity=".5"/><circle cx="2" cy="2" r=".5" fill="${C}"/></pattern>`;
    default:return '';
  }
}

/* ---------- figure ---------- */
// o: {top:{k,c,c2,p,tuck,sl}, bottom:{k,c,c2,fit}, layer:{k,c,c2}, shoe:{k,c}, acc:[...], hair, hc, beard, face, skin, bt}
function figure(o,opt={}){
  const id='f'+(UID++);
  const bt=BODY[o.bt||opt.bt]||BODY.regular, w=bt.w, wa=bt.wa;
  const S=o.skin||opt.skin||SKINS[o.sk??2], Sd=shade(S,-.2);
  const T=o.top||{k:'tee',c:'#EEE'}, Bm=o.bottom||{k:'trousers',c:'#333'}, Ly=o.layer, Sh=o.shoe||{k:'sneaker',c:'#fff'};
  const acc=o.acc||[];
  const has=k=>acc.find(a=>a.split(':')[0]===k);
  const accC=(k,d)=>{const a=has(k);return a&&a.includes(':')?a.split(':')[1]:d};
  let defs=`<linearGradient id="sh${id}" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".42" stop-color="#fff" stop-opacity=".07"/><stop offset=".6" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient>`;
  const fillOf=(g,key)=>{if(g.p){const pid=id+key;defs+=pattern(g.p,pid,g.c,g.c2||shade(g.c,-.25),g.c3||g.c2||'#E8C36A');return `url(#${pid})`}return g.c};
  const shadeOver=d=>`<path d="${d}" fill="url(#sh${id})"/>`;
  const garment=(d,g,key,x='')=>`<path d="${d}" fill="${fillOf(g,key)}" ${x}/>`+shadeOver(d);

  // key measurements
  const SW=36*w, CH=33*w, WA=27*wa, HP=28*Math.max(w,wa*.96), NK=8.5;
  const L=x=>100-x, R=x=>100+x;
  let s='';
  s+=`<ellipse cx="100" cy="386" rx="${46*w}" ry="7" fill="#000" opacity=".12"/>`;

  /* ----- legs & bottoms ----- */
  const fit=Bm.fit||'straight';
  const lc=13.5*w;
  const LW={slim:[15,10,6.6],straight:[15.5,11.5,8.5],wide:[17,15,13.5],churidar:[15,9,6.3],jogger:[16,12,6.8],pyjama:[17,14,12],salwar:[19,17,7.5],jeans:[15,10.5,7.6]}[Bm.k==='jeans'?'jeans':Bm.k==='churidar'?'churidar':Bm.k==='joggers'?'jogger':Bm.k==='pyjama'?'pyjama':Bm.k==='salwar'?'salwar':fit]||[15.5,11.5,8.5];
  const legPath=(end=366,hw=LW)=>{const cx=L(lc),[a,b,c]=hw;const ky=Math.min(286,end-1);return `M ${L(WA)},166 L 100,166 L 100.5,204 C ${cx+a*.7},214 ${cx+b},${Math.min(250,ky-10)} ${cx+b},${ky} L ${cx+c},${end} L ${cx-c},${end} L ${cx-b},${ky} C ${cx-b-1},${Math.min(246,ky-10)} ${L(HP)-1},214 ${L(HP)},198 Z`};
  const skinLeg=(from)=>both(`<path d="M ${L(lc)+7},${from} L ${L(lc)+5.5},366 L ${L(lc)-5.5},366 L ${L(lc)-7.5},${from}Z" fill="${Sd}"/>`);
  const bk=Bm.k;
  if(bk==='shorts'){s+=skinLeg(250);s+=both(garment(legPath(272,[16,14.5,14]),Bm,'b'))}
  else if(bk==='mundu'){const d=`M ${L(WA+1)},166 L ${R(WA+1)},166 L ${R(HP+6)},362 L ${L(HP+6)},362Z`;s+=skinLeg(330);s+=garment(d,Bm,'b')+`<path d="M ${L(HP+6)},356 L ${R(HP+6)},356" stroke="${Bm.c2||'#D4A93C'}" stroke-width="4"/><path d="M ${R(4)},170 L ${R(10)},360" ${FOLD}/><path d="M ${R(10)},168 L ${R(14)},362 L ${R(18)},362" stroke="${Bm.c2||'#D4A93C'}" stroke-width="2.5" fill="none"/>`}
  else if(bk==='dhoti'){const d=`M ${L(WA+1)},166 L ${R(WA+1)},166 C ${R(HP+12)},220 ${R(lc+14)},300 ${R(lc+11)},352 L ${R(lc-8)},352 C ${R(6)},300 ${R(3)},250 100,236 C ${L(3)},250 ${L(6)},300 ${L(lc-8)},352 L ${L(lc+11)},352 C ${L(lc+14)},300 ${L(HP+12)},220 ${L(WA+1)},166Z`;s+=skinLeg(330);s+=garment(d,Bm,'b')+`<path d="M 96,170 C 92,210 94,250 99,300 M 104,170 C 108,210 106,250 101,300 M 92,172 C 86,214 88,250 94,290" ${FOLD}/><path d="M ${L(lc+11)},349 L ${L(lc-8)},349 M ${R(lc-8)},349 L ${R(lc+11)},349" stroke="${Bm.c2||'#D4A93C'}" stroke-width="3"/>`}
  else{
    s+=both(garment(legPath(),Bm,'b'));
    if(bk==='churidar')s+=both([340,346,352,358].map(y=>`<path d="M ${L(lc)-6.6},${y} Q ${L(lc)},${y+3} ${L(lc)+6.6},${y}" ${FOLD}/>`).join(''));
    else if(bk==='joggers')s+=both(`<rect x="${L(lc)-7}" y="356" width="14" height="10" rx="3" fill="${shade(Bm.c,-.12)}"/>`);
    else if(bk==='jeans')s+=both(`<path d="M ${L(lc)+10},214 C ${L(lc)+10},250 ${L(lc)+8},300 ${L(lc)+7},364" stroke="${shade(Bm.c,.25)}" stroke-width=".8" fill="none" stroke-dasharray="2 1.5"/><path d="M ${L(WA)+2},176 Q ${L(WA)+10},184 ${L(WA)+16},176" stroke="${shade(Bm.c,.25)}" stroke-width=".8" fill="none" stroke-dasharray="2 1.5"/>`);
    else if(bk!=='pyjama'&&bk!=='salwar')s+=both(`<path d="M ${L(lc)},200 L ${L(lc)},364" stroke="${shade(Bm.c,-.18)}" stroke-width=".9" opacity=".7"/>`);
    if(bk==='salwar')s+=both(`<path d="M ${L(lc)-8},230 C ${L(lc)-4},280 ${L(lc)-6},330 ${L(lc)-5},360 M ${L(lc)+4},240 C ${L(lc)+6},290 ${L(lc)+3},330 ${L(lc)+3},360" ${FOLD}/>`);
  }

  /* ----- shoes ----- */
  const sk=Sh.k, sc=Sh.c||'#2A1C14';
  const shoe=()=>{const cx=L(lc);switch(sk){
    case 'sneaker':return `<path d="M ${cx-9},368 C ${cx-10},362 ${cx-4},360 ${cx},360 C ${cx+5},360 ${cx+9},362 ${cx+11},368 L ${cx+11},376 L ${cx-10},376Z" fill="${sc}"/><rect x="${cx-10.5}" y="374" width="22" height="5" rx="2" fill="${Sh.c2||'#F4F2EE'}"/><path d="M ${cx-4},364 l6,0 M ${cx-4},367 l7,0" stroke="${shade(sc,-.3)}" stroke-width=".8"/>`;
    case 'mojari':return `<path d="M ${cx-8},368 C ${cx-8},362 ${cx+2},361 ${cx+6},364 C ${cx+9},366 ${cx+11},370 ${cx+13},366 C ${cx+12},374 ${cx+9},378 ${cx},378 L ${cx-8},378Z" fill="${sc}"/><path d="M ${cx-6},372 Q ${cx+4},368 ${cx+12},372" stroke="${Sh.c2||'#E2B84A'}" stroke-width="1.6" fill="none"/>`;
    case 'kolhapuri':return `<path d="M ${cx-7},368 L ${cx+7},368 L ${cx+9},378 L ${cx-8},378Z" fill="${Sd}"/><path d="M ${cx-10},376 L ${cx+11},376 L ${cx+11},380 L ${cx-10},380Z" fill="${sc}"/><path d="M ${cx-6},370 L ${cx+7},370" stroke="${sc}" stroke-width="3"/>`;
    case 'sandal':return `<path d="M ${cx-7},366 L ${cx+7},366 L ${cx+9},377 L ${cx-8},377Z" fill="${Sd}"/><rect x="${cx-10}" y="376" width="21" height="4" rx="1.5" fill="${sc}"/><path d="M ${cx-7},369 L ${cx+8},373 M ${cx+7},369 L ${cx-6},373" stroke="${sc}" stroke-width="2.4"/>`;
    case 'boot':case 'chelsea':return `<path d="M ${cx-8},352 L ${cx+8},352 L ${cx+8},366 C ${cx+12},368 ${cx+13},372 ${cx+13},376 L ${cx-9},376Z" fill="${sc}"/><rect x="${cx-9.5}" y="375" width="23" height="4" rx="1.5" fill="${shade(sc,-.35)}"/>${sk==='chelsea'?`<rect x="${cx-8}" y="354" width="3" height="10" fill="${shade(sc,-.25)}"/>`:`<path d="M ${cx-3},356 l6,0 M ${cx-3},360 l6,0" stroke="${shade(sc,.3)}" stroke-width=".8"/>`}`;
    case 'loafer':return `<path d="M ${cx-9},368 C ${cx-9},363 ${cx-2},362 ${cx+2},363 C ${cx+8},364 ${cx+12},368 ${cx+12},373 L ${cx+12},377 L ${cx-9},377Z" fill="${sc}"/><path d="M ${cx-3},366 L ${cx+6},366" stroke="${shade(sc,-.35)}" stroke-width="1.6"/><rect x="${cx-9.5}" y="376" width="22" height="3" rx="1" fill="${shade(sc,-.4)}"/>`;
    default:return `<path d="M ${cx-9},368 C ${cx-9},362 ${cx-2},361 ${cx+2},362 C ${cx+9},363 ${cx+13},368 ${cx+13},373 L ${cx+13},377 L ${cx-9},377Z" fill="${sc}"/><path d="M ${cx-1},363 L ${cx+4},368" stroke="${shade(sc,.25)}" stroke-width=".8"/><rect x="${cx-9.5}" y="376" width="23" height="3" rx="1" fill="${shade(sc,-.4)}"/><path d="M ${cx+2},364 C ${cx+5},366 ${cx+9},368 ${cx+11},371" stroke="${shade(sc,.35)}" stroke-width="1" fill="none" opacity=".6"/>`;
  }};
  s+=both(shoe());

  /* ----- arms (skin; sleeves drawn over) ----- */
  const armPath=(x0,y0)=>{const sx=L(SW-5),ex=L(SW+3.5),wx=L(SW+5.5);return `M ${sx+6},92 C ${sx-2},90 ${sx-8},96 ${ex-5},150 L ${wx-4.5},204 L ${wx+4.5},204 L ${ex+6},150 C ${sx+6},118 ${sx+9},106 ${sx+10},98Z`};
  const hand=()=>{const wx=L(SW+5.5);return `<path d="M ${wx-5},202 C ${wx-7},210 ${wx-6},220 ${wx-1},224 C ${wx+4},225 ${wx+6},216 ${wx+5},202Z" fill="${S}"/>`};
  s+=both(`<path d="${armPath()}" fill="${Sd}"/>`+hand());

  /* ----- top ----- */
  const tk=T.k;
  const hemY={shirt:T.tuck?170:196,tee:192,polo:190,henley:192,sweater:192,hoodie:196,kurta:T.len==='short'?236:280,sherwani:302,bandhgala:214,pathani:270,angrakha:282,shacket:200}[tk]||192;
  const flare={kurta:9,sherwani:12,pathani:8,angrakha:14,hoodie:3,sweater:2}[tk]||1.5;
  const hw=y=>y<=168?WA+((CH-WA)*(168-y)/80):WA+flare*(y-168)/100+(HP-WA)*Math.min(1,(y-168)/30);
  const torso=(hem,neck='round')=>{const nk=neck==='v'?`L ${R(NK)},80 L 100,${neck==='v'?104:86} L ${L(NK)},80`:neck==='open'?`L ${R(NK)},80 L 100,96 L ${L(NK)},80`:`L ${R(NK)},80 Q 100,${neck==='high'?82:88} ${L(NK)},80`;
    return `M ${L(NK)},80 L ${L(SW-3)},88 C ${L(SW)},92 ${L(CH+1)},104 ${L(CH)},116 L ${L(hw(168))},168 L ${L(hw(hem))},${hem} Q 100,${hem+2} ${R(hw(hem))},${hem} L ${R(hw(168))},168 L ${R(CH)},116 C ${R(CH+1)},104 ${R(SW)},92 ${R(SW-3)},88 ${nk} Z`};
  const sleeve=(len,g,key)=>{const sx=L(SW-5),ex=L(SW+3.5),wx=L(SW+5.5);
    if(len==='none')return '';
    if(len==='short'){const d=`M ${sx+6},88 C ${sx-4},88 ${sx-10},96 ${ex-7},128 L ${ex+8},132 C ${sx+8},116 ${sx+10},104 ${sx+11},96Z`;return garment(d,g,key)}
    const end=len==='three'?178:203, cuffW=len==='three'?6:5.6;
    const d=`M ${sx+6},88 C ${sx-4},88 ${sx-10},96 ${ex-6.5},150 L ${wx-cuffW},${end} L ${wx+cuffW},${end} L ${ex+7},150 C ${sx+7},118 ${sx+10},106 ${sx+11},96Z`;
    return garment(d,g,key)+`<path d="M ${ex-1},146 Q ${ex+2},150 ${ex+5},146" ${FOLD}/>`};
  const collarShirt=(c)=>`<path d="M ${L(NK+1)},79 L 100,92 L ${L(NK+6)},94 L ${L(NK+3)},78Z M ${R(NK+1)},79 L 100,92 L ${R(NK+6)},94 L ${R(NK+3)},78Z" fill="${shade(c,.06)}" stroke="${shade(c,-.25)}" stroke-width=".7"/>`;
  const mandarin=(c)=>`<path d="M ${L(NK+1)},76 Q 100,82 ${R(NK+1)},76 L ${R(NK+1)},82 Q 100,88 ${L(NK+1)},82Z" fill="${shade(c,-.08)}" stroke="${shade(c,-.3)}" stroke-width=".6"/>`;
  const buttons=(y0,y1,n,col)=>{let b='';for(let i=0;i<n;i++){const y=y0+(y1-y0)*i/(Math.max(1,n-1));b+=`<circle cx="100" cy="${y.toFixed(1)}" r="1.15" fill="${col}"/>`}return b};
  // neck skin
  s+=`<path d="M ${L(6.2)},70 L ${L(7)},84 L ${R(7)},84 L ${R(6.2)},70Z" fill="${Sd}"/>`;
  const tc=T.c||'#eee', tf=fillOf(T,'t');
  let topSVG='', slv=T.sl||({tee:'short',polo:'short'}[tk]||'long');
  if(tk==='shirt'){topSVG=garment(torso(hemY,'open'),T,'t')+`<path d="M 100,92 L 100,${hemY}" stroke="${shade(tc,-.2)}" stroke-width=".8"/>`+buttons(100,hemY-8,T.tuck?4:5,shade(tc,-.35))+collarShirt(tc)+(T.tuck?'':`<path d="M ${L(hw(hemY))},${hemY} Q ${L(hw(hemY)-6)},${hemY-6} ${L(hw(hemY)-8)},${hemY-1}" ${FOLD}/>`)}
  else if(tk==='tee'){topSVG=garment(torso(hemY),T,'t')+`<path d="M ${L(NK)},80 Q 100,88 ${R(NK)},80" stroke="${shade(tc,-.18)}" stroke-width="2" fill="none"/>`+(T.print?`<text x="100" y="128" text-anchor="middle" font-family="Georgia,serif" font-size="9" font-weight="700" fill="${T.c2||'#333'}">${T.print}</text>`:'')}
  else if(tk==='polo'){topSVG=garment(torso(hemY,'v'),T,'t')+`<path d="M ${L(NK+1)},79 L 99,88 L ${L(NK+8)},90 L ${L(NK+3)},77Z M ${R(NK+1)},79 L 101,88 L ${R(NK+8)},90 L ${R(NK+3)},77Z" fill="${shade(tc,.05)}" stroke="${shade(tc,-.25)}" stroke-width=".6"/><rect x="98" y="88" width="4" height="16" fill="${shade(tc,-.05)}"/>`+buttons(92,102,2,shade(tc,-.4))}
  else if(tk==='henley'){topSVG=garment(torso(hemY),T,'t')+`<rect x="98" y="84" width="4" height="22" fill="${shade(tc,-.06)}"/>`+buttons(90,103,3,shade(tc,-.4))}
  else if(tk==='sweater'){topSVG=garment(torso(hemY,T.neck==='v'?'v':'round'),T,'t')+`<rect x="${L(hw(hemY))}" y="${hemY-7}" width="${2*hw(hemY)}" height="7" fill="${shade(tc,-.1)}"/>`+(T.neck==='turtle'?`<path d="M ${L(NK+1)},70 L ${R(NK+1)},70 L ${R(NK+2)},86 Q 100,90 ${L(NK+2)},86Z" fill="${shade(tc,-.06)}"/><path d="M ${L(NK)},76 L ${R(NK)},76 M ${L(NK)},81 L ${R(NK)},81" ${FOLD}/>`:'')}
  else if(tk==='hoodie'){topSVG=`<path d="M ${L(NK+10)},86 C ${L(NK+12)},70 ${R(NK+12)},70 ${R(NK+10)},86Z" fill="${shade(tc,-.15)}"/>`+garment(torso(hemY,'v'),T,'t')+`<rect x="${L(hw(hemY))}" y="${hemY-7}" width="${2*hw(hemY)}" height="7" fill="${shade(tc,-.1)}"/><path d="M ${L(18)},150 L ${R(18)},150 L ${R(22)},180 L ${L(22)},180Z" fill="${shade(tc,-.07)}" stroke="${shade(tc,-.2)}" stroke-width=".6"/><path d="M 96,94 L 95,118 M 104,94 L 105,118" stroke="${T.c2||'#eee'}" stroke-width="1.3"/>`}
  else if(tk==='kurta'||tk==='pathani'){topSVG=garment(torso(hemY,'high'),T,'t')+mandarin(tc)+`<path d="M 100,84 L 100,${tk==='pathani'?132:124}" stroke="${shade(tc,-.22)}" stroke-width=".9"/>`+buttons(90,tk==='pathani'?128:120,tk==='pathani'?4:3,T.c3||shade(tc,-.38))+`<path d="M ${L(hw(hemY))+1},${hemY} L ${L(hw(hemY-34))},${hemY-34} M ${R(hw(hemY))-1},${hemY} L ${R(hw(hemY-34))},${hemY-34}" stroke="${shade(tc,-.22)}" stroke-width=".9"/>`+(T.emb?`<path d="M 92,86 L 92,126 L 108,126 L 108,86" stroke="${T.c2||'#D4A93C'}" stroke-width="1.6" fill="none"/>`:'')+(tk==='pathani'?`<path d="M ${L(CH-8)},112 L ${L(CH-20)},112 L ${L(CH-20)},124 L ${L(CH-8)},124Z" fill="none" stroke="${shade(tc,-.22)}" stroke-width=".8"/>`:'')}
  else if(tk==='angrakha'){topSVG=garment(torso(hemY,'high'),T,'t')+mandarin(tc)+`<path d="M ${L(NK)},84 C ${R(4)},110 ${R(16)},140 ${R(CH-4)},150" stroke="${T.c2||shade(tc,-.3)}" stroke-width="2" fill="none"/><path d="M ${R(CH-4)},150 l4,6 M ${R(CH-8)},146 l4,6" stroke="${T.c2||shade(tc,-.3)}" stroke-width="1.2"/>`}
  else if(tk==='sherwani'||tk==='bandhgala'){topSVG=garment(torso(hemY,'high'),T,'t')+mandarin(tc)+`<path d="M 100,84 L 100,${hemY}" stroke="${shade(tc,-.25)}" stroke-width="1"/>`+buttons(90,tk==='sherwani'?200:206,tk==='sherwani'?8:6,T.c3||'#D9B45A')+(T.c2?`<path d="M ${L(NK+1)},84 L ${L(NK+1)},${hemY} M ${L(hw(hemY))},${hemY-3} L ${R(hw(hemY))},${hemY-3}" stroke="${T.c2}" stroke-width="3" opacity=".9"/>`:'')+(tk==='bandhgala'?`<path d="M ${L(CH-6)},116 L ${L(CH-18)},116 M ${L(CH-4)},176 L ${L(CH-18)},176 M ${R(CH-4)},176 L ${R(CH-18)},176" stroke="${shade(tc,-.3)}" stroke-width="1"/>`:'')}
  else if(tk==='shacket'){topSVG=garment(torso(hemY,'open'),T,'t')+collarShirt(tc)+`<path d="M ${L(CH-6)},106 L ${L(CH-18)},106 L ${L(CH-18)},120 L ${L(CH-6)},120Z M ${R(CH-6)},106 L ${R(CH-18)},106 L ${R(CH-18)},120 L ${R(CH-6)},120Z" fill="${shade(tc,-.06)}" stroke="${shade(tc,-.25)}" stroke-width=".7"/>`+buttons(100,hemY-8,5,shade(tc,-.4))}
  s+=both(sleeve(slv,T,'t'))+topSVG;
  if(T.tuck&&has('belt'))s+=`<rect x="${L(WA)}" y="164" width="${2*WA}" height="6" fill="${accC('belt','#3A2416')}"/><rect x="96" y="163.5" width="8" height="7" rx="1" fill="none" stroke="#C9A24A" stroke-width="1.4"/>`;

  /* ----- tie / bow tie ----- */
  if(has('tie'))s+=`<path d="M 97.5,90 L 102.5,90 L 101.6,95 L 104.5,140 L 100,147 L 95.5,140 L 98.4,95Z" fill="${accC('tie','#7A1F2B')}"/><path d="M 97.5,90 L 102.5,90 L 101.6,95 L 98.4,95Z" fill="${shade(accC('tie','#7A1F2B'),-.2)}"/>`;
  if(has('bowtie'))s+=`<path d="M 100,91 L 92,87 L 92,96 Z M 100,91 L 108,87 L 108,96Z" fill="${accC('bowtie','#111')}"/><rect x="98" y="89" width="4" height="4" rx="1" fill="${shade(accC('bowtie','#111'),.15)}"/>`;
  if(has('mala'))s+=`<path d="M ${L(NK+2)},82 Q 100,140 ${R(NK+2)},82" stroke="${accC('mala','#E6C35C')}" stroke-width="2.4" fill="none" stroke-dasharray="1 2.2" stroke-linecap="round"/>`;

  /* ----- layer ----- */
  if(Ly){const lk=Ly.k, lc2=Ly.c;
    const len={blazer:212,suit:212,tux:212,nehru:206,waistcoat:186,denim:192,leather:190,bomber:188,overcoat:292,trench:292,cardigan:206,longjacket:262,safari:206}[lk]||210;
    const open={blazer:1,suit:1,tux:1,overcoat:1,trench:1,cardigan:1,longjacket:1}[lk];
    const sleeveless={nehru:1,waistcoat:1}[lk];
    const lhw=y=>hw(y)+1.8+(len>230&&y>168?(y-168)*.06:0);
    const panel=(side)=>{const sg=side<0?L:R;const inX=open?(lk==='cardigan'?6:9):0;
      return `M ${sg(NK+1)},79 L ${sg(SW-2.5)},87 C ${sg(SW+1)},92 ${sg(CH+2.5)},104 ${sg(CH+1.5)},116 L ${sg(lhw(168))},168 L ${sg(lhw(len))},${len} L ${sg(inX)},${len} L ${sg(inX)},${open?150:96} ${open?`L ${sg(NK-1)},86`:`L ${sg(0)},86`} Z`};
    if(!sleeveless)s+=both(sleeve(Ly.sl||'long',Ly,'l'));
    s+=garment(panel(-1),Ly,'l')+garment(panel(1),Ly,'l');
    const dk=shade(lc2,-.3);
    if(lk==='blazer'||lk==='suit'||lk==='tux'||lk==='overcoat'||lk==='trench'){
      const lap=lk==='tux'?(Ly.c2||shade(lc2,-.15)):shade(lc2,-.08);
      s+=both(`<path d="M ${L(NK+1)},79 L ${L(NK+5)},96 L ${L(14)},104 L ${L(9)},150 L ${L(NK-1)},86Z" fill="${lap}" stroke="${dk}" stroke-width=".7"/>`);
      s+=`<circle cx="${R(9)}" cy="158" r="1.4" fill="${dk}"/>`+(lk!=='tux'?`<circle cx="${R(9)}" cy="176" r="1.4" fill="${dk}"/>`:'');
      s+=both(`<path d="M ${L(CH-2)},182 L ${L(CH-16)},182" stroke="${dk}" stroke-width="1.2"/>`);
      if(lk==='trench')s+=`<rect x="${L(lhw(170))}" y="166" width="${2*lhw(170)}" height="7" fill="${shade(lc2,-.12)}"/><rect x="96" y="165.5" width="8" height="8" fill="none" stroke="${dk}" stroke-width="1.2"/>`;
      if(has('pocket'))s+=`<path d="M ${R(CH-16)},120 L ${R(CH-6)},120 L ${R(CH-8)},113 L ${R(CH-12)},116 L ${R(CH-14)},112Z" fill="${accC('pocket','#F4F1EA')}"/>`;
      s+=`<path d="M ${R(CH-17)},121 L ${R(CH-5)},121" stroke="${dk}" stroke-width="1"/>`;
    }
    if(lk==='nehru'||lk==='waistcoat'){s+=lk==='nehru'?mandarin(lc2)+buttons(90,len-8,6,Ly.c3||shade(lc2,-.4)):`<path d="M ${L(NK+1)},79 L 100,${126} L ${R(NK+1)},79" fill="none" stroke="${dk}" stroke-width="1"/>`+buttons(130,len-8,4,shade(lc2,-.4));
      s+=`<path d="M ${L(CH-6)},120 L ${L(CH-18)},120" stroke="${dk}" stroke-width="1.2"/>`;if(has('pocket'))s+=`<path d="M ${L(CH-17)},119 L ${L(CH-7)},119 L ${L(CH-9)},113 L ${L(CH-13)},115Z" fill="${accC('pocket','#F4F1EA')}"/>`;
      if(lk==='waistcoat')s+=`<path d="M ${L(NK+1)},79 L 100,126 L ${R(NK+1)},79 L ${R(NK)},80 L 100,124 L ${L(NK)},80Z" fill="${tf}"/>`;}
    if(lk==='denim'||lk==='safari'){s+=collarShirt(lc2)+`<path d="M 100,86 L 100,${len}" stroke="${dk}" stroke-width="1"/>`+both(`<path d="M ${L(CH-5)},108 L ${L(CH-18)},108 L ${L(CH-18)},124 L ${L(CH-5)},124Z" fill="none" stroke="${shade(lc2,.3)}" stroke-width=".9" stroke-dasharray="2 1.4"/>`)+buttons(96,len-10,5,'#B98C3C')+`<rect x="${L(lhw(len))}" y="${len-8}" width="${2*lhw(len)}" height="8" fill="${shade(lc2,-.06)}"/>`;}
    if(lk==='leather'){s+=`<path d="M ${L(NK+1)},79 L ${L(NK+10)},100 L ${L(4)},118 M ${R(NK+1)},79 L ${R(NK+12)},98 L ${R(2)},104" stroke="${dk}" stroke-width="1.2" fill="none"/><path d="M ${R(4)},96 L ${L(6)},${len}" stroke="#C8C8C8" stroke-width="1.4"/>`;}
    if(lk==='bomber'){s+=`<path d="M ${L(NK+2)},78 Q 100,86 ${R(NK+2)},78 L ${R(NK+2)},84 Q 100,92 ${L(NK+2)},84Z" fill="${shade(lc2,-.25)}"/><path d="M 100,86 L 100,${len}" stroke="#BEBEBE" stroke-width="1.2"/><rect x="${L(lhw(len))}" y="${len-8}" width="${2*lhw(len)}" height="8" fill="${shade(lc2,-.25)}"/>`;}
    if(lk==='cardigan')s+=buttons(150,len-10,3,shade(lc2,-.4))+`<rect x="${L(lhw(len))}" y="${len-6}" width="${2*lhw(len)}" height="6" fill="${shade(lc2,-.1)}"/>`;
    if(lk==='longjacket'){s+=mandarin(lc2)+(Ly.c2?both(`<path d="M ${L(9)},96 L ${L(9)},${len} M ${L(lhw(len))},${len-3} L ${L(9)},${len-3}" stroke="${Ly.c2}" stroke-width="2.6"/>`):'');}
  }

  /* ----- stole / dupatta over the shoulder ----- */
  if(has('stole')){const c=accC('stole','#C9A24A');s+=`<path d="M ${L(SW-6)},86 C ${L(SW-10)},120 ${L(SW-12)},170 ${L(SW-14)},250 L ${L(SW-26)},250 C ${L(SW-22)},180 ${L(SW-20)},120 ${L(NK+2)},82Z" fill="${c}"/><path d="M ${L(SW-6)},86 L ${R(SW-10)},140" stroke="${c}" stroke-width="7" opacity=".9"/><path d="M ${L(SW-26)},246 L ${L(SW-14)},246" stroke="${shade(c,-.25)}" stroke-width="3"/>`}
  if(has('watch'))s+=`<rect x="${L(SW+5.5)-5}" y="196" width="10" height="5" rx="1.5" fill="${accC('watch','#3A3A3A')}"/>`;

  /* ----- head ----- */
  const hs=.39, hy=53;
  const H=o.hc||HAIRCOLS[0][0];
  s+=`<g transform="translate(${100-100*hs},${hy-100*hs}) scale(${hs})">${head({face:o.face||'oval',hair:o.hair||'crew',hc:H,beard:o.beard,skin:S})}</g>`;
  if(has('sunglasses'))s+=`<g transform="translate(${100-100*hs},${hy-100*hs}) scale(${hs})"><path d="M 72,100 L 128,100 L 127,104 C 126,114 112,116 108,108 L 104,102 L 96,102 L 92,108 C 88,116 74,114 73,104Z" fill="${accC('sunglasses','#1B1B1B')}"/></g>`;
  if(has('safa')){const c=accC('safa','#C2185B');s+=`<g transform="translate(${100-100*hs},${hy-100*hs}) scale(${hs})"><path d="M 52,86 C 46,46 70,18 100,16 C 132,18 156,46 148,86 C 130,74 70,74 52,86Z" fill="${c}"/><path d="M 56,78 C 80,58 120,52 146,70 M 58,64 C 84,44 120,40 142,54 M 66,48 C 88,32 116,30 134,40" stroke="${shade(c,-.3)}" stroke-width="3" fill="none"/><path d="M 120,30 C 128,10 136,4 140,-8" stroke="${shade(c,.4)}" stroke-width="5" fill="none"/><circle cx="118" cy="36" r="6" fill="#E6C35C"/><path d="M 146,74 C 160,110 166,150 160,200" stroke="${c}" stroke-width="14" fill="none"/></g>`}
  const vbH=400;
  const scaleY=bt.h||1;
  return `<svg viewBox="0 0 200 ${vbH}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${o.label||'Outfit illustration'}" ${opt.size?`width="${opt.size}"`:''}><defs>${defs}</defs>${opt.bg?`<rect width="200" height="${vbH}" fill="${opt.bg}"/>`:''}<g transform="translate(0 ${vbH*(1-scaleY)}) scale(1 ${scaleY})">${s}</g></svg>`;
}
