/* ---------- ACCOUNTS & ADMIN (self-hosted API) ---------- */
const ACCT=(()=>{
  const S={user:null,profile:null,members:[]};
  const VIBES=[['ethnic','Traditional Indian'],['western','Modern western'],['fusion','A bit of both']];
  const BTS=Object.entries(BODY).map(([k,v])=>[k,v.n]);
  const FACESL=Object.entries(FACES).map(([k,v])=>[k,v.n]);
  const HTL=Object.entries(HTYPES);
  const dlgA=$('#acctDlg');
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  async function api(method,url,body){
    const r=await fetch(url,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,credentials:'same-origin'});
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok)throw new Error(j.error||'Something went wrong. Try again.');
    return j;
  }
  const signedIn=()=>!!S.user;
  const hasProfile=()=>!!(S.profile&&S.profile.vibe);
  function initials(n){return (n||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()}

  /* sync hooks called by the rest of the site */
  let savedTimer=null;
  function onSaved(){if(!signedIn())return;clearTimeout(savedTimer);savedTimer=setTimeout(()=>api('PUT','/api/saved',{saved:[...saved]}).catch(e=>toast(e.message)),600)}
  function onLookSaved(lk){if(!signedIn())return;api('POST','/api/looks',lk).catch(e=>toast(e.message))}
  async function deleteLook(lid){myLooks=myLooks.filter(l=>l.lid!==lid);try{localStorage.setItem('usg-men-looks',JSON.stringify(myLooks))}catch(e){}renderMyLooks();if(signedIn())await api('DELETE','/api/looks/'+encodeURIComponent(lid)).catch(e=>toast(e.message));toast('Look deleted')}

  async function adopt(me,{merge=true}={}){
    S.user=me.user;S.profile=me.profile;
    if(S.user){
      const cloud=new Set((S.profile&&S.profile.saved)||[]);const before=cloud.size;
      if(merge)saved.forEach(x=>cloud.add(x));
      saved.clear();cloud.forEach(x=>saved.add(x));persist();
      if(cloud.size!==before)api('PUT','/api/saved',{saved:[...saved]}).catch(()=>{});
      const {looks}=await api('GET','/api/looks').catch(()=>({looks:[]}));
      if(merge){const local=myLooks.filter(l=>l.lid&&!looks.some(c=>c.lid===l.lid));for(const l of local)await api('POST','/api/looks',l).catch(()=>{});myLooks=local.concat(looks)}else myLooks=looks;
      myLooks=myLooks.slice(0,50);try{localStorage.setItem('usg-men-looks',JSON.stringify(myLooks))}catch(e){}renderMyLooks();
    }
    if(S.profile&&S.profile.bt&&BODY[S.profile.bt]){BT=S.profile.bt;if(D.fig){D.fig.bt=BT;drawDR()}}
    renderBtn();renderGrid();renderForYou();
    $('#adminLink').hidden=$('#admin').hidden=!(S.user&&S.user.admin);
    if(S.user&&S.user.admin){loadMembers();loadMessages()}
  }

  /* header */
  function renderBtn(){
    const lbl=$('#acctLbl'),av=$('#acctAv');
    if(signedIn()){lbl.textContent=S.user.name.split(' ')[0];av.hidden=true;$('#acctBtn').dataset.ini=initials(S.user.name)}
    else{lbl.textContent='Sign in';delete $('#acctBtn').dataset.ini}
  }
  function renderForYou(){
    let box=$('#forYou');if(!box){box=document.createElement('div');box.id='forYou';$('#grid').before(box)}
    if(!hasProfile()){box.innerHTML='';return}
    const p=S.profile,sc=o=>(o.c===p.vibe?3:p.vibe==='fusion'&&o.c!=='fusion'?1:0)+(p.occ||[]).filter(k=>o.occ.includes(k)).length*2+(saved.has(o.id)?-5:0);
    const picks=PL().map(o=>[sc(o),o]).sort((a,b)=>b[0]-a[0]).slice(0,8).map(x=>x[1]);
    const hp=HAIR.filter(h=>(!p.face||h.faces.includes(p.face))&&(!p.htype||h.types.includes(p.htype))).slice(0,6);
    box.innerHTML=`<div class="foryou"><span class="eyebrow">Picked for you</span><h3>Based on your style profile</h3><div class="rail">${picks.map(o=>`<button class="mini" data-open="${o.id}">${pimg(o)}<span>${o.n}</span></button>`).join('')}</div>${hp.length?`<h3 style="margin-top:14px">Hairstyles for your ${p.face?FACES[p.face].n.toLowerCase()+' face':'hair'}</h3><div class="rail">${hp.map(h=>`<button class="mini" data-hair="${h.id}">${hairImg(h)}<span>${h.n}</span></button>`).join('')}</div>`:''}</div>`;
  }

  /* dialog */
  let view='login',resetToken=null,emailReset=false;
  const chipRow=(name,opts,cur,multi)=>`<div class="choices" data-field="${name}">${opts.map(([k,n])=>`<button type="button" class="chip" data-v="${k}" aria-pressed="${multi?(cur||[]).includes(k):cur===k}">${n}</button>`).join('')}</div>`;
  const prefsForm=p=>`
    <div class="field">How do you like to dress?${chipRow('vibe',VIBES,p.vibe||'fusion')}</div>
    <div class="field">Your body type${chipRow('bt',BTS,p.bt||'regular')}</div>
    <div class="field">Face shape <span class="small" style="margin:0;font-weight:500">(not sure? use the face-shape finder in Hairstyles)</span>${chipRow('face',FACESL,p.face||'')}</div>
    <div class="field">Hair type${chipRow('htype',HTL,p.htype||'')}</div>
    <div class="field">Occasions you dress for most${chipRow('occ',Object.entries(OCC).map(([k,v])=>[k,v.n]),p.occ||[],true)}</div>`;
  const readPrefs=()=>{const g=f=>[...dlgA.querySelectorAll(`[data-field="${f}"] [aria-pressed="true"]`)].map(b=>b.dataset.v);return {vibe:g('vibe')[0]||'fusion',bt:g('bt')[0]||'regular',occ:g('occ'),face:g('face')[0]||null,htype:g('htype')[0]||null}};
  function renderDlg(msg){
    let body;const err=msg?`<div class="notice" role="alert">${esc(msg)}</div>`:'';
    if(view==='reset'){
      body=`<h3 id="acctTitle">Choose a new password</h3><p style="margin:0">Pick a new password for your account. You’ll be signed in straight away.</p>${err}
      <form id="acResetForm" class="acform" novalidate>
        <label class="field">New password<input type="password" id="acRNew" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"></label>
        <label class="field">Type it again<input type="password" id="acRNew2" autocomplete="new-password" minlength="8" required></label>
        <button class="btn alt" type="submit">Save new password</button></form>`;
    }else if(view==='forgot'){
      body=`<h3 id="acctTitle">Forgot your password?</h3>${err}`+(emailReset?`<p style="margin:0">Enter the email you signed up with and we’ll send you a link to choose a new password.</p>
      <form id="acForgotForm" class="acform" novalidate>
        <label class="field">Email<input type="email" id="acFEmail" autocomplete="email" required></label>
        <button class="btn alt" type="submit">Email me a reset link</button></form>`
      :`<p style="margin:0">Ask the site admin for a password reset link. They can create one for you from the Admin area, and it works for 24 hours.</p>`)+
      `<p class="small" style="margin:0"><button class="linkbtn" data-view="login">Back to sign in</button></p>`;
    }else if(view==='forgotSent'){
      body=`<h3 id="acctTitle">Check your email</h3><p style="margin:0">If there’s an account for that address, a reset link is on its way. It works for 60 minutes. Check your spam folder if you don’t see it.</p>
      <p class="small" style="margin:0"><button class="linkbtn" data-view="login">Back to sign in</button></p>`;
    }else if(!signedIn()){
      const isUp=view==='signup';
      body=`<h3 id="acctTitle">${isUp?'Create your account':'Welcome back'}</h3>
      <p style="margin:0">${isUp?'Save your favourite looks, hairstyles and Dressing Room outfits on every device, and get looks and haircuts picked for you.':'Sign in to see your saved looks on any device.'}</p>
      ${err}
      <form id="acForm" class="acform" novalidate>
        ${isUp?`<label class="field">Name<input type="text" id="acName" autocomplete="name" required maxlength="60"></label>`:''}
        <label class="field">Email<input type="email" id="acEmail" autocomplete="email" required></label>
        <label class="field">Password<input type="password" id="acPass" autocomplete="${isUp?'new-password':'current-password'}" required minlength="8" placeholder="${isUp?'At least 8 characters':''}"></label>
        <button class="btn alt" type="submit">${isUp?'Create account':'Sign in'}</button>
      </form>
      <p class="small" style="margin:0">${isUp?'Already have an account? <button class="linkbtn" data-view="login">Sign in</button>':'New here? <button class="linkbtn" data-view="signup">Create an account</button>'}</p>
      ${!isUp?'<p class="small" style="margin:0"><button class="linkbtn" data-view="forgot">Forgot your password?</button></p>':''}`;
    }else if(!hasProfile()){
      body=`<h3 id="acctTitle">Your style profile</h3><p style="margin:0">Hi ${esc(S.user.name.split(' ')[0])}! Tell us a little about your style so we can pick looks for you.</p>${err}${prefsForm({})}
      <div class="row"><button class="btn alt" id="acPrefsSave">Save my profile</button><button class="btn ghost" data-acclose>Skip for now</button></div>`;
    }else if(view==='password'){
      body=`<h3 id="acctTitle">Change password</h3>${err}<form id="acPwForm" class="acform" novalidate>
        <label class="field">Current password<input type="password" id="acCur" autocomplete="current-password" required></label>
        <label class="field">New password<input type="password" id="acNew" autocomplete="new-password" minlength="8" required placeholder="At least 8 characters"></label>
        <div class="row"><button class="btn alt" type="submit">Change password</button><button class="btn ghost" type="button" data-view="account">Back</button></div></form>`;
    }else{
      const p=S.profile;
      body=`<div class="acc-head"><span class="ini">${esc(initials(S.user.name))}</span><div><h3 id="acctTitle">My account</h3><p class="small" style="margin:0">${esc(S.user.name)} · ${esc(S.user.email)}</p></div></div>${err}
      <div class="acc-stats"><div><b>${saved.size}</b>hearts</div><div><b>${myLooks.length}</b>saved looks</div><div><b>${esc(S.user.created||'—')}</b>member since</div></div>
      ${myLooks.length?`<div><h4 style="margin:0 0 6px">My saved looks</h4><div class="rail">${myLooks.map(l=>`<div class="mini" style="padding:0"><img src="${l.thumb}" alt="" class="fit-contain"><span><button class="btn ghost" data-acload="${esc(l.lid)}" style="padding:4px 8px;font-size:.7rem">Open</button> <button class="btn ghost" data-acdel="${esc(l.lid)}" style="padding:4px 8px;font-size:.7rem">Delete</button></span></div>`).join('')}</div></div>`:''}
      <h4 style="margin:4px 0 0">Style profile</h4>${prefsForm(p)}
      <div class="row"><button class="btn alt" id="acPrefsSave">Save changes</button><button class="btn ghost" data-view="password">Change password</button><button class="btn ghost" id="acLogout">Sign out</button></div>
      <button class="linkbtn" id="acDelAsk" style="justify-self:start">Delete my account</button>
      <div id="acDelBox" hidden class="notice">This deletes your account, style profile, hearts and saved looks. It can’t be undone. <div class="row" style="margin-top:8px"><button class="btn" id="acDelYes">Yes, delete my account</button><button class="btn ghost" id="acDelNo">Keep it</button></div></div>`;
    }
    dlgA.innerHTML=`<button class="close" data-acclose aria-label="Close">×</button><div class="acc-body">${body}</div>`;
    const f=dlgA.querySelector('input');if(f)f.focus();
  }
  function openDlg(v){if(v)view=v;else view=signedIn()?'account':'login';renderDlg();if(!dlgA.open)dlgA.showModal()}
  dlgA.addEventListener('submit',async e=>{
    e.preventDefault();const btn=e.target.querySelector('[type=submit]');btn.disabled=true;
    try{
      if(e.target.id==='acForm'){
        const body={email:$('#acEmail').value,password:$('#acPass').value};
        if(view==='signup')body.name=$('#acName').value;
        const me=await api('POST',view==='signup'?'/api/auth/signup':'/api/auth/login',body);
        await adopt(me);toast(view==='signup'?'Account created':'Signed in');view='account';renderDlg();
      }else if(e.target.id==='acForgotForm'){
        await api('POST','/api/auth/forgot',{email:$('#acFEmail').value});view='forgotSent';renderDlg();
      }else if(e.target.id==='acResetForm'){
        if($('#acRNew').value!==$('#acRNew2').value)throw new Error('The two passwords don’t match.');
        const me=await api('POST','/api/auth/reset',{token:resetToken,password:$('#acRNew').value});
        resetToken=null;await adopt(me,{merge:false});toast('Password changed. You’re signed in.');view='account';renderDlg();
      }else if(e.target.id==='acPwForm'){
        await api('POST','/api/auth/password',{current:$('#acCur').value,password:$('#acNew').value});toast('Password changed');view='account';renderDlg();
      }
    }catch(err){renderDlg(err.message)}
  });
  dlgA.addEventListener('click',async e=>{
    if(e.target===dlgA){dlgA.close();return}
    const b=e.target.closest('button');if(!b||(b.type==='submit'&&b.closest('form')))return;const d=b.dataset;
    if('acclose' in d){dlgA.close();return}
    if(d.view){view=d.view;renderDlg();return}
    if(d.v!==undefined){const row=b.closest('[data-field]');const multi=row.dataset.field==='occ';if(!multi&&b.getAttribute('aria-pressed')==='true'&&(row.dataset.field==='face'||row.dataset.field==='htype')){b.setAttribute('aria-pressed','false');return}if(!multi)row.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));else b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');return}
    try{
      if(b.id==='acPrefsSave'){b.disabled=true;const me=await api('PUT','/api/profile',Object.assign(readPrefs(),{saved:[...saved]}));S.profile=me.profile;renderForYou();toast('Profile saved');view='account';renderDlg();return}
      if(b.id==='acLogout'){await api('POST','/api/auth/logout');S.user=null;S.profile=null;saved.clear();persist();myLooks=[];try{localStorage.removeItem('usg-men-looks')}catch(e){}renderMyLooks();renderBtn();renderGrid();renderForYou();$('#adminLink').hidden=$('#admin').hidden=true;dlgA.close();toast('Signed out');return}
      if(b.id==='acDelAsk'){$('#acDelBox').hidden=false;return}
      if(b.id==='acDelNo'){$('#acDelBox').hidden=true;return}
      if(b.id==='acDelYes'){await api('DELETE','/api/account');S.user=null;S.profile=null;saved.clear();persist();myLooks=[];try{localStorage.removeItem('usg-men-looks')}catch(e){}renderMyLooks();renderBtn();renderForYou();$('#adminLink').hidden=$('#admin').hidden=true;dlgA.close();toast('Your account was deleted');return}
      if(d.acdel){await deleteLook(d.acdel);renderDlg();return}
      if(d.acload){const l=myLooks.find(x=>x.lid===d.acload);dlgA.close();$('#studio').scrollIntoView({behavior:'smooth'});loadSaved(l);return}
    }catch(err){renderDlg(err.message)}
  });
  $('#acctBtn').addEventListener('click',()=>openDlg());

  /* site settings */
  function applySite(cfg){
    SITE=Object.assign({hidden:[],featured:[],announce:'',announceOn:false},cfg);
    $('#announce').hidden=!(SITE.announceOn&&SITE.announce);$('#announceTxt').textContent=SITE.announce||'';
    renderHero();renderGrid();renderOcc();if(D.fig)renderPick();renderForYou();
  }

  /* admin */
  let admTab='overview';
  async function loadMessages(){
    try{const {messages}=await api('GET','/api/admin/messages');
      $('#admMsgCount').textContent=messages.length?`(${messages.length})`:'';
      $('#admMessages').innerHTML=messages.length?`<p class="small" style="margin:0 0 10px">Messages sent through the <a href="/contact" target="_blank">contact form</a>, newest first. They’re deleted automatically after 12 months.</p>`+messages.map(m=>`<div class="notice" style="background:var(--surface-2);margin-bottom:10px">
        <div class="row" style="justify-content:space-between;gap:8px"><div><b>${esc(m.name)}</b> · <a href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: '+(m.topic||'your message'))}">${esc(m.email)}</a><br><span class="small" style="margin:0">${esc(m.topic||'')} · ${new Date(m.created).toLocaleString()}</span></div>
        <div class="row"><a class="btn ghost" style="padding:4px 10px;font-size:.72rem;text-decoration:none" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: '+(m.topic||'your message'))}">Reply</a><button class="btn ghost" data-delmsg="${m.id}" style="padding:4px 10px;font-size:.72rem">Delete</button></div></div>
        <p style="margin:8px 0 0;white-space:pre-wrap">${esc(m.message)}</p></div>`).join(''):`<p class="small">No messages yet. They’ll appear here when someone uses the <a href="/contact" target="_blank">contact form</a>.</p>`;
    }catch(e){}
  }
  $('#admMessages').addEventListener('click',async e=>{const b=e.target.closest('[data-delmsg]');if(!b)return;
    if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='Tap again to delete';return}
    try{await api('DELETE','/api/admin/messages/'+b.dataset.delmsg);toast('Message deleted');loadMessages()}catch(err){toast(err.message)}});
  async function loadMembers(){try{S.members=(await api('GET','/api/admin/members')).members;renderAdmin()}catch(e){}}
  function renderAdmin(){
    const M=S.members;
    const hearts={};M.forEach(m=>(m.saved||[]).forEach(id=>hearts[id]=(hearts[id]||0)+1));
    const top=Object.entries(hearts).sort((a,b)=>b[1]-a[1]).slice(0,6);const maxH=top.length?top[0][1]:1;
    const wk=new Date(Date.now()-7*864e5).toISOString().slice(0,10);
    const vib={};M.forEach(m=>{if(m.vibe)vib[m.vibe]=(vib[m.vibe]||0)+1});
    $('#admOverview').innerHTML=`<div class="kpis">
      <div class="kpi"><b>${M.length}</b><span>members</span></div>
      <div class="kpi"><b>${M.filter(m=>(m.lastActive||'')>=wk).length}</b><span>active in the last 7 days</span></div>
      <div class="kpi"><b>${M.filter(m=>(m.joined||'')>=wk).length}</b><span>joined in the last 7 days</span></div>
      <div class="kpi"><b>${Object.values(hearts).reduce((a,b)=>a+b,0)}</b><span>hearts given</span></div>
      <div class="kpi"><b>${M.reduce((a,m)=>a+(m.looks||0),0)}</b><span>Dressing Room looks saved</span></div></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:16px">
        <div><h4 style="margin:0 0 8px">Most-loved looks</h4>${top.length?top.map(([id,n])=>{const o=L.find(l=>l.id===id);return o?`<div class="toprow">${HAS(o)?`<img src="${photos[o.id]}" alt="">`:''}<div style="flex:1;min-width:0"><b style="font-size:.85rem">${o.n}</b><div class="bar" style="width:${Math.max(6,n/maxH*100)}%"></div></div><span class="small" style="margin:0">${n}</span></div>`:''}).join(''):'<p class="small">No hearts yet. They’ll show here as members save looks.</p>'}</div>
        <div><h4 style="margin:0 0 8px">Style mix</h4>${VIBES.map(([k,n])=>`<div class="toprow"><div style="flex:1"><b style="font-size:.85rem">${n}</b><div class="bar" style="width:${M.length?Math.max(4,(vib[k]||0)/M.length*100):4}%;background:var(--peacock)"></div></div><span class="small" style="margin:0">${vib[k]||0}</span></div>`).join('')}</div>
      </div>`;
    $('#admMembers').innerHTML=`<div class="row" style="justify-content:space-between;margin-bottom:8px"><span class="small" style="margin:0">${M.length} members</span><a class="btn ghost" href="/api/admin/export.csv" style="text-decoration:none">Download CSV</a></div>`+(M.length?`<div class="tbl"><table><thead><tr><th>Member</th><th>Email</th><th>Joined</th><th>Last active</th><th>Style</th><th>Hearts</th><th>Looks</th><th>Role</th><th></th></tr></thead><tbody>${M.map(m=>`<tr><td><div class="who"><span class="ini sm">${esc(initials(m.name))}</span><span>${esc(m.name)}</span></div></td><td>${esc(m.email)}</td><td>${esc(m.joined)}</td><td>${esc(m.lastActive)}</td><td>${(VIBES.find(v=>v[0]===m.vibe)||['','—'])[1]}</td><td>${(m.saved||[]).length}</td><td>${m.looks||0}</td>
      <td>${m.id===S.user.id?'Admin (you)':`<button class="btn ghost" data-role="${m.id}" data-to="${m.admin?0:1}" style="padding:4px 10px;font-size:.72rem">${m.admin?'Admin · remove':'Make admin'}</button>`}</td>
      <td style="white-space:nowrap">${m.id===S.user.id?'':`<button class="btn ghost" data-resetm="${m.id}" style="padding:4px 10px;font-size:.72rem">Reset link</button> <button class="btn ghost" data-delm="${m.id}" style="padding:4px 10px;font-size:.72rem">Delete</button>`}</td></tr>`).join('')}</tbody></table></div>`:`<p class="small">No one has signed up yet.</p>`);
    if($('#admSite').dataset.dirty!=='1'){
      $('#admSite').innerHTML=`<div class="field">Announcement banner<textarea id="admAnn" rows="2" maxlength="200" placeholder="e.g. New: 20 festive looks for Diwali">${esc(SITE.announce||'')}</textarea></div>
      <label style="display:flex;gap:8px;align-items:center;font-weight:600;margin:8px 0"><input type="checkbox" id="admAnnOn" ${SITE.announceOn?'checked':''}> Show the banner at the top of the guide</label>
      <h4 style="margin:14px 0 4px">Looks</h4><p class="small" style="margin:0 0 8px">Tick <b>Front page</b> for the looks in the header strip (up to 8). Tick <b>Hide</b> to remove a look from the lookbook, occasions, quiz and Dressing Room.</p>
      <div class="lookpick">${L.filter(HAS).map(o=>`<div class="lp ${SITE.hidden.includes(o.id)?'hid':''}"><img src="${photos[o.id]}" alt="" loading="lazy"><div>${o.n}<label><input type="checkbox" data-feat="${o.id}" ${SITE.featured.includes(o.id)?'checked':''}> Front page</label><label><input type="checkbox" data-hide="${o.id}" ${SITE.hidden.includes(o.id)?'checked':''}> Hide</label></div></div>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn alt" id="admSave">Publish settings</button><span class="small" id="admMsg" style="margin:0"></span></div>`;
    }
  }
  $('#admTabs').addEventListener('click',e=>{const b=e.target.closest('[data-at]');if(!b)return;admTab=b.dataset.at;$('#admTabs').querySelectorAll('[data-at]').forEach(x=>x.setAttribute('aria-selected',x===b));document.querySelectorAll('.admp').forEach(p=>p.hidden=p.dataset.ap!==admTab);if(admTab==='messages')loadMessages();else if(admTab!=='site')loadMembers()});
  $('#admSite').addEventListener('input',()=>{$('#admSite').dataset.dirty='1'});
  $('#admSite').addEventListener('change',e=>{$('#admSite').dataset.dirty='1';const t=e.target;if(t.dataset.hide)t.closest('.lp').classList.toggle('hid',t.checked);
    if(t.dataset.feat&&$('#admSite').querySelectorAll('[data-feat]:checked').length>8){t.checked=false;toast('Up to 8 front-page looks')}});
  $('#admSite').addEventListener('click',async e=>{if(e.target.id!=='admSave')return;const r=$('#admSite');
    const cfg={announce:$('#admAnn').value.trim(),announceOn:$('#admAnnOn').checked,featured:[...r.querySelectorAll('[data-feat]:checked')].map(x=>x.dataset.feat),hidden:[...r.querySelectorAll('[data-hide]:checked')].map(x=>x.dataset.hide)};
    e.target.disabled=true;try{applySite(await api('PUT','/api/site',cfg));r.dataset.dirty='0';$('#admMsg').textContent='Published. Visitors see it on their next page load.'}catch(err){$('#admMsg').textContent=err.message}e.target.disabled=false});
  $('#admMembers').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
    try{
      if(b.dataset.role){await api('PATCH','/api/admin/members/'+b.dataset.role,{admin:b.dataset.to==='1'});toast('Role updated');loadMembers()}
      if(b.dataset.resetm){
        const {link,hours}=await api('POST','/api/admin/members/'+b.dataset.resetm+'/reset');
        const m=S.members.find(x=>x.id===b.dataset.resetm);let copied=false;
        try{await navigator.clipboard.writeText(link);copied=true}catch(e){}
        const box=document.createElement('tr');box.innerHTML=`<td colspan="9"><div class="notice">Password reset link for <b>${esc(m?m.name:'member')}</b> (works once, for ${hours} hours)${copied?', copied to your clipboard':''}. Send it to them:<br><input type="text" readonly value="${esc(link)}" style="width:100%;margin-top:6px" onclick="this.select()"></div></td>`;
        b.closest('tr').after(box);return}
      if(b.dataset.delm){if(b.dataset.sure!=='1'){b.dataset.sure='1';b.textContent='Tap again to delete';return}await api('DELETE','/api/admin/members/'+b.dataset.delm);toast('Member deleted');loadMembers()}
    }catch(err){toast(err.message)}});

  /* boot */
  (async()=>{
    api('GET','/api/site').then(applySite).catch(()=>{});
    api('GET','/api/auth/options').then(o=>{emailReset=!!o.emailReset}).catch(()=>{});
    const u=new URL(location.href),rt=u.searchParams.get('reset');
    // links from the look pages: /?look=id opens the look, /?try=id loads it in the Dressing Room
    const lk=u.searchParams.get('look'),tr=u.searchParams.get('try');
    if(lk||tr){u.searchParams.delete('look');u.searchParams.delete('try');history.replaceState(null,'',u.pathname+u.search+u.hash);
      const o=L.find(x=>x.id===(lk||tr));
      if(o){if(lk)openLook(o.id);else{pickLook(o.id);setTimeout(()=>$('#studio').scrollIntoView({behavior:'smooth'}),300)}}}
    const hr=u.searchParams.get('hair');if(hr){u.searchParams.delete('hair');history.replaceState(null,'',u.pathname+u.search+u.hash);if(HAIR.some(h=>h.id===hr))setTimeout(()=>tryHair(hr),200)}
    if(rt){resetToken=rt;u.searchParams.delete('reset');history.replaceState(null,'',u.pathname+u.search+u.hash);openDlg('reset')}
    try{const me=await api('GET','/api/me');if(me.user)await adopt(me,{merge:true});else renderBtn()}catch(e){renderBtn()}
  })();
  async function onFace(f){if(!signedIn()||!hasProfile()||S.profile.face===f)return;try{const me=await api('PUT','/api/profile',Object.assign({},S.profile,{face:f}));S.profile=me.profile;renderForYou();toast('Face shape saved to your profile')}catch(e){}}
  return {onSaved,onLookSaved,onFace,deleteLook,open:openDlg};
})();
