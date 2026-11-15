/** Sincronização incremental. O GitHub continua sendo a fonte central dos registros. */
const LISTS=['profiles','exams','questions','attempts','simulations','flags'];
const clone=x=>JSON.parse(JSON.stringify(x));
export function deltaSince(base,current){
 const changes={};
 for(const name of LISTS){
  const old=new Map((base?.[name]||[]).map(x=>[x.id,JSON.stringify(x)]));
  changes[name]=(current?.[name]||[]).filter(x=>old.get(x.id)!==JSON.stringify(x)).map(clone);
 }
 return changes;
}
export const hasChanges=d=>LISTS.some(k=>(d[k]||[]).length>0);
export function mergeLocal(remote,delta){
 const s=clone(remote);
 for(const name of LISTS){
  const arr=s[name]||[],pos=new Map(arr.map((v,i)=>[v.id,i]));
  for(const item of delta?.[name]||[]){
   if(pos.has(item.id))arr[pos.get(item.id)]=clone(item);
   else{pos.set(item.id,arr.length);arr.push(clone(item));}
  }
  s[name]=arr;
 }
 return s;
}
export function createSyncClient({getState,setState,notify,storage,endpoint=''}){
 const KEY='estatistica-provas-sync-base-v2',URLKEY='estatistica-provas-api-v2';
 let url=String(endpoint||storage.getItem(URLKEY)||'').trim().replace(/\/$/,'');
 let base=null,busy=false,timer=null,lastError='',lastSuccess=false;
 try{const saved=JSON.parse(storage.getItem(KEY)||'null');if(saved?.url===url)base=saved.state;}catch{}
 function status(){return !url?'local':busy?'sincronizando':lastError?'pendente':'sincronizado';}
 function show(){notify?.(status(),lastError);}
 function configure(next){
  const normalized=String(next||'').trim().replace(/\/$/,'');
  if(normalized&&!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(normalized))throw Error('Informe uma URL HTTPS válida.');
  if(normalized!==url){url=normalized;base=null;storage.removeItem(KEY);storage.setItem(URLKEY,url);lastError='';lastSuccess=false;}
  show();if(url)request(0);
 }
 function request(delay=4000){if(!url)return;clearTimeout(timer);timer=setTimeout(()=>sync().catch(()=>{}),delay);}
 async function sync(){
  if(!url||busy)return false;
  busy=true;clearTimeout(timer);show();
  const start=clone(getState()),prior=base||{profiles:[],exams:[],questions:[],attempts:[],simulations:[],flags:[]};
  const delta=deltaSince(prior,start);
  try{
   const changed=hasChanges(delta),path=changed?'/api/merge':'/api/state';
   const res=await fetch(url+path,{method:changed?'POST':'GET',headers:{'Content-Type':'application/json'},body:changed?JSON.stringify({delta}):undefined,cache:'no-store'});
   const data=await res.json();
   if(!res.ok)throw Error(data.error||'HTTP '+res.status);
   const remote=data.state||data;
   if(!remote||!Array.isArray(remote.profiles))throw Error('Resposta inválida do servidor.');
   const newer=deltaSince(start,getState());
   base=clone(remote);storage.setItem(KEY,JSON.stringify({url,state:base}));
   setState(mergeLocal(remote,newer));
   lastSuccess=true;lastError='';
   if(hasChanges(newer))request(200);
   return true;
  }catch(error){lastError=error.message||'Conexão indisponível';return false;}
  finally{busy=false;show();}
 }
 return {request,sync,configure,isConfigured:()=>Boolean(url),status,getUrl:()=>url,hasSucceeded:()=>lastSuccess};
}
