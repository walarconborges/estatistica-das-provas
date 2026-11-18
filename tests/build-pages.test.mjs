import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {versionHtml,versionModuleImports,versionPublicAssets,verifyPublicAssets} from '../build-pages.mjs';

const sha='0123456789abcdef0123456789abcdef01234567';
test('HTML carrega a versão atual do leitor e do CSS, não só o rodapé',()=>{
 const html='<link rel="stylesheet" href="./styles.css"><script src="./config.js"></script>'+
 '<script type="module" src="./app.mjs"></script><footer>Versão experimental 0.6.17</footer>';
 const transformed=versionHtml(html,sha);
 for(const file of ['styles.css','config.js','app.mjs']){
  assert.ok(transformed.includes('./'+file+'?v='+sha),file);
 }
 assert.match(transformed,/Versão experimental 0.6.17/);
 assert.doesNotMatch(transformed,/\b(?:src|href)="\.\/(?:app\.mjs|styles\.css|config\.js)"/);
});
test('modules do leitor não continuam em cache depois que o HTML muda',()=>{
 const source=[
  "import {readPdf} from './pdf-import.mjs';",
  "import {chosenAnswerSection} from './pdf-layout.mjs';",
  "import {parseKey} from './core.mjs';",
  "import('./other.mjs')",
  "import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs')"
 ].join('\n');
 const result=versionModuleImports(source,sha);
 for(const file of ['pdf-import.mjs','pdf-layout.mjs','core.mjs'])
  assert.ok(result.includes('./'+file+'?v='+sha),file);
 assert.ok(result.includes("import('./other.mjs')"));
 assert.ok(result.includes("import('https://cdn.jsdelivr.net"));
 assert.notEqual(versionModuleImports(source,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),result);
});
test('publicação versiona toda a cadeia de módulos sem alterar os originais',()=>{
 const dir=mkdtempSync(join(tmpdir(),'site-assets-'));
 try{
  writeFileSync(join(dir,'index.html'),'<script type="module" src="./app.mjs"></script>');
  writeFileSync(join(dir,'app.mjs'),"import {x} from './pdf-import.mjs';");
  writeFileSync(join(dir,'pdf-import.mjs'),"import {y} from './pdf-layout.mjs';");
  writeFileSync(join(dir,'pdf-layout.mjs'),'export const y=3;');
  writeFileSync(join(dir,'data.txt'),'não versionar');
  versionPublicAssets(dir,sha);
  assert.match(readFileSync(join(dir,'index.html'),'utf8'),new RegExp('app\\.mjs\\?v='+sha));
  assert.match(readFileSync(join(dir,'app.mjs'),'utf8'),new RegExp('pdf-import\\.mjs\\?v='+sha));
  assert.match(readFileSync(join(dir,'pdf-import.mjs'),'utf8'),new RegExp('pdf-layout\\.mjs\\?v='+sha));
  assert.equal(readFileSync(join(dir,'data.txt'),'utf8'),'não versionar');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('SHA inválido não produz URL de produção',()=>{
 assert.throws(()=>versionHtml('<script src="./app.mjs"></script>','0.6.17'),/Revision inválida/);
 assert.throws(()=>versionModuleImports("import x from './core.mjs'",'x'),/Revision inválida/);
});

test('sobrescreve query de versão antiga sem deixar módulos presos no cache',()=>{
 const html='<script type="module" src="./app.mjs?v=0.6.39"></script><link href="./styles.css?v=0.6.37" rel="stylesheet">';
 const app="import {x} from './core.mjs?v=0.6.37';";
 assert.match(versionHtml(html,sha),new RegExp('app\\\\.mjs\\\\?v='+sha));
 assert.match(versionHtml(html,sha),new RegExp('styles\\\\.css\\\\?v='+sha));
 assert.match(versionModuleImports(app,sha),new RegExp('core\\\\.mjs\\\\?v='+sha));
 assert.doesNotMatch(versionHtml(html,sha),/0\\.6\\.39|0\\.6\\.37/);
});
test('publicação falha explicitamente se módulo importado não foi copiado',()=>{
 const dir=mkdtempSync(join(tmpdir(),'site-missing-imports-'));
 try{
  writeFileSync(join(dir,'index.html'),'<script type="module" src="./app.mjs"></script>');
  writeFileSync(join(dir,'app.mjs'),"import {x} from './assertion-guide.mjs';\\nimport {y} from './answer-display-cache.mjs';");
  assert.throws(()=>verifyPublicAssets(dir),/assertion-guide\\.mjs.*answer-display-cache\\.mjs/);
  assert.throws(()=>versionPublicAssets(dir,sha),/Publicação bloqueada/);
  writeFileSync(join(dir,'assertion-guide.mjs'),'export const x=1;');
  writeFileSync(join(dir,'answer-display-cache.mjs'),'export const y=2;');
  assert.equal(verifyPublicAssets(dir),true);
  assert.doesNotThrow(()=>versionPublicAssets(dir,sha));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('workflow de Pages inclui dependências do leitor',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');
 assert.match(workflow,/assertion-guide\\.mjs/);
 assert.match(workflow,/answer-display-cache\\.mjs/);
});
