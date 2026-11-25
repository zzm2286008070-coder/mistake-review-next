import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
test('offline cache installs only existing local assets and serves cached app without network',async()=>{
 const listeners={}, cached=new Map(),root=new URL('../',import.meta.url);let network=0;
 const cache={addAll:async paths=>{for(const path of paths){if(path==='./'){await access(new URL('index.html',root));}else await access(new URL(path,root));cached.set(path,{url:path});}},match:async(req)=>cached.get(typeof req==='string'?req:req.path)};
 const context={URL,self:{location:{origin:'https://example.test'},registration:{scope:'https://example.test/mistake-review-next/'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>listeners[name]=fn},caches:{open:async()=>cache,keys:async()=>['shiti-v1.0.0','unrelated-site'],delete:async k=>{assert.notEqual(k,'unrelated-site');}},fetch:async()=>{network++;throw new Error('offline');}};
 vm.runInNewContext(await readFile(new URL('sw.js',root),'utf8'),context);
 let install;listeners.install({waitUntil:p=>install=p});await install;
 let activation;listeners.activate({waitUntil:p=>activation=p});await activation;
 for(const path of ['./','./app.js','./core.js','./style.css']){let response;listeners.fetch({request:{url:`https://example.test/mistake-review-next/${path.slice(2)}`,method:'GET',mode:path==='./'?'navigate':'cors',path},respondWith:p=>response=p});assert.ok(await response);}
 assert.equal(network,0);
});
