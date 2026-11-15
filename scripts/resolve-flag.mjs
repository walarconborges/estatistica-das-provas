/** A aprovação ocorre exclusivamente por comentário "aprovar" ou "rejeitar" do proprietário no GitHub. */
import {makeCode,codePart} from '../core.mjs';
const token=process.env.GH_TOKEN,repo=process.env.REPOSITORY;
const number=Number(process.env.ISSUE_NUMBER),decision=String(process.env.DECISION||'').trim().toLowerCase();
if(!token||!repo||!Number.isInteger(number)||!['aprovar','rejeitar'].includes(decision))throw Error('Parâmetros administrativos inválidos.');
const head={Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'};
async function api(path,init={}){
 const r=await fetch('https://api.github.com/repos/'+repo+'/'+path,{...init,headers:{...head,...init.headers}});
 const data=await r.json().catch(()=>({}));if(!r.ok)throw Error('GitHub '+path+': '+r.status);
 return data;
}
function applyReview(state,flag){
 const q=state.questions.find(x=>x.id===flag.questionId);
 if(!q)throw Error('Questão não encontrada.');
 const p=flag.proposed||{};
 if(flag.type==='classification'){
  if(!p.discipline||!p.topic)throw Error('Classificação sugerida incompleta.');
  const old=q.code;
  q.discipline=String(p.discipline).slice(0,100);q.topic=String(p.topic).slice(0,100);
  q.disciplineCode=codePart(p.disciplineCode||p.discipline);q.topicCode=codePart(p.topicCode||p.topic);
  const code=makeCode(state,{year:q.year,banca:q.banca,orgao:q.orgao},q);
  // Mantém o código se a alteração for apenas descritiva, sem modificar a sigla.
  const originalPrefix='Q'+codePart(q.year,'0000')+codePart(q.disciplineCode)+codePart(q.topicCode)+codePart(q.banca)+codePart(q.orgao);
  if(!old.startsWith(originalPrefix)){q.aliases=[...new Set([...(q.aliases||[]),old])];q.code=code;}
 }else if(flag.type==='secondary'){
  if(!p.discipline||!p.topic)throw Error('Classificação secundária incompleta.');
  q.secondary||=[];
  if(!q.secondary.some(x=>x.discipline===p.discipline&&x.topic===p.topic))q.secondary.push({discipline:String(p.discipline).slice(0,100),topic:String(p.topic).slice(0,100)});
 }else if(flag.type==='answer'){
  if(!/^[A-E]$/.test(p.answer||''))throw Error('Gabarito inválido.');
  q.answer=p.answer;
 }else if(flag.type==='annulled'||flag.type==='outdated'){
  q.status=flag.type;
 }
}
const issue=await api('issues/'+number);
const match=String(issue.body||'').match(/<!-- flag-id:([A-Za-z0-9_-]{3,100}) -->/);
if(!match)throw Error('Esta Issue não representa uma sinalização reconhecida pelo sistema.');
const id=match[1];
let completed=false,cacheToInvalidate=null;
for(let tries=0;tries<5;tries++){
 const file=await api('contents/data/state.json');
 const state=JSON.parse(Buffer.from(String(file.content).replace(/\s/g,''),'base64').toString('utf8'));
 const flag=state.flags.find(x=>x.id===id);
 if(!flag)throw Error('Sinalização não encontrada no banco.');
 if(flag.status!=='pending'){completed=true;break;}
 if(decision==='aprovar'){
  applyReview(state,flag);
  if(['explanation','answer','annulled','outdated'].includes(flag.type))cacheToInvalidate=flag.questionId;
 }
 flag.status=decision==='aprovar'?'approved':'rejected';flag.resolvedAt=new Date().toISOString();
 const content=Buffer.from(JSON.stringify(state,null,2)+'\n').toString('base64');
 const res=await fetch('https://api.github.com/repos/'+repo+'/contents/data/state.json',{method:'PUT',headers:head,body:JSON.stringify({message:'review: '+decision+' '+id,content,sha:file.sha})});
 if(res.ok){completed=true;break;}
 if(![409,422].includes(res.status))throw Error('Não foi possível atualizar o banco: HTTP '+res.status);
}
if(!completed)throw Error('Conflito de gravação persistente.');
if(decision==='aprovar'&&cacheToInvalidate){
 // Explicação sinalizada/alterada só poderá ser reutilizada após nova geração.
 const path='contents/data/explanations/'+encodeURIComponent(cacheToInvalidate)+'.json';
 const base='https://api.github.com/repos/'+repo+'/';
 const stored=await fetch(base+path,{headers:head});
 if(stored.ok){
  const details=await stored.json();
  const deleted=await fetch(base+path,{method:'DELETE',headers:head,
   body:JSON.stringify({message:'ai: invalidar explicação após revisão',sha:details.sha})});
  if(!deleted.ok&&deleted.status!==404)throw Error('Não foi possível invalidar o cache da explicação ('+deleted.status+').');
 }else if(stored.status!==404)throw Error('Não foi possível verificar o cache da explicação.');
}
await api('issues/'+number+'/comments',{method:'POST',body:JSON.stringify({body:decision==='aprovar'?'Sinalização aprovada e registrada. As estatísticas serão recalculadas na próxima sincronização.':'Sinalização rejeitada. A questão permanece inalterada.'})});
await api('issues/'+number,{method:'PATCH',body:JSON.stringify({state:'closed'})});
