import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import vm from 'node:vm';
test('offline cache installs only existing local assets and serves cached app without network',async()=>{
 const listeners={}, cached=new Map(),root=new URL('../',import.meta.url);let network=0,activations=0;
 const cache={addAll:async paths=>{for(const path of paths){assert.match(path,/\?v=mistake-next-v[\d.]+$/);const file=path.split('?')[0];if(file==='./'){await access(new URL('index.html',root));}else await access(new URL(file,root));cached.set(path,{url:path});}},match:async(req,options)=>{const key=typeof req==='string'?req:req.path;if(options?.ignoreSearch)return [...cached].find(([path])=>path.split('?')[0]===key.split('?')[0])?.[1];return cached.get(key);}};
 const context={URL,self:{location:{origin:'https://example.test'},registration:{scope:'https://example.test/mistake-review-next/'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>listeners[name]=fn},caches:{open:async()=>cache,keys:async()=>['shiti-v1.0.0','unrelated-site'],delete:async k=>{assert.notEqual(k,'unrelated-site');}},fetch:async()=>{network++;throw new Error('offline');}};
 vm.runInNewContext(await readFile(new URL('sw.js',root),'utf8'),context);
 context.self.skipWaiting=async()=>activations++;
 let update;listeners.message({data:{type:'unrelated'},waitUntil:p=>update=p});assert.equal(activations,0);
 listeners.message({data:{type:'ACTIVATE_UPDATE'},waitUntil:p=>update=p});await update;assert.equal(activations,1);
 let install;listeners.install({waitUntil:p=>install=p});await install;
 let activation;listeners.activate({waitUntil:p=>activation=p});await activation;
 for(const path of ['./','./app.js','./core.js','./style.css']){let response;listeners.fetch({request:{url:`https://example.test/mistake-review-next/${path.slice(2)}`,method:'GET',mode:path==='./'?'navigate':'cors',path},respondWith:p=>response=p});assert.ok(await response);}
 assert.equal(network,0);
 let fallback;listeners.fetch({request:{url:'https://example.test/mistake-review-next/missing-page',method:'GET',mode:'navigate',path:'./missing-page'},respondWith:p=>fallback=p});assert.ok(await fallback);
});
