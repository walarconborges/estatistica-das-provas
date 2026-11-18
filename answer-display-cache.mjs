/**
 * Conserva respostas recém-conferidas na visualização da aba atual.
 *
 * A sincronização pode substituir o estado e reconstruir o HTML da questão.
 * Este cache NÃO substitui os registros oficiais de tentativas: apenas mantém
 * a alternativa selecionada e o feedback até a página ser recarregada.
 */
export function createAnswerDisplayCache(){
 const recent=new Map();
 const key=(profileId,questionId)=>JSON.stringify([String(profileId||''),String(questionId||'')]);
 return {
  remember(profileId,questionId,answer){
   if(!profileId||!questionId||!/^[A-E]$/.test(String(answer||'')))return false;
   recent.set(key(profileId,questionId),{answer,at:new Date().toISOString()});
   return true;
  },
  displayed(profileId,questionId,lastFromHistory=null){
   return recent.get(key(profileId,questionId))||lastFromHistory;
  },
  selected(profileId,questionId){
   return recent.get(key(profileId,questionId))?.answer||'';
  }
 };
}
