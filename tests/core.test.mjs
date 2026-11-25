import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData,parseNumbers,addProblems,reviewProblem,normalize,mergeData,relocateBook,label,addDays} from '../core.js';
const setup=()=>({...emptyData(),books:[{id:'book',name:'李正元配套习题书'},{id:'target',name:'目标书'}]});
const pos={bookId:'book',chapter:'第三章',section:'章末习题',exercise:'1',subgroup:''};
test('batch ranges, Chinese separators, fullwidth digits and duplicate input',()=>{
 assert.deepEqual(parseNumbers('３，5、8;12 – 15 5'),['3','5','8','12','13','14','15']);
});
test('invalid input never silently drops a problem',()=>{
 for(const raw of ['5-2','1-10000','0','-1','2.3','3,hello','9007199254740993'])assert.throws(()=>parseNumbers(raw));
});
test('precise location differentiates chapters, exercise and subgroup',()=>{
 const d=setup();addProblems(d,pos,'3');addProblems(d,{...pos,chapter:'第四章'},'3');addProblems(d,{...pos,exercise:'2'},'3');addProblems(d,{...pos,subgroup:'1'},'3');assert.equal(d.probs.length,4);
});
test('duplicate mastered problem is not re-added',()=>{
 const d=setup();addProblems(d,pos,'3');d.probs[0].status='mastered';assert.deepEqual(addProblems(d,pos,'3,5'),{added:1,duplicates:1});assert.equal(d.probs.length,2);
});
test('whole exercise, examples and labels',()=>{
 const d=setup();addProblems(d,{...pos,whole:true},'');assert.equal(label(d.probs[0]),'第1大题（整题）');
 addProblems(d,{...pos,exercise:'',section:'教材例题'},'25');assert.equal(label(d.probs[1]),'例25');
 assert.throws(()=>addProblems(d,{...pos,exercise:'',whole:true},''));
});
test('book positions are independent and empty chapters rejected',()=>{
 const d=setup();addProblems(d,pos,'1');addProblems(d,{...pos,bookId:'target',chapter:'第一章'},'1');assert.equal(d.positions.book.chapter,'第三章');assert.equal(d.last.bookId,'target');assert.throws(()=>addProblems(d,{...pos,chapter:''},'1'));
});
test('interval scheduling, wrong answer reset, mastery and local calendar boundaries',()=>{
 const d=setup();addProblems(d,pos,'1','2026-12-31');const p=d.probs[0];assert.equal(p.next,'2027-01-01');reviewProblem(p,true,'2027-01-01');assert.equal(p.next,'2027-01-04');reviewProblem(p,false,'2027-01-04');assert.equal(p.level,0);assert.equal(p.next,'2027-01-05');
 for(let i=0;i<5;i++)reviewProblem(p,true,'2027-01-05');assert.equal(p.status,'mastered');assert.equal(p.next,null);assert.equal(p.hist.length,7);assert.equal(addDays('2028-02-28',1),'2028-02-29');
});
const old=()=>({books:[{id:'old',name:'李习第一章第三大题1.'}],probs:[{id:'old-p',bookId:'old',number:'5',level:2,status:'active',next:'2026-12-01',created:'2026-11-20',hist:[{date:'2026-11-22',result:'correct'}],extra:'preserved'}]});
test('legacy JSON import preserves dates, levels, IDs, history and unknown fields',()=>{
 const d=normalize(old());const p=d.probs[0];assert.equal(p.id,'old-p');assert.equal(p.next,'2026-12-01');assert.equal(p.level,2);assert.equal(p.hist.length,1);assert.equal(p.extra,'preserved');assert.equal(p.chapter,'');assert.equal(d.version,4);
});
test('invalid backups rejected before any data change',()=>{
 for(const bad of [{},{books:[],probs:[{id:'p',bookId:'missing',number:'1'}]}, {...old(),books:[{id:'old',name:'a'},{id:'old',name:'b'}]}])assert.throws(()=>normalize(bad));
 const d=old();d.probs[0].hist='bad';assert.throws(()=>normalize(d));
});
test('repeat import skips identical records, conflicting IDs preserve both histories',()=>{
 const d=mergeData(setup(),old()).data;const repeat=mergeData(d,old());assert.equal(repeat.added,0);assert.equal(repeat.skipped,1);
 const different=old();different.probs[0].hist.push({date:'2026-11-25',result:'wrong'});const merged=mergeData(d,different);assert.equal(merged.data.probs.length,2);assert.notEqual(merged.data.probs[0].id,merged.data.probs[1].id);assert.equal(merged.data.probs[0].hist.length,1);assert.equal(merged.data.probs[1].hist.length,2);
});
test('conflicting book IDs do not attach imported problems to the wrong book',()=>{
 const d=setup(),incoming=old();incoming.books[0].id='book';incoming.probs[0].bookId='book';const merged=mergeData(d,incoming).data;assert.equal(merged.books.length,3);assert.notEqual(merged.probs[0].bookId,'book');
});
test('manual legacy consolidation preserves scheduling and original location',()=>{
 const d=mergeData(setup(),old()).data;const before=structuredClone(d.probs[0]);const moved=relocateBook(d,'old','book',{chapter:'第一章',section:'章末习题',exercise:'3',subgroup:'1'});assert.equal(moved,1);const p=d.probs[0];assert.equal(p.id,before.id);assert.deepEqual(p.hist,before.hist);assert.equal(p.next,before.next);assert.equal(p.level,before.level);assert.equal(p.legacyLocation.bookName,'李习第一章第三大题1.');assert.equal(label(p),'第3大题·1(5)');assert.equal(d.books.length,2);assert.throws(()=>relocateBook(d,'book','book',{}));
});
