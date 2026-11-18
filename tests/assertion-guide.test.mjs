import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {splitAssertionItems} from '../assertion-guide.mjs';

const caseStudy=[
 'A ferramenta Limpeza de Disco do Windows oferece diversas opções para liberar espaço.',
 'Acerca das opções disponíveis e seus riscos, marque V, para as afirmativas verdadeiras, e F, para as falsas.',
 '(__) A opção "Instalações anteriores do Windows" (pasta Windows.old) remove arquivos antigos e impede reverter a versão.',
 '(__) A limpeza de "Arquivos temporários" apaga dados da Lixeira.',
 '(__) O "Cache de Sombreamento do DirectX" pode acelerar aplicações 3D.',
 '(__) A limpeza de "Pacotes de driver de dispositivo" remove drivers atualmente em uso.',
 'Após análise, assinale a alternativa que apresenta a sequência correta dos itens acima:'
].join('\n');

test('Q2025TI11021: quatro assertivas em linhas independentes, sem mexer no texto original',()=>{
 const q={code:'Q2025TI11021',stem:caseStudy,answer:'A',
  options:[{letter:'A',text:'V, F, V, F.'},{letter:'B',text:'F, F, V, V.'}]};
 const before=JSON.stringify(q);
 const parsed=splitAssertionItems(q.stem);
 assert.equal(parsed.kind,'blanks');
 assert.equal(parsed.items.length,4);
 assert.deepEqual(parsed.items.map(i=>i.label),['1','2','3','4']);
 assert.match(parsed.intro,/marque V/);
 assert.match(parsed.items[0].text,/Windows\.old/);
 assert.match(parsed.items[3].text,/Pacotes de driver/);
 assert.match(parsed.outro,/Após análise/);
 assert.equal(JSON.stringify(q),before);
 assert.equal(q.answer,'A');
});
test('identifica dois ou mais itens romanos, inclusive além de VI',()=>{
 const stem='Julgue: I. Item um. II. Item dois. III. Item três. IV. Item quatro. V. Item cinco. VI. Item seis. VII. Item sete. VIII. Item oito. Assinale a alternativa correta.';
 const r=splitAssertionItems(stem);
 assert.equal(r.kind,'roman');
 assert.equal(r.items.length,8);
 assert.equal(r.items[7].label,'VIII');
 assert.match(r.outro,/Assinale a alternativa/);
});
test('reconhece romanos colados ao texto em PDFs extraídos',()=>{
 const stem='Analise as afirmativas: I.No primeiro caso, é verdadeiro. II.A segunda proposição é falsa. III.O terceiro caso é verdadeiro. Estão corretas as afirmativas:';
 const r=splitAssertionItems(stem);
 assert.equal(r.kind,'roman');
 assert.equal(r.items.length,3);
 assert.match(r.items[0].text,/No primeiro/);
 assert.match(r.outro,/Estão corretas/);
});
test('reconhece letras minúsculas, maiúsculas e números com separadores distintos',()=>{
 const samples=[
  ['Analise: a) Primeira assertiva. b) Segunda assertiva. c) Terceira assertiva.','letter',['a','b','c']],
  ['Julgue: A - Primeira assertiva. B - Segunda assertiva. C - Terceira assertiva.','letter',['A','B','C']],
  ['Considere: 1. Primeira frase. 2. Segunda frase. 3. Terceira frase.','number',['1','2','3']],
  ['Julgue: (I) Primeira frase. (II) Segunda frase. (III) Terceira frase.','roman',['I','II','III']]
 ];
 for(const [stem,type,labels] of samples){
  const r=splitAssertionItems(stem);
  assert.equal(r?.kind,type,stem);
  assert.deepEqual(r?.items.map(i=>i.label),labels,stem);
 }
});
test('não reorganiza questões comuns, variáveis soltas ou associação de colunas',()=>{
 const invalid=[
  'O Windows 10.0 tem diferentes configurações de sistema operacional. Assinale a alternativa correta.',
  'A expressão m(2) + m(1) deve ser calculada. Qual é o resultado correto?',
  'Considere a fórmula composta: Q. R. Indique a alternativa correspondente.',
  'Relacione a Coluna I com a Coluna II: A) Primeira classe. B) Segunda classe. C) Terceira classe.',
  'Computador 1 Computador 2 Ordem de boot 1) USB 2) HD 1) HD 2) USB.'
 ];
 for(const stem of invalid)assert.equal(splitAssertionItems(stem),null,stem);
});
test('interface oferece campos individuais de um caractere e não altera o gabarito',()=>{
 const html=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 const style=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
 assert.match(html,/splitAssertionItems\(q\?\.stem\)/);
 assert.match(html,/data-assertion-note/);
 assert.match(html,/maxlength="1"/);
 assert.match(html,/ASSERTION_STORE/);
 assert.match(html,/assertionSignature/);
 assert.match(html,/renderAssertionBody\(q\)/);
 assert.match(html,/recordAssertionMark\(e\.target\)/);
 assert.match(style,/\.assertion-row/);
 assert.match(style,/@media print\{\s*\.assertion-guide/);
});

test('itens I, II e III de ética aparecem em linhas separadas com comando final',()=>{
 const s=JSON.parse(readFileSync(new URL('../data/state.json',import.meta.url),'utf8'));
 const q=s.questions.find(q=>q.code==='Q2025TI14019');
 const parsed=splitAssertionItems(q.stem);
 assert.ok(parsed);assert.equal(parsed.items.length,3);assert.match(parsed.outro,/Diante das assertivas/i);
});
