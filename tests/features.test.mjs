import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarize} from '../analytics.js';
import {THEMES,colorSettings} from '../appearance.js';
import {GistClient,DATA_FILE,REMINDER_FILE,readCloudData,reminderDecision,gistId} from '../cloud.js';
test('dashboard uses actual history, calendar week and overdue-inclusive forecast',()=>{
 const data={books:[{id:'b',name:'书'}],probs:[
 {bookId:'b',status:'active',next:'2026-11-20',created:'2026-11-23',hist:[{date:'2026-11-23',result:'correct'},{date:'2026-11-26',result:'wrong'}]},
 {bookId:'b',status:'active',next:'2026-11-27',created:'2026-11-22',hist:[{date:'2026-11-22',result:'correct'}]},
 {bookId:'b',status:'mastered',next:null,created:'2026-11-24',hist:[{date:'2026-11-25',result:'correct'}]}]};
 const s=summarize(data,'2026-11-26');assert.equal(s.total,3);assert.equal(s.mastered,1);assert.equal(s.active,2);assert.equal(s.due,1);assert.equal(s.mastery,33);assert.deepEqual(s.weekly,{reviews:3,accuracy:67,added:2});assert.equal(s.forecast[1].count,1);assert.equal(s.heat.length,28);assert.equal(s.heat[0].date,'2026-10-30');assert.equal(s.heat.at(-1).count,1);assert.equal(s.books[0].percent,33);
});
test('empty stats have zero totals without invented activity or divide-by-zero',()=>{const s=summarize({books:[],probs:[]},'2026-11-26');assert.equal(s.weekly.accuracy,null);assert.equal(s.mastery,0);assert.equal(s.heat.reduce((n,h)=>n+h.count,0),0);});
test('all six themes and custom colors expose safe CSS variables',()=>{assert.equal(THEMES.length,6);for(const color of [...THEMES.map(t=>t.color),'#ffffff','#000000','#e2fa00'])for(const dark of [true,false]){const vars=colorSettings(color,dark);assert.equal(vars['--accent'],color);assert.match(vars['--accent-soft'],/^#[a-f0-9]{6}$/i);assert.ok(['#101826','#ffffff'].includes(vars['--on-accent']));}assert.throws(()=>colorSettings('red;display:none'));});
test('cloud writes isolated file names and never includes tokens in backup payload',async()=>{
 const calls=[],fetcher=async(url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>({id:'abcdef12345'})};};
 const client=new GistClient('test-only-credential',fetcher);await client.create({books:[],probs:[]});await client.upload('abcdef12345',{books:[],probs:[]});await client.reminder('abcdef12345',{enabled:false});
 const create=JSON.parse(calls[0].opts.body);assert.equal(create.public,false);assert.ok(create.files[DATA_FILE]);assert.equal(create.files['mistake-review.json'],undefined);assert.ok(JSON.parse(calls[2].opts.body).files[REMINDER_FILE]);assert.equal(calls.some(c=>c.opts.body.includes('test-only-credential')),false);assert.equal(calls.every(c=>c.url.startsWith('https://api.github.com/gists')),true);
});
test('cloud parses legacy backup but refuses truncated or invalid files',()=>{
 assert.equal(readCloudData({files:{'mistake-review.json':{content:'{"books":[],"probs":[]}'}}}).books.length,0);
 assert.throws(()=>readCloudData({files:{[DATA_FILE]:{truncated:true}}}));assert.throws(()=>readCloudData({files:{}}));assert.equal(gistId('https://gist.github.com/person/abcde12345'),'abcde12345');assert.throws(()=>gistId('../secret'));
});
test('cloud HTTP errors do not expose credentials or raw provider responses',async()=>{const client=new GistClient('test-only-credential',async()=>({ok:false,status:401}));await assert.rejects(()=>client.get('abcde12345'),e=>!e.message.includes('test-only-credential')&&e.message.includes('无效'));});
test('background reminders use sending date and most recently uploaded problem schedule',()=>{
 const cfg={enabled:true,subscription:{endpoint:'https://push.example/sub'},tz:'Asia/Shanghai',time:'20:00'};
 const data={probs:[{status:'active',next:'2026-11-25'},{status:'active',next:'2026-11-26'},{status:'active',next:'2026-11-27'},{status:'mastered',next:null}]};
 assert.equal(reminderDecision(cfg,data,new Date('2026-11-26T11:59:00Z')).send,false);
 assert.deepEqual(reminderDecision(cfg,data,new Date('2026-11-26T12:00:00Z')),{send:true,date:'2026-11-26',count:2});
 assert.equal(reminderDecision({...cfg,lastSent:'2026-11-26'},data,new Date('2026-11-26T13:00:00Z')).send,false);
 assert.equal(reminderDecision({...cfg,enabled:false},data).send,false);
});
