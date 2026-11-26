import {today,addDays} from './core.js';
export function summarize(data,date=today()){
 const total=data.probs.length,mastered=data.probs.filter(p=>p.status==='mastered').length;
 const active=data.probs.filter(p=>p.status==='active');
 const due=active.filter(p=>p.next&&p.next<=date);
 const [y,m,d]=date.split('-').map(Number),weekDay=new Date(y,m-1,d,12).getDay();
 const monday=addDays(date,-((weekDay+6)%7));
 const history=data.probs.flatMap(p=>p.hist||[]).filter(h=>h.date>=monday&&h.date<=date);
 const heat=Array.from({length:28},(_,i)=>({date:addDays(date,i-27),count:0}));
 const heatMap=new Map(heat.map(h=>[h.date,h]));
 for(const p of data.probs)for(const h of p.hist||[])if(heatMap.has(h.date))heatMap.get(h.date).count++;
 return {total,mastered,active:active.length,mastery:total?Math.round(mastered/total*100):0,due:due.length,
   weekly:{reviews:history.length,accuracy:history.length?Math.round(history.filter(h=>h.result==='correct').length/history.length*100):null,added:data.probs.filter(p=>p.created>=monday&&p.created<=date).length},
   forecast:Array.from({length:7},(_,i)=>{const dt=addDays(date,i);return {date:dt,count:i===0?due.length:active.filter(p=>p.next===dt).length};}),heat,
   books:data.books.map(b=>{const ps=data.probs.filter(p=>p.bookId===b.id),mastered=ps.filter(p=>p.status==='mastered').length;return {...b,total:ps.length,mastered,percent:ps.length?Math.round(mastered/ps.length*100):0};})};
}
