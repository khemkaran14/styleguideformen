/* ---------- UI: lookbook, occasions, hair, quiz, colours, Dressing Room ---------- */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const PH=typeof PHOTOS!=='undefined'?PHOTOS:{looks:{},hair:{},beards:{},real:[]};
const photos=PH.looks||{};                     // look id -> image (photo or rendered illustration)
const isReal=(kind,id)=>(PH.real||[]).includes(kind+'/'+id);
const HAS=o=>true;
const CATN={ethnic:'Ethnic',fusion:'Fusion',western:'Western'};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let saved=new Set();try{saved=new Set(JSON.parse(localStorage.getItem('usg-men-saved')||'[]'))}catch(e){}
let myLooks=[];try{myLooks=JSON.parse(localStorage.getItem('usg-men-looks')||'[]')}catch(e){}
let SITE={hidden:[],featured:[],announce:'',announceOn:false};
let BT='regular';
const persist=()=>{try{localStorage.setItem('usg-men-saved',JSON.stringify([...saved]))}catch(e){}$('#savedCount').textContent=[...saved].filter(x=>!x.startsWith('h-')).length};
const PL=()=>L.filter(o=>!SITE.hidden.includes(o.id));
const MODEL={skin:SKINS[2],hc:'#1A1210',face:'oval'};
const heartSVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.5 0 5.7 3.5 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>';
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)}
function copyText(txt,el){(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast('Copied')).catch(()=>{if(el){el.select();document.execCommand('copy');toast('Copied')}})}
const lookFig=o=>Object.assign({label:o.n,bt:BT},o.fig);
const pimg=o=>photos[o.id]?`<img src="${photos[o.id]}" alt="${esc(o.n)}" loading="lazy">`:figure(lookFig(o));
const artCls=o=>isReal('looks',o.id)?'':' ill';
const hairImg=(h,beardId='short')=>PH.hair&&PH.hair[h.id]?`<img src="${PH.hair[h.id]}" alt="${esc(h.n)} hairstyle" loading="lazy">`:headSVG({hair:h.id,bust:true,beard:beardId,skin:MODEL.skin,hc:MODEL.hc,shirt:'#2E3440',label:h.n+' hairstyle'});
const beardImg=b=>PH.beards&&PH.beards[b.id]?`<img src="${PH.beards[b.id]}" alt="${esc(b.n)}" loading="lazy">`:headSVG({hair:'crew',bust:true,beard:b.id,skin:MODEL.skin,hc:MODEL.hc,shirt:'#2E3440',label:b.n});

/* ---------- hero ---------- */
function renderHero(){
  $('#stats').innerHTML=[[PL().length,'looks'],[HAIR.length,'hairstyles'],[BEARDS.length,'beard styles'],[Object.keys(OCC).length,'occasions']].map(([n,l])=>`<span class="stat"><b>${n}</b>${l}</span>`).join('');
  const ids=(SITE.featured&&SITE.featured.length?SITE.featured:['groomsherwani','navysuit','kurtajeans','leatherjacket','nehrubrocade','linenshorts','navybandhgala']).filter(id=>PL().some(o=>o.id===id));
  $('#lineup').innerHTML=ids.map(id=>{const o=L.find(l=>l.id===id);return `<button class="m" data-open="${id}" aria-label="Open ${esc(o.n)}" tabindex="-1">${pimg(o)}</button>`}).join('');
  $('#hairCountNote').textContent=HAIR.length;
}

/* ---------- lookbook ---------- */
const F={cat:'all',reg:'all',occ:'all',saved:false,q:''};
$('#occSel').innerHTML+=Object.entries(OCC).map(([k,v])=>`<option value="${k}">${v.n}</option>`).join('');
function match(o){
  if(F.cat!=='all'&&o.c!==F.cat)return false;
  if(F.reg!=='all'&&o.r!==F.reg)return false;
  if(F.occ!=='all'&&!o.occ.includes(F.occ))return false;
  if(F.saved&&!saved.has(o.id))return false;
  if(F.q){const hay=[o.n,o.c,o.r,o.cn,o.d,o.pc.join(' '),o.ft,o.occ.map(k=>OCC[k].n).join(' ')].join(' ').toLowerCase();if(!F.q.split(/\s+/).every(w=>hay.includes(w)))return false}
  return true;
}
function card(o){
  return `<article class="card">
   <button class="art${artCls(o)}" data-open="${o.id}" aria-label="Open ${esc(o.n)}">${pimg(o)}</button>
   <button class="heart" data-heart="${o.id}" aria-pressed="${saved.has(o.id)}" aria-label="Save ${esc(o.n)}">${heartSVG}</button>
   <button class="tryon" data-try="${o.id}">Customise</button>
   <div class="info">
     <div class="tags"><span class="tag ${o.c}">${CATN[o.c]}</span><span class="tag">${o.r}</span><span class="tag">${o.m}</span></div>
     <h3><a href="/looks/${o.id}" class="tlink">${esc(o.n)}</a></h3>
     <div class="occ">${o.occ.map(k=>OCC[k].n).join(' · ')}</div>
     <p class="colourline">${esc(o.cn)}</p>
   </div></article>`;
}
function renderGrid(){
  const list=PL().filter(match);
  $('#grid').innerHTML=list.length?list.map(card).join(''):`<div class="empty">No looks match. ${F.saved?'Tap ♥ on a look to save it.':'Try fewer filters.'}</div>`;
  $('#count').textContent=`${list.length} of ${PL().length}`;
  persist();
}
$('.filters').addEventListener('click',e=>{
  const b=e.target.closest('.chip');if(!b)return;
  if(b.dataset.f==='saved'){F.saved=!F.saved;b.setAttribute('aria-pressed',F.saved)}
  else{F[b.dataset.f]=b.dataset.v;b.parentElement.querySelectorAll(`[data-f="${b.dataset.f}"]`).forEach(x=>x.setAttribute('aria-pressed',x===b))}
  renderGrid();
});
$('#occSel').onchange=e=>{F.occ=e.target.value;renderGrid()};
$('#q').oninput=e=>{F.q=e.target.value.trim().toLowerCase();renderGrid()};
$('#savedLink').onclick=()=>{F.saved=true;$('#savedOnly').setAttribute('aria-pressed','true');renderGrid()};

function toggleHeart(id){if(saved.has(id))saved.delete(id);else{saved.add(id);toast('Saved')}persist();$$(`[data-heart="${id}"]`).forEach(b=>b.setAttribute('aria-pressed',saved.has(id)));if(typeof ACCT!=='undefined')ACCT.onSaved()}
document.addEventListener('click',e=>{
  const h=e.target.closest('[data-heart]');if(h){toggleHeart(h.dataset.heart);if(F.saved)renderGrid();return}
  const tr=e.target.closest('[data-try]');if(tr){if(dlg.open)dlg.close();pickLook(tr.dataset.try);$('#studio').scrollIntoView({behavior:'smooth'});return}
  const th=e.target.closest('[data-tryhair]');if(th){if(dlg.open)dlg.close();tryHair(th.dataset.tryhair);return}
  const tb=e.target.closest('[data-trybeard]');if(tb){if(dlg.open)dlg.close();tryBeard(tb.dataset.trybeard);return}
  const op=e.target.closest('[data-open]');if(op){openLook(op.dataset.open);return}
  const oh=e.target.closest('[data-hair]');if(oh){openHair(oh.dataset.hair);return}
});

/* ---------- look modal ---------- */
const dlg=$('#dlg');
function openLook(id){
  const o=L.find(l=>l.id===id);if(!o)return;
  dlg.innerHTML=`<button class="close" id="dlgClose" aria-label="Close">×</button>
  <div class="dlg"><div class="pic${artCls(o)}">${pimg(o)}</div>
  <div class="body">
    <div class="tags"><span class="tag ${o.c}">${CATN[o.c]}</span><span class="tag">${o.r}</span><span class="tag">${o.m}</span></div>
    <h3 id="dlgTitle">${esc(o.n)}</h3>
    <p style="margin:0">${esc(o.d)}</p>
    <dl>
      <dt>Pieces</dt><dd><ul>${o.pc.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></dd>
      <dt>Footwear</dt><dd>${esc(o.ft)}</dd>
      <dt>Accessories</dt><dd>${esc(o.ac)}</dd>
      <dt>Colours</dt><dd>${esc(o.cn)}</dd>
      <dt>Wear to</dt><dd>${o.occ.map(k=>OCC[k].n).join(', ')}</dd>
      <dt>Hair</dt><dd><button class="linkbtn" data-hair="${o.fig.hair}">${esc((HAIR.find(h=>h.id===o.fig.hair)||{n:''}).n)}</button>${o.fig.beard&&o.fig.beard!=='clean'?` with ${esc((BEARDS.find(b=>b.id===o.fig.beard)||{n:''}).n.toLowerCase())}`:''}</dd>
    </dl>
    <div class="tipbox"><b>Stylist tip:</b> ${esc(o.tip)}</div>
    <div class="row"><button class="btn alt" data-try="${o.id}">Customise in the Dressing Room</button>
      <button class="heart" style="position:static" data-heart="${o.id}" aria-pressed="${saved.has(o.id)}" aria-label="Save ${esc(o.n)}">${heartSVG}</button></div>
    <a class="small" href="/looks/${o.id}" style="color:var(--acc);font-weight:700">Open this look’s page to share it →</a>
  </div></div>`;
  if(!dlg.open)dlg.showModal();
  $('#dlgClose').onclick=()=>dlg.close();
}
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});

/* ---------- occasions ---------- */
let curOcc='wedding';
const mini=o=>`<button class="mini" data-open="${o.id}">${pimg(o)}<span>${esc(o.n)}</span></button>`;
function renderOcc(){
  $('#occGrid').innerHTML=Object.entries(OCC).map(([k,v])=>`<button class="occ-tile" data-occ="${k}" style="background:${v.c}" aria-pressed="${k===curOcc}"><b>${v.n}</b><small>${v.s}</small></button>`).join('');
  const v=OCC[curOcc],looks=PL().filter(o=>o.occ.includes(curOcc));
  $('#occPanel').innerHTML=`<div><span class="eyebrow">${esc(v.s)}</span><h3>${esc(v.n)}</h3><p class="lede" style="margin-top:.4rem">${esc(v.d)}</p></div>
  <div class="rules3"><div><h4>Wear</h4><p>${esc(v.w)}</p></div><div><h4>Avoid</h4><p>${esc(v.a)}</p></div><div><h4>Colours</h4><p>${esc(v.t)}</p></div></div>
  ${looks.length?`<div><h4 class="eyebrow" style="margin:0 0 8px">${looks.length} looks for ${esc(v.n.toLowerCase())}</h4><div class="rail">${looks.map(mini).join('')}</div></div>`:''}
  <a href="/occasions/${curOcc}" class="small" style="color:var(--acc);font-weight:700">Full ${esc(v.n.toLowerCase())} guide →</a>`;
}
$('#occGrid').addEventListener('click',e=>{const b=e.target.closest('[data-occ]');if(!b)return;curOcc=b.dataset.occ;renderOcc()});

/* ---------- hairstyles ---------- */
const HF={face:'all',type:'all',len:'all',maint:'all'};
const chipRow=(key,opts)=>[['all','Any'],...opts].map(([k,n])=>`<button class="chip" data-hf="${key}" data-v="${k}" aria-pressed="${HF[key]===k}">${n}</button>`).join('');
function renderHairFilters(){
  $('#hfFace').innerHTML=chipRow('face',Object.entries(FACES).map(([k,v])=>[k,v.n]));
  $('#hfType').innerHTML=chipRow('type',Object.entries(HTYPES));
  $('#hfLen').innerHTML=chipRow('len',[['short','Short'],['medium','Medium'],['long','Long']]);
  $('#hfMaint').innerHTML=chipRow('maint',[['low','Low'],['medium','Medium'],['high','High']]);
}
const hmatch=h=>(HF.face==='all'||h.faces.includes(HF.face))&&(HF.type==='all'||h.types.includes(HF.type))&&(HF.len==='all'||h.len===HF.len)&&(HF.maint==='all'||h.maint===HF.maint);
const MAINT={low:'Low effort',medium:'Some styling',high:'Daily styling'};
function hcard(h){const hid='h-'+h.id;return `<article class="hcard"><button class="art" data-hair="${h.id}" aria-label="Open ${esc(h.n)}">${hairImg(h)}</button>
  <button class="heart" data-heart="${hid}" aria-pressed="${saved.has(hid)}" aria-label="Save ${esc(h.n)}">${heartSVG}</button>
  <div class="info"><h3><a class="tlink" href="/hairstyles/${h.id}">${esc(h.n)}</a></h3><div class="meta">${h.len[0].toUpperCase()+h.len.slice(1)} · ${MAINT[h.maint]} · cut every ${h.cut} wk</div></div></article>`}
function renderHair(){
  const list=HAIR.filter(hmatch);
  $('#hairGrid').innerHTML=list.length?list.map(hcard).join(''):'<div class="empty">No hairstyles match. Try fewer filters.</div>';
  $('#hCount').textContent=`${list.length} of ${HAIR.length}`;
  $$('[data-hf]').forEach(b=>b.setAttribute('aria-pressed',HF[b.dataset.hf]===b.dataset.v));
}
$('#hair').addEventListener('click',e=>{const b=e.target.closest('[data-hf]');if(b){HF[b.dataset.hf]=b.dataset.v;renderHair();return}
  const f=e.target.closest('[data-face]');if(f){HF.face=f.dataset.face;renderHair();$('#hairGrid').scrollIntoView({behavior:'smooth',block:'start'})}});
function openHair(id){
  const h=HAIR.find(x=>x.id===id);if(!h)return;const hid='h-'+h.id;
  dlg.innerHTML=`<button class="close" id="dlgClose" aria-label="Close">×</button>
  <div class="dlg"><div class="pic">${hairImg(h)}</div>
  <div class="body">
    <div class="tags"><span class="tag">${h.len}</span><span class="tag">${MAINT[h.maint]}</span><span class="tag">cut every ${h.cut} weeks</span></div>
    <h3 id="dlgTitle">${esc(h.n)}</h3>
    <p style="margin:0">${esc(h.d)}</p>
    <dl>
      <dt>Face shapes</dt><dd>${h.faces.map(f=>FACES[f].n).join(', ')}</dd>
      <dt>Hair types</dt><dd>${h.types.map(t=>HTYPES[t]).join(', ')}</dd>
      <dt>Good for</dt><dd>${h.occ.map(k=>OCC[k]?OCC[k].n:k).join(', ')}</dd>
      <dt>Products</dt><dd>${esc(h.prod)}</dd>
    </dl>
    <div class="tipbox"><b>Tell your barber:</b> “${esc(h.ask)}”</div>
    <div><b>How to style it:</b> ${esc(h.style)}</div>
    <div class="row"><button class="btn alt" data-tryhair="${h.id}">Try it in the Dressing Room</button>
      <button class="btn ghost" id="dlgCopyAsk">Copy barber notes</button>
      <button class="heart" style="position:static" data-heart="${hid}" aria-pressed="${saved.has(hid)}" aria-label="Save ${esc(h.n)}">${heartSVG}</button></div>
    <a class="small" href="/hairstyles/${h.id}" style="color:var(--acc);font-weight:700">Open this hairstyle’s page to share it →</a>
  </div></div>`;
  if(!dlg.open)dlg.showModal();
  $('#dlgClose').onclick=()=>dlg.close();
  $('#dlgCopyAsk').onclick=()=>copyText(`${h.n}: ${h.ask}`);
}
function renderBeards(){
  $('#beardGrid').innerHTML=BEARDS.map(b=>`<div class="beard"><div class="bimg">${beardImg(b)}</div><div><b>${esc(b.n)}</b><p>${esc(b.d)}</p><p><i>${esc(b.upkeep)}</i></p><button class="linkbtn" data-trybeard="${b.id}" style="font-size:.8rem">Try it on</button></div></div>`).join('');
  $('#faceGuide').innerHTML=Object.entries(FACES).map(([k,f])=>`<button class="face" data-face="${k}" aria-label="Show hairstyles for a ${f.n.toLowerCase()} face">${headSVG({hair:'buzz',face:k,skin:MODEL.skin,hc:MODEL.hc,beard:'clean'})}<b>${f.n}</b><span class="small" style="margin:0">${esc(FACEINFO[k].d)}</span><span class="small" style="margin:0"><b>Try:</b> ${esc(FACEINFO[k].best)}</span></button>`).join('');
}
/* face-shape finder */
const FQ=[
  ['Look straight into a mirror. Compared with its width, your face is…',[['same','About as long as it is wide'],['bit','A little longer than it is wide'],['much','Clearly longer than it is wide']]],
  ['Your jawline is…',[['soft','Soft and rounded'],['sharp','Strong and angular'],['point','Narrow, with a pointed chin']]],
  ['The widest part of your face is…',[['fore','Forehead'],['cheek','Cheekbones'],['jaw','Jaw'],['even','All about the same']]]
];
let fa=[];
function faceResult(){const [len,jaw,wide]=fa;
  if(len==='same')return jaw==='sharp'?'square':'round';
  if(len==='much')return 'oblong';
  if(wide==='fore'||(jaw==='point'&&wide!=='cheek'))return 'heart';
  if(wide==='cheek')return jaw==='point'?'diamond':'oval';
  if(wide==='jaw'||jaw==='sharp')return 'square';
  return 'oval';
}
function renderFaceFinder(){
  const box=$('#faceFinder');
  if(fa.length<FQ.length){const [q,opts]=FQ[fa.length];
    box.innerHTML=`<span class="eyebrow" style="color:rgba(255,255,255,.8)">Face-shape finder · ${fa.length+1} of ${FQ.length}</span><h3>What’s your face shape?</h3><div class="progress">${FQ.map((_,i)=>`<span class="${i<fa.length?'on':''}"></span>`).join('')}</div><div class="q">${q}</div><div class="qopts">${opts.map(([k,n])=>`<button class="qopt" data-fa="${k}">${n}</button>`).join('')}</div>${fa.length?'<button class="qback" data-faback>Back</button>':''}`;
  }else{const f=faceResult(),info=FACEINFO[f],picks=HAIR.filter(h=>h.faces.includes(f)).slice(0,6);
    box.innerHTML=`<span class="eyebrow" style="color:rgba(255,255,255,.8)">Your result</span><h3>You have a ${FACES[f].n.toLowerCase()} face</h3><p style="margin:0">${esc(info.d)}</p><p style="margin:0"><b>Best:</b> ${esc(info.best)}<br><b>Avoid:</b> ${esc(info.avoid)}<br><b>Beard:</b> ${esc(info.beard)}</p>
    <div class="qresult">${picks.map(h=>`<button class="mini" data-hair="${h.id}">${hairImg(h)}<span>${esc(h.n)}</span></button>`).join('')}</div>
    <div class="row"><button class="btn" data-faceall="${f}" style="background:#fff;color:#17202A">Show all ${HAIR.filter(h=>h.faces.includes(f)).length} styles for my face</button><button class="qback" data-farestart>Start again</button></div>`;
    if(typeof ACCT!=='undefined')ACCT.onFace&&ACCT.onFace(f);
  }
}
$('#faceFinder').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.fa){fa.push(b.dataset.fa);renderFaceFinder()}
  else if('faback' in b.dataset){fa.pop();renderFaceFinder()}
  else if('farestart' in b.dataset){fa=[];renderFaceFinder()}
  else if(b.dataset.faceall){HF.face=b.dataset.faceall;renderHair();$('#hairGrid').scrollIntoView({behavior:'smooth',block:'start'})}});

/* ---------- style quiz ---------- */
const QZ=[
  ['What are you dressing for?',[['wedding','A wedding or festival'],['office','Work or an interview'],['date','A date or night out'],['brunch','Weekend & travel']]],
  ['Which style feels most like you?',[['ethnic','Traditional Indian'],['western','Modern western'],['fusion','A bit of both']]],
  ['Pick a mood',[['classic','Classic & polished'],['easy','Easy & relaxed'],['bold','Bold & statement'],['smart','Smart & modern']]],
  ['Colours you reach for',[['neutral','Navy, grey, black, white'],['earthy','Olive, beige, brown, rust'],['rich','Maroon, emerald, gold'],['light','Pastels & light tones']]]
];
const OCCGRP={wedding:['wedding','sangeet','festive','mehendi','haldi','pooja','cocktail'],office:['office','interview','formal'],date:['date','party','cocktail'],brunch:['brunch','travel','college','beach']};
const COLGRP={neutral:/navy|grey|gray|black|white|charcoal/i,earthy:/olive|beige|brown|rust|khaki|sand|stone|camel|tan/i,rich:/maroon|emerald|gold|wine|burgundy|velvet|teal/i,light:/pastel|mint|pink|rose|sky|light|ivory|cream|linen/i};
let qa=[];
function renderQuiz(){
  const box=$('#quizBox');
  if(qa.length<QZ.length){const [q,opts]=QZ[qa.length];
    box.innerHTML=`<div><span class="eyebrow" style="color:rgba(255,255,255,.8)">Style quiz · ${qa.length+1} of ${QZ.length}</span><h2 style="color:#fff">Find your <em>look</em></h2></div><div class="progress">${QZ.map((_,i)=>`<span class="${i<qa.length?'on':''}"></span>`).join('')}</div><div class="q">${q}</div><div class="qopts">${opts.map(([k,n])=>`<button class="qopt" data-qa="${k}">${n}</button>`).join('')}</div>${qa.length?'<button class="qback" data-qback>Back</button>':''}`;
  }else{const [occ,cat,mood,col]=qa;
    const sc=o=>(o.occ.some(k=>OCCGRP[occ].includes(k))?4:0)+(o.c===cat?3:cat==='fusion'&&o.c!=='fusion'?1:0)+(o.m===mood?2:0)+(COLGRP[col].test(o.cn)?2:0);
    const top=PL().map(o=>[sc(o),o]).sort((a,b)=>b[0]-a[0]).slice(0,4).map(x=>x[1]);
    box.innerHTML=`<div><span class="eyebrow" style="color:rgba(255,255,255,.8)">Your picks</span><h2 style="color:#fff">Looks for <em>you</em></h2></div><div class="qresult">${top.map(mini).join('')}</div><div class="row"><button class="btn" data-qagain style="background:#fff;color:#17202A">Take it again</button><button class="qback" data-try="${top[0].id}">Restyle my top pick in the Dressing Room</button></div>`;
  }
}
$('#quizBox').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.qa){qa.push(b.dataset.qa);renderQuiz()}else if('qback' in b.dataset){qa.pop();renderQuiz()}else if('qagain' in b.dataset){qa=[];renderQuiz()}});

/* ---------- colours ---------- */
function renderCombos(){
  $('#combos').innerHTML=COMBOS.map(([a,b,n,u,id])=>{const o=L.find(l=>l.id===id);return `<div class="combo">${o?`<button class="cphoto" data-open="${o.id}" aria-label="Open ${esc(o.n)}">${pimg(o)}</button>`:'<div></div>'}<div class="t"><div class="pair"><span style="background:${a}"></span><span style="background:${b}"></span></div><b>${esc(n)}</b><small>${esc(u)}</small>${o?`<small>Seen in: ${esc(o.n)}</small>`:''}</div></div>`}).join('');
}

/* ---------- rules ---------- */
function renderRules(){$('#rulesGrid').innerHTML=RULES.map(([t,d],i)=>`<div class="rule"><div class="n">${['i','ii','iii','iv','v','vi','vii','viii'][i]}.</div><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}

/* ---------- Dressing Room ---------- */
const PAL=[['#FFFFFF','White'],['#F4EEE2','Ivory'],['#EDE6D6','Cream'],['#D9C8A6','Sand'],['#C8B28A','Beige'],['#B89A72','Camel'],['#8B5A2B','Tan'],['#5A3A26','Chocolate'],['#5B6B4A','Olive'],['#8FA58A','Sage'],['#A8D5BA','Mint'],['#2F7D4F','Green'],['#0F5A43','Emerald'],['#0F5C66','Teal'],['#9CC3E0','Sky blue'],['#AFC8E3','Light blue'],['#4A6E9A','Denim blue'],['#26324A','Navy'],['#1E2A47','Midnight'],['#41464F','Charcoal'],['#80858C','Grey'],['#1A1A1E','Black'],['#7A1F2B','Maroon'],['#9F1239','Burgundy'],['#B91C1C','Red'],['#A4532B','Rust'],['#C2410C','Terracotta'],['#E8B53B','Mustard'],['#D9A08B','Rose'],['#C2185B','Rani pink'],['#A78BCA','Lavender'],['#5B2A86','Purple'],['#C9A24A','Gold']];
const colourName=hex=>{if(!hex)return '';const h=hex.toLowerCase();let best=PAL[0],bd=1e9;const rgb=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));const a=rgb(h);for(const p of PAL){const b=rgb(p[0].toLowerCase());const d=(a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2;if(d<bd){bd=d;best=p}}return best[1].toLowerCase()};
const TOPS=[['shirt','Shirt',{k:'shirt'}],['tee','T-shirt',{k:'tee'}],['polo','Polo',{k:'polo'}],['henley','Henley',{k:'henley'}],['sweater','Sweater',{k:'sweater',neck:'round'}],['turtle','Turtleneck',{k:'sweater',neck:'turtle'}],['hoodie','Hoodie',{k:'hoodie'}],['kurtalong','Kurta (long)',{k:'kurta',len:'long'}],['kurtashort','Kurta (short)',{k:'kurta',len:'short'}],['pathani','Pathani',{k:'pathani'}],['angrakha','Angrakha',{k:'angrakha'}],['bandhgala','Bandhgala',{k:'bandhgala'}],['sherwani','Sherwani',{k:'sherwani'}]];
const BOTS=[['trousers','Trousers',{k:'trousers',fit:'straight'}],['slim','Slim trousers',{k:'trousers',fit:'slim'}],['wide','Wide trousers',{k:'trousers',fit:'wide'}],['jeans','Jeans',{k:'jeans',p:'denim'}],['joggers','Joggers',{k:'joggers'}],['shorts','Shorts',{k:'shorts'}],['churidar','Churidar',{k:'churidar'}],['pyjama','Pyjama',{k:'pyjama'}],['salwar','Salwar',{k:'salwar'}],['dhoti','Dhoti',{k:'dhoti'}],['mundu','Mundu',{k:'mundu'}]];
const LAYS=[['none','None'],['blazer','Blazer'],['suit','Suit jacket'],['tux','Tuxedo jacket'],['nehru','Nehru jacket'],['waistcoat','Waistcoat'],['longjacket','Long jacket'],['denim','Denim jacket'],['leather','Leather jacket'],['bomber','Bomber'],['safari','Overshirt'],['cardigan','Cardigan'],['overcoat','Overcoat'],['trench','Trench coat']];
const SHOES=[['oxford','Oxfords'],['loafer','Loafers'],['sneaker','Sneakers'],['boot','Boots'],['chelsea','Chelsea boots'],['mojari','Mojaris'],['kolhapuri','Kolhapuris'],['sandal','Sandals']];
const ACCS=[['tie','Tie','#7A1F2B'],['bowtie','Bow tie','#111111'],['pocket','Pocket square','#FFFFFF'],['belt','Belt (tucked shirts)','#3A2416'],['watch','Watch','#3A3A3A'],['stole','Stole / dupatta','#C9A24A'],['safa','Safa (turban)','#C2185B'],['mala','Mala','#E6C35C'],['sunglasses','Sunglasses','#1B1B1B']];
const PATS=[['','Plain'],['check','Check'],['gingham','Gingham'],['pinstripe','Pinstripe'],['stripe','Stripes'],['dots','Dots'],['floral','Floral'],['brocade','Brocade'],['chikan','Chikan'],['ikat','Ikat'],['block','Block print'],['tropical','Tropical'],['denim','Denim'],['tweed','Tweed']];
const DRT=[['top','Top'],['bottom','Bottom'],['layer','Jacket'],['shoe','Shoes'],['acc','Extras'],['hair','Hair'],['beard','Beard'],['body','Skin & body']];
let D={base:null,fig:null,tab:'top',hist:[]};
const clone=o=>JSON.parse(JSON.stringify(o));
function snap(){D.hist.push(JSON.stringify(D.fig));if(D.hist.length>50)D.hist.shift()}
function drawDR(){if(!D.fig)return;$('#stage').innerHTML=figure(Object.assign({},D.fig,{label:'Your outfit'}));$('#drPrompt').value=drPrompt()}
const syncDR=()=>renderPanel();
function pickLook(id){const o=L.find(l=>l.id===id)||L[0];D.base=o.id;D.fig=clone(o.fig);D.fig.bt=D.fig.bt||BT;D.hist=[];renderPick();renderPanel();drawDR()}
function tryHair(id){if(!D.fig)pickLook(L[0].id);snap();D.fig.hair=id;D.tab='hair';renderTabs();renderPanel();drawDR();$('#studio').scrollIntoView({behavior:'smooth'})}
function tryBeard(id){if(!D.fig)pickLook(L[0].id);snap();D.fig.beard=id;D.tab='beard';renderTabs();renderPanel();drawDR();$('#studio').scrollIntoView({behavior:'smooth'})}
function renderPick(){$('#drPick').innerHTML=PL().map(o=>`<button class="mini" data-pick="${o.id}" aria-pressed="${o.id===D.base}" title="${esc(o.n)}">${pimg(o)}</button>`).join('')}
function renderTabs(){$('#drTabs').innerHTML=DRT.map(([k,n])=>`<button role="tab" data-tab="${k}" aria-selected="${D.tab===k}">${n}</button>`).join('')}
const swatches=(part,cur,key='c')=>`<div class="sw">${PAL.map(([c,n])=>`<button data-col="${part}" data-key="${key}" data-c="${c}" style="background:${c}" aria-label="${n}" title="${n}" aria-pressed="${(cur||'').toLowerCase()===c.toLowerCase()}"></button>`).join('')}<input type="color" data-colin="${part}" data-key="${key}" value="${cur&&cur[0]==='#'&&cur.length===7?cur:'#888888'}" aria-label="Custom colour"></div>`;
const optBtns=(attr,list,curKey)=>`<div class="row">${list.map(([k,n])=>`<button class="chip" data-${attr}="${k}" aria-pressed="${curKey===k}">${n}</button>`).join('')}</div>`;
// real product photos (from the photo package) replace the text buttons where they exist
const PIECECAT={top:'tops',bottom:'bottoms',layer:'jackets',shoe:'shoes',acc:'acc'};
const pieceImg=(part,k)=>(PH.pieces||{})[PIECECAT[part]+'/'+k];
const pieceBtns=(attr,part,list,isOn)=>list.some(([k])=>pieceImg(part,k))?`<div class="optgrid">${list.map(([k,n])=>`<button class="opt" data-${attr}="${k}" aria-pressed="${isOn(k)}">${pieceImg(part,k)?`<img src="${pieceImg(part,k)}" alt="" loading="lazy">`:'<span class="noimg"></span>'}<span>${n}</span></button>`).join('')}</div>`:null;
function curKind(part){const g=D.fig[part];if(!g)return 'none';
  if(part==='top'){if(g.k==='kurta')return g.len==='short'?'kurtashort':'kurtalong';if(g.k==='sweater')return g.neck==='turtle'?'turtle':'sweater';return g.k}
  if(part==='bottom'){if(g.k==='trousers')return g.fit==='slim'?'slim':g.fit==='wide'?'wide':'trousers';return g.k}
  return g.k;}
function renderPanel(){
  if(!D.fig)return;const t=D.tab,f=D.fig;let h='';
  if(t==='top'||t==='bottom'||t==='layer'){
    const list=t==='top'?TOPS:t==='bottom'?BOTS:LAYS;const g=f[t];
    const lst=list.map(x=>[x[0],x[1]]);h+=`<div><h4>Style</h4>${pieceBtns('kind',t,lst,k=>curKind(t)===k)||optBtns('kind',lst,curKind(t))}</div>`;
    if(g){
      if(t==='top'&&g.k==='shirt')h+=`<div class="row"><button class="chip" data-toggle="tuck" aria-pressed="${!!g.tuck}">Tucked in</button><button class="chip" data-toggle="short" aria-pressed="${g.sl==='short'}">Short sleeves</button></div>`;
      h+=`<div><h4>Colour · ${colourName(g.c)}</h4>${swatches(t,g.c)}</div>`;
      h+=`<div><h4>Fabric &amp; print</h4>${optBtns('pat',PATS,g.p||'')}</div>`;
      if(g.p)h+=`<div><h4>Print colour</h4>${swatches(t,g.c2,'c2')}</div>`;
      if(t==='top'&&(g.k==='sherwani'||g.k==='bandhgala'||g.k==='angrakha')||t==='bottom'&&(g.k==='dhoti'||g.k==='mundu')||t==='layer'&&(g.k==='longjacket'||g.k==='tux'))h+=`<div><h4>Trim / border colour</h4>${swatches(t,g.c2,'c2')}</div>`;
    }
  }else if(t==='shoe'){h+=`<div><h4>Style</h4>${pieceBtns('kind','shoe',SHOES,k=>f.shoe.k===k)||optBtns('kind',SHOES,f.shoe.k)}</div><div><h4>Colour · ${colourName(f.shoe.c)}</h4>${swatches('shoe',f.shoe.c)}</div>`}
  else if(t==='acc'){const acc=f.acc||[];const on=k=>acc.find(a=>a.split(':')[0]===k);
    h+=`<div><h4>Add or remove</h4>${pieceBtns('acc','acc',ACCS.map(([k,n])=>[k,n]),k=>!!on(k))||`<div class="row">${ACCS.map(([k,n])=>`<button class="chip" data-acc="${k}" aria-pressed="${!!on(k)}">${n}</button>`).join('')}</div>`}</div>`;
    ACCS.filter(([k])=>on(k)&&k!=='sunglasses').forEach(([k,n,d])=>{const c=(on(k).split(':')[1])||d;h+=`<div><h4>${n} colour</h4>${swatches('acc:'+k,c)}</div>`});}
  else if(t==='hair'){h+=`<div><h4>Hairstyle · ${esc((HAIR.find(x=>x.id===f.hair)||{n:''}).n)}</h4><div class="optgrid">${HAIR.map(x=>`<button class="opt" data-hairpick="${x.id}" aria-pressed="${f.hair===x.id}">${headSVG({hair:x.id,skin:SKINS[f.sk??2],hc:f.hc||MODEL.hc,beard:f.beard,face:f.face})}<span>${esc(x.n)}</span></button>`).join('')}</div></div>
    <div><h4>Hair colour</h4><div class="sw">${HAIRCOLS.map(([c,n])=>`<button data-hc="${c}" style="background:${c}" aria-label="${n}" title="${n}" aria-pressed="${(f.hc||'').toLowerCase()===c.toLowerCase()}"></button>`).join('')}</div></div>
    <p class="small" style="margin:0">See the <a href="#hair">hairstyle guide</a> for barber instructions.</p>`}
  else if(t==='beard'){h+=`<div><h4>Beard · ${esc((BEARDS.find(x=>x.id===(f.beard||'clean'))||{n:''}).n)}</h4><div class="optgrid">${BEARDS.map(x=>`<button class="opt" data-beardpick="${x.id}" aria-pressed="${(f.beard||'clean')===x.id}">${headSVG({hair:f.hair,skin:SKINS[f.sk??2],hc:f.hc||MODEL.hc,beard:x.id,face:f.face})}<span>${esc(x.n)}</span></button>`).join('')}</div></div>`}
  else if(t==='body'){h+=`<div><h4>Skin tone</h4><div class="sw">${SKINS.map((c,i)=>`<button data-sk="${i}" style="background:${c}" aria-label="Skin tone ${i+1}" aria-pressed="${(f.sk??2)===i}"></button>`).join('')}</div></div>
    <div><h4>Body type</h4>${optBtns('bt',Object.entries(BODY).map(([k,v])=>[k,v.n]),f.bt||'regular')}</div>
    <div><h4>Face shape</h4>${optBtns('face',Object.entries(FACES).map(([k,v])=>[k,v.n]),f.face||'oval')}</div>`}
  $('#drPanel').innerHTML=h;
}
function setKind(part,k){
  const f=D.fig;
  if(part==='layer'){if(k==='none'){delete f.layer;return}const c=f.layer?f.layer.c:'#26324A';f.layer={k,c};if(k==='tux')f.layer.c2='#262626';return}
  if(part==='shoe'){f.shoe.k=k;return}
  const list=part==='top'?TOPS:BOTS;const opt=list.find(x=>x[0]===k);if(!opt)return;
  const old=f[part]||{};const g=Object.assign({c:old.c||'#FFFFFF'},opt[2]);
  if(old.p&&!(opt[2].p)){g.p=old.p;g.c2=old.c2;g.c3=old.c3}
  if(part==='top'&&g.k==='shirt'){g.tuck=old.tuck;g.sl=old.sl}
  if(part==='bottom'&&g.k==='jeans'&&!old.c)g.c='#3E5F8A';
  f[part]=g;
}
$('#studio').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||!D.fig)return;const d=b.dataset,f=D.fig;
  if(d.pick){pickLook(d.pick);return}
  if(d.tab){D.tab=d.tab;renderTabs();renderPanel();return}
  if(b.id==='drUndo'){if(D.hist.length){D.fig=JSON.parse(D.hist.pop());renderPanel();drawDR()}return}
  if(b.id==='drReset'){pickLook(D.base);return}
  if(b.id==='drSave'){saveLook();return}
  if(b.id==='drDownload'){downloadPNG();return}
  if(b.id==='drCopy'){copyText($('#drPrompt').value,$('#drPrompt'));return}
  let changed=true;snap();
  if(d.kind!==undefined)setKind(D.tab,d.kind);
  else if(d.col){const v=d.c;if(d.col.startsWith('acc:')){const k=d.col.slice(4);f.acc=(f.acc||[]).map(a=>a.split(':')[0]===k?k+':'+v:a)}else{f[d.col][d.key]=v;if(d.key==='c2'&&f[d.col].p)f[d.col].c3=v}}
  else if(d.pat!==undefined){const g=f[D.tab];if(d.pat){g.p=d.pat;g.c2=g.c2||(d.pat==='denim'?g.c:'#C9A24A');g.c3=g.c3||g.c2}else delete g.p}
  else if(d.toggle==='tuck')f.top.tuck=!f.top.tuck;
  else if(d.toggle==='short')f.top.sl=f.top.sl==='short'?'long':'short';
  else if(d.acc){const acc=f.acc||[];const i=acc.findIndex(a=>a.split(':')[0]===d.acc);if(i>=0)acc.splice(i,1);else acc.push(d.acc+':'+ACCS.find(x=>x[0]===d.acc)[2]);f.acc=acc}
  else if(d.hairpick)f.hair=d.hairpick;
  else if(d.hc)f.hc=d.hc;
  else if(d.beardpick)f.beard=d.beardpick;
  else if(d.sk!==undefined)f.sk=+d.sk;
  else if(d.bt){f.bt=d.bt;BT=d.bt}
  else if(d.face)f.face=d.face;
  else{changed=false;D.hist.pop()}
  if(changed){renderPanel();drawDR()}
});
$('#studio').addEventListener('input',e=>{const t=e.target;if(!t.dataset.colin||!D.fig)return;const part=t.dataset.colin,key=t.dataset.key;
  if(part.startsWith('acc:')){const k=part.slice(4);D.fig.acc=(D.fig.acc||[]).map(a=>a.split(':')[0]===k?k+':'+t.value:a)}else D.fig[part][key]=t.value;drawDR()});
$('#studio').addEventListener('change',e=>{if(e.target.dataset.colin){snap();renderPanel()}});
function describe(part){const g=D.fig[part];if(!g)return '';const kind=(part==='top'?TOPS:part==='bottom'?BOTS:LAYS).find(x=>x[0]===curKind(part));
  const pat=g.p?` with a ${(PATS.find(p=>p[0]===g.p)||['',''])[1].toLowerCase()} pattern in ${colourName(g.c2)}`:'';
  return `${colourName(g.c)} ${(kind?kind[1]:g.k).toLowerCase()}${pat}`}
function drPrompt(){const f=D.fig;const acc=(f.acc||[]).map(a=>{const [k,c]=a.split(':');const n=(ACCS.find(x=>x[0]===k)||['',k])[1].replace(/ \(.*\)/,'').toLowerCase();return c&&k!=='sunglasses'?`${colourName(c)} ${n}`:n});
  const hair=(HAIR.find(h=>h.id===f.hair)||{n:''}).n,beard=(BEARDS.find(b=>b.id===(f.beard||'clean'))||{n:''}).n;
  return `Use the attached photo of me. Keep my face, skin tone and build exactly the same. Create a photorealistic full-length fashion photo of me standing facing the camera on a plain light grey studio background, wearing: ${[describe('top')+(f.top&&f.top.tuck?' (tucked in)':''),describe('bottom'),describe('layer')].filter(Boolean).join(', ')}, ${colourName(f.shoe.c)} ${(SHOES.find(s=>s[0]===f.shoe.k)||['',f.shoe.k])[1].toLowerCase()}${acc.length?', with '+acc.join(', '):''}. Hairstyle: ${hair}. Facial hair: ${beard.toLowerCase()}. Soft even studio light, sharp focus, true-to-life fabric colours.`}
function svgString(){return figure(Object.assign({},D.fig),{}).replace('<svg ','<svg width="400" height="800" ')}
function saveLook(){
  const base=L.find(l=>l.id===D.base);
  const lk={lid:'l'+Date.now().toString(36),base:D.base,name:(base?base.n:'My look')+' (restyled)',fig:clone(D.fig),thumb:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgString()),t:Date.now()};
  myLooks=[lk,...myLooks].slice(0,50);try{localStorage.setItem('usg-men-looks',JSON.stringify(myLooks))}catch(e){}
  renderMyLooks();toast('Look saved');if(typeof ACCT!=='undefined')ACCT.onLookSaved(lk);
}
function renderMyLooks(){$('#myLooksBox').hidden=!myLooks.length;$('#myLooks').innerHTML=myLooks.map(l=>`<div class="mini"><button data-load="${esc(l.lid)}" style="border:0;padding:0;background:none;width:100%"><img src="${l.thumb}" alt="${esc(l.name||'Saved look')}"></button><span><button class="linkbtn" data-dellook="${esc(l.lid)}" style="font-size:.72rem">Delete</button></span></div>`).join('')}
$('#myLooks').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.load){loadSaved(myLooks.find(l=>l.lid===b.dataset.load))}
  if(b.dataset.dellook){if(typeof ACCT!=='undefined'&&ACCT.deleteLook)ACCT.deleteLook(b.dataset.dellook);else{myLooks=myLooks.filter(l=>l.lid!==b.dataset.dellook);try{localStorage.setItem('usg-men-looks',JSON.stringify(myLooks))}catch(e){}renderMyLooks()}}});
function loadSaved(l){if(!l||!l.fig)return;D.base=l.base||D.base;D.fig=clone(l.fig);D.hist=[];renderPick();renderPanel();drawDR();$('#studio').scrollIntoView({behavior:'smooth'})}
function downloadPNG(){
  const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=800;c.height=1600;const x=c.getContext('2d');x.fillStyle='#F4F1EB';x.fillRect(0,0,800,1600);x.drawImage(img,0,0,800,1600);
    c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='my-look.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)},'image/png')};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgString());
}

/* ---------- boot ---------- */
renderHero();renderGrid();renderOcc();renderHairFilters();renderHair();renderBeards();renderFaceFinder();renderQuiz();renderCombos();renderRules();renderTabs();renderMyLooks();pickLook('nehrubrocade');persist();
