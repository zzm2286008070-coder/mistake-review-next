import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appearanceSettings,validColor,THEMES} from '../appearance.js';
test('old theme preferences still work and preset themes color the page background',()=>{
 assert.equal(appearanceSettings({color:'#4f7fe5',dark:false})['--paper'],'#f5f3f0');
 assert.equal(appearanceSettings({color:'#8056d9',dark:false})['--paper'],THEMES.find(t=>t.id==='purple').background);
});
test('custom background is independent of accent and survives preference serialization',()=>{
 const saved=JSON.parse(JSON.stringify({color:'#8056d9',backgroundLight:'#ffe9b5',backgroundDark:'#271b39',dark:false}));
 const light=appearanceSettings(saved);assert.equal(light['--paper'],'#ffe9b5');assert.equal(light['--accent'],'#8056d9');
 const dark=appearanceSettings({...saved,dark:true});assert.equal(dark['--paper'],'#271b39');
 assert.equal(appearanceSettings({...saved,color:'#4f7fe5'})['--paper'],'#ffe9b5');
});
test('arbitrary dark backgrounds keep outside-card headings readable',()=>{
 assert.equal(appearanceSettings({backgroundLight:'#000000'})['--page-ink'],'#ffffff');
 assert.equal(appearanceSettings({backgroundLight:'#ffffff'})['--page-ink'],'#172033');
 assert.equal(validColor('#aabbcc'),true);assert.equal(validColor('url(foo)'),false);
 assert.equal(appearanceSettings({backgroundLight:'bad'})['--paper'],'#f5f3f0');
});
test('web and installable icon declarations use the supplied star artwork',async()=>{
 const root=new URL('../',import.meta.url),html=await readFile(new URL('index.html',root),'utf8'),manifest=JSON.parse(await readFile(new URL('manifest.webmanifest',root),'utf8'));
 assert.match(html,/rel="icon" href="star-icon\.png/);assert.match(html,/rel="apple-touch-icon" href="star-icon-192\.png/);
 for(const icon of manifest.icons){assert.match(icon.src,/^star-icon-/);const bytes=await readFile(new URL(icon.src.split('?')[0],root));assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');const size=Number(icon.sizes.split('x')[0]);assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);}
});
