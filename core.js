export const INTERVALS = [1, 3, 7, 14, 30];
export const uid = () => globalThis.crypto.randomUUID();
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function addDays(date, days) {
  const [y,m,d] = date.split('-').map(Number);
  const dt = new Date(y,m-1,d+days,12);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}
export const emptyData = () => ({version:4, books:[], probs:[], last:{}, positions:{}});
export const clean = value => String(value ?? '').trim();
export function locationKey(p) {
  return JSON.stringify([p.bookId, p.chapter || '', p.section || '', p.exercise || '', p.subgroup || '', String(p.number)]);
}
export function parseNumbers(raw) {
  const text = clean(raw).replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0)-65248)).replace(/\s*[-–—~～至]\s*/g,'-');
  if (!text) return [];
  const parts = text.split(/[,，、;；\s]+/).filter(Boolean);
  const result = [];
  for (const part of parts) {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const start = Number(range[1]), end = Number(range[2]);
      if (!Number.isSafeInteger(end) || start < 1 || end < start || end-start > 499) throw new Error('范围应从小到大，每段最多 500 题。');
      for (let n=start;n<=end;n++) result.push(String(n));
    } else if (/^\d+$/.test(part) && Number(part)>0 && Number.isSafeInteger(Number(part))) result.push(String(Number(part)));
    else throw new Error(`无法识别“${part}”。请输入 3, 5, 8, 12–15 这样的题号。`);
    if (result.length>1000) throw new Error('一次最多录入 1000 道题。');
  }
  return [...new Set(result)];
}
export function addProblems(data, position, raw, date=today()) {
  if (!data.books.some(b=>b.id===position.bookId)) throw new Error('请先添加或选择一本书。');
  const pos = {bookId:position.bookId, chapter:clean(position.chapter), section:clean(position.section), exercise:clean(position.exercise), subgroup:clean(position.subgroup)};
  if (!pos.chapter) throw new Error('请填写章节，例如：第三章。');
  const whole = position.whole === true;
  if (whole && !pos.exercise) throw new Error('记录整道大题时，请填写大题号。');
  const nums = whole ? [''] : parseNumbers(raw);
  if (!nums.length) throw new Error('请填写小题号或选择“整道大题”。');
  const existing = new Set(data.probs.map(locationKey));
  let added=0, duplicates=0;
  for (const number of nums) {
    const p={...pos,number,id:uid(),created:date,createdAt:new Date().toISOString(),level:0,next:addDays(date,1),status:'active',hist:[]};
    const key=locationKey(p);
    if(existing.has(key)) { duplicates++; continue; }
    data.probs.push(p); existing.add(key); added++;
  }
  data.last={...pos,whole}; data.positions ||= {}; data.positions[pos.bookId]={...data.last};
  return {added,duplicates};
}
export function reviewProblem(p, correct, date=today()) {
  p.hist.push({date,result:correct?'correct':'wrong'});
  p.level=correct?Math.min(p.level+1,5):0;
  p.status=p.level===5?'mastered':'active';
  p.next=p.status==='mastered'?null:addDays(date,INTERVALS[p.level]);
}
export function label(p) {
  const ex = p.exercise ? `第${p.exercise}大题` : '';
  const sub = p.subgroup ? `·${p.subgroup}` : '';
  const n = p.number!=='' ? (p.exercise?`(${p.number})`:`${p.section==='教材例题'?'例':'题'}${p.number}`) : '（整题）';
  return `${ex}${sub}${n}`;
}
export function normalize(input) {
  if (!input || !Array.isArray(input.books) || !Array.isArray(input.probs)) throw new Error('文件应包含 books 和 probs 数组。');
  const copy=JSON.parse(JSON.stringify(input));
  const ids=new Set();
  for(const b of copy.books) {
    if(!b || typeof b.id!=='string' || !b.id || typeof b.name!=='string' || !b.name.trim() || ids.has(b.id)) throw new Error('图书数据不完整或编号重复。');
    ids.add(b.id);
  }
  const pids=new Set();
  const datePattern=/^\d{4}-\d{2}-\d{2}$/;
  for(const p of copy.probs) {
    if(!p || typeof p.id!=='string' || pids.has(p.id) || !ids.has(p.bookId) || !['string','number'].includes(typeof p.number)) throw new Error('题目数据不完整、编号重复或缺少所属图书。');
    pids.add(p.id); p.number=String(p.number);
    if(p.hist!=null && !Array.isArray(p.hist)) throw new Error('复习历史格式错误。');
    p.hist ||= []; p.level ??= 0; p.status ||= 'active'; p.created ||= today(); p.next ??= null;
    if(!Number.isInteger(p.level) || p.level<0 || p.level>5 || !['active','mastered'].includes(p.status) || !datePattern.test(p.created) || (p.next!==null && !datePattern.test(p.next))) throw new Error('复习状态或日期格式错误。');
    if(p.hist.some(h=>!h || !datePattern.test(h.date) || !['correct','wrong'].includes(h.result))) throw new Error('复习历史格式错误。');
    for(const field of ['chapter','section','exercise','subgroup']) p[field]=clean(p[field]);
  }
  return {...copy,version:4,last:copy.version===4?copy.last||{}:{},positions:copy.version===4?copy.positions||{}:{}};
}
export function mergeData(current, incoming) {
  const result=normalize(current), source=normalize(incoming), map=new Map();
  for(const b of source.books) {
    let target=result.books.find(x=>x.id===b.id && x.name===b.name);
    if(!target) {
      target={...b,id:result.books.some(x=>x.id===b.id)?uid():b.id};
      result.books.push(target);
    }
    map.set(b.id,target.id);
  }
  let added=0, skipped=0;
  for(const original of source.probs) {
    const p={...original,bookId:map.get(original.bookId)};
    const same=result.probs.find(x=>x.id===p.id);
    if(same && JSON.stringify(same)===JSON.stringify(p)) {skipped++;continue;}
    if(same) p.id=uid(); // Preserve both histories on an ID conflict; never overwrite.
    result.probs.push(p);added++;
  }
  return {data:result,added,skipped};
}
export function relocateBook(data, sourceId, targetId, position) {
  if(sourceId===targetId) throw new Error('请选择另一本目标图书。');
  if(!data.books.some(b=>b.id===sourceId) || !data.books.some(b=>b.id===targetId)) throw new Error('找不到图书。');
  if(!clean(position.chapter)) throw new Error('请填写目标章节。');
  let moved=0;
  for(const p of data.probs.filter(p=>p.bookId===sourceId)) {
    p.legacyLocation ||= {bookId:p.bookId,bookName:data.books.find(b=>b.id===sourceId).name,chapter:p.chapter,section:p.section,exercise:p.exercise,subgroup:p.subgroup,number:p.number};
    p.bookId=targetId;
    for(const k of ['chapter','section','exercise','subgroup']) p[k]=clean(position[k]);
    moved++;
  }
  data.books=data.books.filter(b=>b.id!==sourceId);
  if(data.last.bookId===sourceId) data.last={};
  delete data.positions?.[sourceId];
  return moved;
}
