import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const match=html.match(/<script id="appearance-controller">([\s\S]*?)<\/script>/);
assert.ok(match,'O controlador de aparência precisa estar no HTML');

function start(initial=null,storageBlocked=false){
 const attributes={},events={},writes=[],buttons=[];
 let selectedInStorage=initial;
 for(const theme of ['claro','suave','areia','sepia','escuro']){
  const attrs={},listeners={};
  const button={
   dataset:{themeOption:theme},attributes:attrs,listeners,
   setAttribute:(key,value)=>{attrs[key]=value},
   addEventListener:(key,fn)=>{listeners[key]=fn}
  };
  buttons.push(button);
 }
 const menu={
  open:false,
  contains:target=>buttons.includes(target),
  querySelectorAll:()=>buttons
 };
 const document={
  readyState:'complete',
  documentElement:{setAttribute:(k,v)=>{attributes[k]=v}},
  getElementById:id=>id==='appearance-menu'?menu:null,
  addEventListener:(type,fn)=>{events[type]=fn}
 };
 const localStorage={
  getItem:()=>{if(storageBlocked)throw Error('Sem armazenamento');return selectedInStorage},
  setItem:(k,v)=>{if(storageBlocked)throw Error('Sem armazenamento');writes.push([k,v]);selectedInStorage=v}
 };
 vm.runInNewContext(match[1],{document,localStorage});
 return {attributes,events,menu,buttons,writes};
}
test('o site inicia em cinza suave sem apagar o tema já escolhido',()=>{
 assert.equal(start().attributes['data-theme'],'suave');
 assert.equal(start('sepia').attributes['data-theme'],'sepia');
 assert.equal(start('escuro').attributes['data-theme'],'escuro');
 assert.equal(start('desconhecido').attributes['data-theme'],'suave');
 assert.equal(start(null,true).attributes['data-theme'],'suave');
});
test('as cinco opções são acessíveis e alteram o tema sem recarregar',()=>{
 const app=start('claro');
 const expected=['claro','suave','areia','sepia','escuro'];
 assert.deepEqual(app.buttons.map(b=>b.dataset.themeOption),expected);
 for(const button of app.buttons){
  app.menu.open=true;
  button.listeners.click();
  assert.equal(app.attributes['data-theme'],button.dataset.themeOption);
  assert.equal(button.attributes['aria-pressed'],'true');
  assert.ok(app.buttons.filter(b=>b!==button).every(b=>b.attributes['aria-pressed']==='false'));
  assert.equal(app.menu.open,false);
 }
 assert.equal(app.writes.length,5);
 assert.equal(app.writes.at(-1)[0],'estatistica-aparencia-v1');
 assert.equal(app.writes.at(-1)[1],'escuro');
});
test('o menu fecha pelo Escape ou clique fora',()=>{
 const app=start();
 app.menu.open=true;app.events.keydown({key:'Escape'});
 assert.equal(app.menu.open,false);
 app.menu.open=true;app.events.click({target:{}});
 assert.equal(app.menu.open,false);
 app.menu.open=true;app.events.click({target:app.buttons[0]});
 assert.equal(app.menu.open,true);
});
test('largura fluida, paletas e impressão independente',()=>{
 assert.match(css,/html\[data-theme\] \.layout,\s*html\[data-theme\] \.topbar-content\s*\{\s*width:100%; max-width:none/);
 for(const theme of ['claro','suave','areia','sepia','escuro'])
  assert.ok(css.includes('html[data-theme="'+theme+'"]'),theme);
 assert.match(css,/\/\* Aparência e espaço útil de leitura[^]*?@media screen/);
 assert.match(css,/@media print\s*\{[\s\S]*?\.layout\{max-width:none;padding:0\}/);
});
