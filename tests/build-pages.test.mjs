import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {versionHtml,versionModuleImports,versionPublicAssets} from '../build-pages.mjs';

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
