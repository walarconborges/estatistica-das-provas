/**
 * A publicação do HTML deve obrigatoriamente invalidar o cache de TODOS
 * os módulos ES. Atualizar só o rodapé não invalida imports em cache
 * (app.mjs -> pdf-layout.mjs), resultando em UI nova + parser antigo.
 * Gera URLs versionadas exclusivamente nos arquivos de public/.
 */
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function versionHtml(source,revision){
 const version=encodeURIComponent(String(revision));
 if(!/^[a-f0-9]{7,64}$/i.test(String(revision)))throw Error('Revision inválida');
 return source.replace(/((?:src|href)=["'])(\.\/(?:[\w-]+\.(?:mjs|js|css)))(["'])/g,
  (match,open,url,close)=>open+url+'?v='+version+close);
}
export function versionModuleImports(source,revision){
 const version=encodeURIComponent(String(revision));
 if(!/^[a-f0-9]{7,64}$/i.test(String(revision)))throw Error('Revision inválida');
 return source.replace(/(\bfrom\s*["'])(\.\/[\w./-]+\.mjs)(["'])/g,
  (match,open,url,close)=>open+url+'?v='+version+close);
}
export function versionPublicAssets(directory,revision){
 for(const name of readdirSync(directory)){
  if(!/^(?:index\.html|[\w-]+\.mjs)$/.test(name))continue;
  const file=resolve(directory,name),contents=readFileSync(file,'utf8');
  const newer=name==='index.html'
   ?versionHtml(contents,revision)
   :versionModuleImports(contents,revision);
  if(newer===contents&&name==='index.html')throw Error('Nenhum asset versionado no HTML');
  writeFileSync(file,newer);
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [, ,directory,revision]=process.argv;
 if(!directory||!revision)throw Error('Uso: node build-pages.mjs public SHA');
 versionPublicAssets(directory,revision);
}
