(() => {
  const state = () => window.__portalState();
  const pending = new Map();
  const esc = s => String(s ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const mediaEditor=(kind,key,current)=>`<div class="media-editor"><div class="media-actions"><label class="upload-media-btn">Upload ${kind==="logo"?"Logo":"QR"}<input type="file" accept="image/*" onchange="portalQueue('${esc(key)}','${kind}',this)"></label>${current?`<button class="small-btn danger" type="button" onclick="portalRemove('${esc(key)}','${kind}')">Remove</button>`:""}</div><div class="media-preview" id="portal-preview-${esc(key)}">${current?`<img src="${esc(current)}" alt="Current ${kind}">`:"<span>No "+kind+" selected</span>"}</div><div class="advanced-url"><label>URL (optional advanced method)</label><input id="portal-url-${esc(key)}" value="${esc(current||"")}" placeholder="${kind==="logo"?"Logo URL":"QR image URL"}"></div></div>`;
  const detail=(id,i,d)=>`<div class="detail-editor-row"><input class="detail-label-input" value="${esc(d[0])}" placeholder="Label"><input class="detail-value-input" value="${esc(d[1])}" placeholder="Value"><button class="small-btn danger" type="button" onclick="this.parentElement.remove()">×</button></div>`;
  const method=(m)=>`<div class="method-editor" id="portal-method-${esc(m.id)}"><div class="method-head"><input class="method-name-input" id="portal-name-${esc(m.id)}" value="${esc(m.name)}"><div class="method-actions"><button class="small-btn move-btn" type="button" title="Move up" onclick="portalMoveMethod('${esc(m.id)}',-1)">↑</button><button class="small-btn move-btn" type="button" title="Move down" onclick="portalMoveMethod('${esc(m.id)}',1)">↓</button><button class="small-btn danger" type="button" onclick="portalDelete('${esc(m.id)}')">Delete</button></div></div><div class="editor-row"><label class="editor-label">Short label</label><input id="portal-short-${esc(m.id)}" value="${esc(m.short||"")}"></div>${mediaEditor("logo","logo:"+m.id,m.logo)}${mediaEditor("qr","qr:"+m.id,m.qr)}<div class="details-editor"><div class="details-head"><strong>Payment details</strong><button class="small-btn" type="button" onclick="portalAddDetail('${esc(m.id)}')">+ Add detail</button></div><div id="portal-details-${esc(m.id)}">${(m.details||[]).map((d,i)=>detail(m.id,i,d)).join("")}</div></div></div>`;
  const section=(title,key,cfg)=>`<div class="editor-card"><div class="section-head"><h2 class="section-title">${title}</h2><button class="small-btn add-btn" type="button" onclick="portalAddMethod('${key}')">+ Add payment method</button></div><div id="portal-methods-${key}">${(cfg[key]||[]).map(method).join("")}</div></div>`;
  const field=(k,label,cfg,area=false)=>`<div class="editor-row"><label class="editor-label">${label}</label>${area?`<textarea id="portal-${k}">${esc(cfg[k])}</textarea>`:`<input id="portal-${k}" value="${esc(cfg[k])}">`}</div>`;

  async function render(){
    const s=state(),cfg=s.cfg();
    const me=await fetch("/api/me",{cache:"no-store"}).then(r=>r.json()).catch(()=>({ok:false}));
    if(!me.ok){s.app().innerHTML=`<div class="admin"><h1 class="title">Owner Login</h1><div class="editor-card"><div class="notice">Choose and store your own ADMIN_PASSWORD in Cloudflare. The password is never stored in this page.</div><form onsubmit="return portalLogin(event)"><div class="editor-row"><label class="editor-label">Password</label><input id="portal-password" type="password" autocomplete="current-password" required></div><button class="save-btn">Sign in</button><p id="portal-login-error" class="notice" style="display:none"></p></form></div><button class="back" onclick="goHome()">← Customer page</button></div>`;return;}
    s.app().innerHTML=`<div class="admin"><div class="topbar"><button class="back" onclick="goHome()">← Customer page</button><button class="small-btn" onclick="logout()">Log out</button></div><h1 class="title">Owner Editor</h1><div class="notice">Manage everything here. Customer payment screenshots remain browser-local and are never uploaded or stored by this portal.</div><div class="editor-card"><h2 class="section-title">Portal settings</h2>${field("title","Page title",cfg)}${mediaEditor("logo","logo",cfg.logo)}${field("nepalMin","Nepal minimum",cfg)}${field("internationalMin","International minimum",cfg)}${field("time","Time",cfg)}${field("screenshotInstruction","Screenshot instruction",cfg)}${field("contactMessage","Contact message",cfg,true)}${field("whatsappName","WhatsApp name",cfg)}${field("whatsappUsername","WhatsApp username",cfg)}${field("whatsappPhone","WhatsApp phone",cfg)}</div>${section("Nepal payment methods","nepal",cfg)}${section("International payment methods","international",cfg)}<button class="save-btn" type="button" onclick="portalSave()">Save all changes</button><div id="portal-status" class="notice save-status"></div></div>`;
    updateMoveButtons("nepal");updateMoveButtons("international");
  }
  function queue(key,kind,input){
    const f=input.files?.[0];if(!f)return;
    if(!f.type.startsWith("image/"))return alert("Please choose an image file.");
    const max=kind==="logo"?3*1024*1024:5*1024*1024;
    if(f.size>max)return alert(`Maximum size is ${kind==="logo"?"3 MB":"5 MB"}.`);
    const url=URL.createObjectURL(f);pending.set(key,{file:f,kind,preview:url});
    const urlInput=document.getElementById("portal-url-"+key);if(urlInput)urlInput.value="";
    const box=document.getElementById("portal-preview-"+key);if(box)box.innerHTML=`<img src="${esc(url)}" alt="Selected ${kind}">`;
  }
  async function upload(key){
    const p=pending.get(key);if(!p)return null;
    const fd=new FormData();fd.append("file",p.file);fd.append("kind",p.kind);if(p.kind==="qr")fd.append("methodId",key.slice(3));
    const r=await fetch("/api/media",{method:"POST",body:fd});if(!r.ok)throw new Error(await r.text());
    const x=await r.json();URL.revokeObjectURL(p.preview);pending.delete(key);return x.url;
  }
  function moveMethod(id,direction){\n    const s=state(),cfg=s.cfg();\n    let category=null;\n    for(const key of ["nepal","international"]){if((cfg[key]||[]).some(m=>m.id===id)){category=key;break;}}\n    if(!category)return;\n    const list=cfg[category],index=list.findIndex(m=>m.id===id),target=index+direction;\n    if(index<0||target<0||target>=list.length)return;\n    [list[index],list[target]]=[list[target],list[index]];\n    const container=document.getElementById("portal-methods-"+category),node=document.getElementById("portal-method-"+id);\n    if(!container||!node)return;\n    if(direction<0)container.insertBefore(node,container.children[target]);\n    else container.insertBefore(node,container.children[target+1]||null);\n    updateMoveButtons(category);\n  }\n  function updateMoveButtons(category){\n    const list=state().cfg()[category]||[],container=document.getElementById("portal-methods-"+category);\n    if(!container)return;\n    list.forEach((m,i)=>{\n      const node=document.getElementById("portal-method-"+m.id);if(!node)return;\n      const buttons=node.querySelectorAll(".move-btn");\n      if(buttons[0])buttons[0].disabled=i===0;\n      if(buttons[1])buttons[1].disabled=i===list.length-1;\n    });\n  }\n  function addMethod(key){
    const s=state(),cfg=s.cfg(),id="method-"+crypto.randomUUID().replaceAll("-","").slice(0,12);
    cfg[key].push({id,name:"New Payment Method",short:"PM",logo:"",qr:"",details:[["Account / ID",""],["Holder",""]]});render();
  }
  function deleteMethod(id){
    const s=state(),cfg=s.cfg(),m=s.find(id);if(!m||!confirm(`Delete "${m.name}"?`))return;
    cfg.nepal=cfg.nepal.filter(x=>x.id!==id);cfg.international=cfg.international.filter(x=>x.id!==id);pending.delete("logo:"+id);pending.delete("qr:"+id);render();
  }
  function addDetail(id){
    const box=document.getElementById("portal-details-"+id);if(box)box.insertAdjacentHTML("beforeend",detail(id,Date.now(),["",""]));
  }
  function removeMedia(key,kind){
    const s=state(),cfg=s.cfg(),[type,id]=key.split(":");
    if(type==="logo"&&id==="logo")cfg.logo="";else{const m=s.find(id);if(m)kind==="logo"?m.logo="":m.qr="";}
    pending.delete(key);render();
  }
  async function save(){
    const s=state(),cfg=s.cfg(),status=document.getElementById("portal-status");status.textContent="Saving…";
    try{
      const title=document.getElementById("portal-title");if(title)cfg.title=title.value.trim();
      for(const k of ["nepalMin","internationalMin","time","screenshotInstruction","contactMessage","whatsappName","whatsappUsername","whatsappPhone"]){const e=document.getElementById("portal-"+k);if(e)cfg[k]=e.value;}
      const logo=await upload("logo");if(logo)cfg.logo=logo;const logoUrl=document.getElementById("portal-url-logo");if(logoUrl?.value.trim())cfg.logo=logoUrl.value.trim();
      for(const m of s.allMethods()){
        m.name=document.getElementById("portal-name-"+m.id)?.value.trim()||m.name;
        m.short=document.getElementById("portal-short-"+m.id)?.value.trim()||"PM";
        const rows=[...document.querySelectorAll("#portal-details-"+CSS.escape(m.id)+" .detail-editor-row")];
        m.details=rows.map(r=>[r.querySelector(".detail-label-input")?.value.trim()||"",r.querySelector(".detail-value-input")?.value.trim()||""]).filter(d=>d[0]||d[1]);
        const lu=document.getElementById("portal-url-logo:"+m.id),qu=document.getElementById("portal-url-qr:"+m.id);
        const l=await upload("logo:"+m.id);if(l)m.logo=l;const q=await upload("qr:"+m.id);if(q)m.qr=q;
        if(lu?.value.trim())m.logo=lu.value.trim();if(qu?.value.trim())m.qr=qu.value.trim();
      }
      const r=await fetch("/api/config",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify(cfg)});if(!r.ok)throw new Error(await r.text());
      const x=await r.json();s.setCfg(x.config||cfg);status.textContent="Saved successfully.";setTimeout(s.home,500);
    }catch(e){status.textContent="Save failed: "+e.message;}
  }
  async function login(e){
    e.preventDefault();const p=document.getElementById("portal-password").value;
    const r=await fetch("/api/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({password:p})});
    if(!r.ok){const x=document.getElementById("portal-login-error");x.textContent="Invalid password.";x.style.display="block";return false}
    await state().reload();render();return false;
  }
  window.admin=render;
  Object.assign(window,{portalQueue:queue,portalDelete:deleteMethod,portalAddDetail:addDetail,portalAddMethod:addMethod,portalRemove:removeMedia,portalSave:save,portalLogin:login});
  if(location.hash==="#admin")render();
})();