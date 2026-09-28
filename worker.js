const DEFAULT_CONFIG = {
  title: "Payment Methods",
  logo: "",
  nepalMin: "Rs. 1,000 NPR",
  internationalMin: "$20 USD/USDT",
  time: "30 minutes",
  screenshotInstruction: "Take the screenshot of Successful payment and upload it below",
  contactMessage: "Please send same screenshot on message to verify, I will know you are waiting and contact you as soon as possible, Please Don't panic you are in queue",
  whatsappName: "DARWIN NIROULA",
  whatsappUsername: "ndarwin1414",
  whatsappPhone: "+9779842723995",
  nepal: [
    {id:"nabil",name:"Nabil Bank Limited",short:"NB",logo:"",qr:"",details:[["Account Holder","DARWIN NIROULA"],["Account Number","09810017535771"],["SWIFT","NARBNPKA"]]},
    {id:"esewa",name:"eSewa",short:"eS",logo:"",qr:"",details:[["ID Owner","DARWIN NIROULA"],["eSewa ID","+9779842723995"],["Username","ndarwin1414"]]}
  ],
  international: [
    {id:"trc20",name:"USDT – TRC20 (Tron)",short:"₮",logo:"",qr:"",details:[["Network","TRC20 (Tron)"],["Wallet Address","TH4guJP4iXEpxTZwgdz4NzenSv7DH3oVzW"],["Holder","DARWIN NIROULA"]]},
    {id:"bep20",name:"USDT – BEP20 (Binance Smart Chain)",short:"₮",logo:"",qr:"",details:[["Network","BEP20 (Binance Smart Chain)"],["Wallet Address","0x5ef45b836e6005ce6f5ed7c2aee8d235a104fc76"],["Holder","DARWIN NIROULA"]]},
    {id:"erc20",name:"USDT – ERC20 (Ethereum)",short:"₮",logo:"",qr:"",details:[["Network","ERC20 (Ethereum)"],["Wallet Address","0x5ef45b836e6005ce6f5ed7c2aee8d235a104fc76"],["Holder","DARWIN NIROULA"]]},
    {id:"neteller",name:"NETELLER",short:"N",logo:"",qr:"",details:[["NETELLER ID","363887821"],["Holder","DARWIN NIROULA"]]},
    {id:"skrill",name:"SKRILL",short:"S",logo:"",qr:"",details:[["SKRILL ID","241971338"],["Holder","DARWIN NIROULA"]]},
    {id:"payoneer",name:"PAYONEER",short:"P",logo:"",qr:"",details:[["PAYONEER ID","76121661"],["Holder","DARWIN NIROULA"]]}
  ]
};

const enc = new TextEncoder();

function b64u(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function unb64u(s) {
  s=s.replace(/-/g,"+").replace(/_/g,"/");
  while (s.length%4) s+="=";
  const x=atob(s);
  return Uint8Array.from(x,c=>c.charCodeAt(0));
}
async function sign(secret,data) {
  const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(data)));
}
async function sessionToken(secret) {
  const ts=Date.now().toString();
  return ts+"."+b64u(await sign(secret,ts));
}
async function authorized(request,secret) {
  if(!secret)return false;
  const c=request.headers.get("Cookie")||"",m=c.match(/dp_admin=([^;]+)/);
  if(!m)return false;
  const p=m[1].split(".");
  if(p.length!==2)return false;
  const ts=Number(p[0]);
  if(!Number.isFinite(ts)||Date.now()-ts>43200000||Date.now()<ts)return false;
  const expected=await sign(secret,p[0]),got=unb64u(p[1]);
  if(got.length!==expected.length)return false;
  let d=0;
  for(let i=0;i<got.length;i++)d|=got[i]^expected[i];
  return d===0;
}
async function getConfig(env) {
  if(env.PAYMENT_CONFIG) {
    const v=await env.PAYMENT_CONFIG.get("config","json");
    if(v) return v;
  }
  return structuredClone(DEFAULT_CONFIG);
}
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{
  status,
  headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store",...headers}
});
function internalMediaUrl(value) {
  return typeof value==="string" && value.startsWith("/media/");
}
async function deleteMediaUrl(env,value) {
  if(env.PAYMENT_CONFIG && internalMediaUrl(value)) {
    await env.PAYMENT_CONFIG.delete(value.slice("/media/".length));
  }
}
function sanitizeConfig(cfg) {
  const out=structuredClone(DEFAULT_CONFIG);
  if(!cfg || typeof cfg!=="object") return out;
  for(const k of ["title","logo","nepalMin","internationalMin","time","screenshotInstruction","contactMessage","whatsappName","whatsappUsername","whatsappPhone"]) {
    if(typeof cfg[k]==="string") out[k]=cfg[k].trim();
  }
  for(const category of ["nepal","international"]) {
    if(Array.isArray(cfg[category])) {
      out[category]=cfg[category].filter(m=>m&&typeof m==="object").map(m=>({
        id:String(m.id||crypto.randomUUID()).slice(0,80),
        name:String(m.name||"Payment Method").slice(0,200),
        short:String(m.short||String(m.name||"PM").slice(0,2)).slice(0,10),
        logo:typeof m.logo==="string"?m.logo.trim():"",
        qr:typeof m.qr==="string"?m.qr.trim():"",
        details:Array.isArray(m.details)?m.details.filter(d=>Array.isArray(d)&&d.length>=2).map(d=>[String(d[0]).slice(0,100),String(d[1]).slice(0,1000)]):[]
      }));
    }
  }
  return out;
}
async function mediaResponse(env,key) {
  if(!env.PAYMENT_CONFIG) return new Response("Media storage is not configured",{status:503});
  const object=await env.PAYMENT_CONFIG.getWithMetadata(key,{type:"arrayBuffer"});
  if(!object.value) return new Response("Not found",{status:404});
  const h=new Headers();
  const metadata=object.metadata&&typeof object.metadata==="object"?object.metadata:{};
  h.set("content-type",typeof metadata.contentType==="string"?metadata.contentType:"application/octet-stream");
  h.set("cache-control","public, max-age=31536000, immutable");
  return new Response(object.value,{headers:h});
}

export default {
  async fetch(request,env) {
    const url=new URL(request.url);

    if(url.pathname==="/api/config"&&request.method==="GET") return json(await getConfig(env));

    if(url.pathname==="/api/login"&&request.method==="POST") {
      const body=await request.json().catch(()=>({})),secret=env.ADMIN_PASSWORD||"";
      if(!secret||body.password!==secret)return json({ok:false,error:"Invalid password"},401);
      const token=await sessionToken(secret);
      return new Response(JSON.stringify({ok:true}),{headers:{
        "content-type":"application/json","cache-control":"no-store",
        "set-cookie":"dp_admin="+token+"; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200"
      }});
    }

    if(url.pathname==="/api/me"&&request.method==="GET")
      return json({ok:await authorized(request,env.ADMIN_PASSWORD||"")});

    if(url.pathname==="/api/logout"&&request.method==="POST")
      return new Response(JSON.stringify({ok:true}),{headers:{
        "content-type":"application/json","set-cookie":"dp_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
      }});

    if(url.pathname==="/api/media"&&request.method==="POST") {
      if(!(await authorized(request,env.ADMIN_PASSWORD||""))) return json({ok:false,error:"Unauthorized"},401);
      if(!env.PAYMENT_CONFIG) return json({ok:false,error:"PAYMENT_CONFIG KV binding is not configured"},503);
      const form=await request.formData().catch(()=>null);
      const file=form?.get("file");
      const kind=String(form?.get("kind")||"");
      const methodId=String(form?.get("methodId")||"");
      if(!(file instanceof File)) return json({ok:false,error:"Image file is required"},400);
      if(!file.type.startsWith("image/")) return json({ok:false,error:"Only image files are allowed"},400);
      const maxBytes=kind==="logo"?3*1024*1024:5*1024*1024;
      if(file.size>maxBytes) return json({ok:false,error:"Image is too large"},400);
      if(kind!=="logo"&&kind!=="qr") return json({ok:false,error:"Invalid media type"},400);
      if(kind==="qr"&&!methodId) return json({ok:false,error:"Payment method ID is required for QR uploads"},400);
      const ext=(file.name.match(/\.([a-z0-9]+)$/i)?.[1]||file.type.split("/")[1]||"img").toLowerCase().replace(/[^a-z0-9]/g,"");
      const key=`media/${kind}/${methodId?methodId+"/":""}${crypto.randomUUID()}.${ext}`;
      await env.PAYMENT_CONFIG.put(key,await file.arrayBuffer(),{metadata:{contentType:file.type}});
      return json({ok:true,url:"/"+key});
    }

    if(url.pathname==="/api/media"&&request.method==="DELETE") {
      if(!(await authorized(request,env.ADMIN_PASSWORD||""))) return json({ok:false,error:"Unauthorized"},401);
      if(!env.PAYMENT_CONFIG)return json({ok:false,error:"PAYMENT_CONFIG KV binding is not configured"},503);
      const body=await request.json().catch(()=>({}));
      const value=String(body.url||"");
      if(!internalMediaUrl(value))return json({ok:false,error:"Only portal media URLs can be deleted"},400);
      await env.PAYMENT_CONFIG.delete(value.slice("/media/".length));
      return json({ok:true});
    }

    if(url.pathname==="/api/config"&&request.method==="PUT") {
      if(!(await authorized(request,env.ADMIN_PASSWORD||"")))return json({ok:false,error:"Unauthorized"},401);
      if(!env.PAYMENT_CONFIG)return json({ok:false,error:"PAYMENT_CONFIG KV binding is not configured"},503);
      const next=sanitizeConfig(await request.json());
      const previous=await getConfig(env);
      const oldMethods=[...(previous.nepal||[]),...(previous.international||[])];
      const newMethods=[...(next.nepal||[]),...(next.international||[])];
      const newIds=new Set(newMethods.map(m=>m.id));
      if(env.PAYMENT_CONFIG) {
        for(const m of oldMethods) {
          if(!newIds.has(m.id)) {
            await deleteMediaUrl(env,m.logo);
            await deleteMediaUrl(env,m.qr);
          }
        }
        for(const m of oldMethods) {
          const n=newMethods.find(x=>x.id===m.id);
          if(n) {
            if(m.logo!==n.logo) await deleteMediaUrl(env,m.logo);
            if(m.qr!==n.qr) await deleteMediaUrl(env,m.qr);
          }
        }
        if(previous.logo && previous.logo!==next.logo) await deleteMediaUrl(env,previous.logo);
      }
      await env.PAYMENT_CONFIG.put("config",JSON.stringify(next));
      return json({ok:true,config:next});
    }

    if(url.pathname.startsWith("/media/")&&request.method==="GET") {
      if(!env.PAYMENT_CONFIG)return new Response("Media storage is not configured",{status:503});
      return mediaResponse(env,url.pathname.slice(1));
    }

    return env.ASSETS.fetch(request);
  }
};
