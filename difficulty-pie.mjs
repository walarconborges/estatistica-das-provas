import {outcome} from './core.mjs';
import {CATALOGS,currentCatalog,STUDY_ALL,studyAllGroup,ALL_STUDY_DISCIPLINES,classifyForCargo} from './edital-classification.mjs';

const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent=x=>Number(x||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
const ptCompare=(a,b)=>String(a).localeCompare(String(b),'pt-BR');
const areasFor=cargo=>cargo===STUDY_ALL
 ?ALL_STUDY_DISCIPLINES.map(x=>({id:x.id,title:x.label}))
 :currentCatalog(cargo).sections.map(x=>({id:x.id,title:x.title}));

export function difficultySummary(state,profileId,cargo=STUDY_ALL,area='',getExam=()=>null){
 const general=cargo===STUDY_ALL;
 const sections=areasFor(cargo),areaByName=new Map(sections.map(x=>[x.title,x.id]));
 const names=new Map(sections.map(x=>[x.id,x.title]));
 const buckets=new Map();
 for(const q of state.questions||[]){
  if(q.status!=='active'||general&&q.originalQuestionId)continue;
  const answer=outcome(state,profileId,q);
  if(answer!=='correct'&&answer!=='wrong')continue;
  let id,section,topic,topicId;
  if(general){
   id=studyAllGroup(q);
   section=names.get(id)||'Outras disciplinas';
   topic=String(q.topic||'Assunto não identificado');
   topicId=topic;
  }else{
   const cls=classifyForCargo(q,getExam(q.examId),cargo);
   if(cls.status!=='dentro')continue;
   section=String(cls.discipline||'Não identificada');
   id=areaByName.get(section)||'extra:'+section;
   topic=String(cls.topic||'Assunto não identificado');
   topicId=String(cls.topicId||topic);
  }
  if(area&&area!==id)continue;
  const key=id+'::'+topicId;
  const row=buckets.get(key)||{id:key,areaId:id,areaName:section,topic,correct:0,wrong:0,total:0};
  row[answer]++;row.total++;buckets.set(key,row);
 }
 const rows=[...buckets.values()].map(x=>({...x,rate:100*x.correct/x.total})).sort((a,b)=>
  a.correct-b.correct||a.rate-b.rate||b.total-a.total||ptCompare(a.areaName+' '+a.topic,b.areaName+' '+b.topic));
 return {rows,hardest:rows[0]||null,belowHalf:rows.filter(x=>x.rate<50),
  totalAnswered:rows.reduce((sum,x)=>sum+x.total,0)};
}

function sectorPath(start,end,cx=110,cy=110,r=96){
 const point=a=>[cx+r*Math.cos(a*Math.PI/180),cy+r*Math.sin(a*Math.PI/180)].map(n=>+n.toFixed(4));
 const a=point(start),b=point(end);
 if(end-start>=359.999){
  const mid=point(start+180);
  return 'M '+cx+' '+cy+' L '+a[0]+' '+a[1]+' A '+r+' '+r+' 0 1 1 '+mid[0]+' '+mid[1]+
   ' A '+r+' '+r+' 0 1 1 '+b[0]+' '+b[1]+' Z';
 }
 return 'M '+cx+' '+cy+' L '+a[0]+' '+a[1]+' A '+r+' '+r+' 0 '+(end-start>180?1:0)+
  ' 1 '+b[0]+' '+b[1]+' Z';
}
export function pieSectors(rows){
 const total=rows.reduce((n,r)=>n+Math.max(0,r.total||0),0);
 if(!total)return [];
 let at=-90;
 const valid=rows.filter(r=>r.total>0);
 return valid.map((row,i)=>{
  const end=i===valid.length-1?270:at+360*row.total/total;
  const result={row,start:at,end,path:sectorPath(at,end)};at=end;return result;
 });
}

/** Apenas apresentação; resultados originais e estado sincronizado não são editados. */
export function renderDifficultyPie(state,profileId,cargo,area,getExam){
 const options=areasFor(cargo);
 const selectedArea=options.some(x=>x.id===area)?area:'';
 const results=difficultySummary(state,profileId,cargo,selectedArea,getExam);
 const option=(value,label,current)=>'<option value="'+escapeHtml(value)+'"'+(value===current?' selected':'')+'>'+escapeHtml(label)+'</option>';
 const cargos=option(STUDY_ALL,'Banco geral — todas as provas',cargo)+
  Object.entries(CATALOGS).map(([id,c])=>option(id,id+' — '+c.cargo,cargo)).join('');
 const sections=option('','Todas as áreas',selectedArea)+options.map(x=>option(x.id,x.title,selectedArea)).join('');
 const caption=cargo===STUDY_ALL?'Banco geral (sem edital)':currentCatalog(cargo).cargo+' — cargo '+cargo;
 const palette=['#91b3c6','#b6cbd9','#89b3b4','#a4bdd2','#c9d7df','#7eaaac','#a5b9c8','#bed2d0'];
 const graph=results.rows.length?pieSectors(results.rows).map(({row,path},i)=>{
  const worst=row===results.hardest;
  const color=worst?'#ba3940':row.rate<50?'#e5a34d':palette[i%palette.length];
  const label=(selectedArea?row.topic:row.areaName+' / '+row.topic)+': '+row.correct+
    ' acertos, '+row.wrong+' erros, '+row.total+' respondidas — '+percent(row.rate);
  return '<path class="stats-pie-slice'+(worst?' is-hardest':row.rate<50?' is-below-half':'')+
   '" d="'+escapeHtml(path)+'" fill="'+color+'" role="button" tabindex="0" aria-label="'+
   escapeHtml(label)+'" data-pie-slice data-description="'+escapeHtml(label)+'"><title>'+escapeHtml(label)+'</title></path>';
 }).join(''):'';
 const hardest=results.hardest;
 const hardLabel=hardest?(selectedArea?hardest.topic:hardest.areaName+' / '+hardest.topic):'';
 const detail='Passe o mouse, use Tab ou toque em uma fatia para consultar os resultados.';
 const picture=hardest
  ?'<div class="stats-pie-layout"><div class="stats-pie-figure"><svg viewBox="0 0 220 220" class="stats-pie-svg" role="group" aria-label="Gráfico de pizza por assuntos">'+graph+'</svg></div>'+
   '<div class="stats-pie-explanation"><div class="stats-pie-priority"><strong>Menos acertos: '+escapeHtml(hardLabel)+'</strong>'+
   '<div class="small-muted">'+hardest.correct+' de '+hardest.total+' corretas ('+percent(hardest.rate)+')</div></div>'+
   '<p class="stats-pie-count">'+results.belowHalf.length+' assunto(s) com aproveitamento abaixo de 50%.</p>'+
   '<div class="stats-pie-legend"><span><i class="stats-pie-dot hardest"></i>Menos acertos</span>'+
   '<span><i class="stats-pie-dot below"></i>Abaixo de 50%</span>'+
   '<span><i class="stats-pie-dot normal"></i>Outros assuntos</span></div>'+
   '<p id="stats-pie-detail" class="stats-pie-detail" aria-live="polite">'+detail+'</p></div></div>'
  :'<p class="hint">Ainda não há questões respondidas nesta seleção.</p>';
 return '<section class="card stats-pie-panel"><h2>Dificuldade por assunto — gráfico de pizza</h2>'+
  '<p class="hint">A área das fatias indica quantas questões foram respondidas por assunto; as cores destacam a dificuldade.</p>'+
  '<div class="stats-pie-controls"><div class="field"><label for="stats-cargo">Edital / referência</label>'+
  '<select id="stats-cargo" name="statsCargo">'+cargos+'</select></div>'+
  '<div class="field"><label for="stats-area">Área do edital / disciplina</label>'+
  '<select id="stats-area" name="statsArea">'+sections+'</select></div></div>'+
  '<div class="small-muted stats-pie-scope">'+escapeHtml(caption)+' · '+results.totalAnswered+
  ' respostas por assunto · '+results.rows.length+' assunto(s)</div>'+picture+'</section>';
}
