import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindColorControl} from '../color-controls.js';
import {appearanceSettings,selectTheme} from '../appearance.js';

function setup(background=false){
 let preferences={color:'#4f7fe5',backgroundLight:'#fff4db'},errors=0;
 const current=()=>background?appearanceSettings(preferences)['--paper']:preferences.color;
 const picker={value:current()},hex={value:current()},apply={};
 bindColorControl({picker,hex,apply,current,onApply:color=>{preferences=background?{...preferences,backgroundLight:color}:selectTheme(preferences,color);},onInvalid:()=>errors++});
 return {picker,hex,apply,state:()=>preferences,errors:()=>errors};
}
for(const background of [false,true]){
 const label=background?'page background':'custom theme';
 test(`${label}: change-only mobile picker commits and persists the actual color`,()=>{
  const c=setup(background);c.picker.value='#ee2233';c.picker.onchange();
  assert.equal(c.hex.value,'#ee2233');
  const saved=appearanceSettings(JSON.parse(JSON.stringify(c.state())));
  assert.equal(saved['--paper'],background?'#ee2233':'#fde0e2');
 });
 test(`${label}: apply reads selected picker value even without native input/change events`,()=>{
  const c=setup(background);c.picker.value='#22bb44';c.apply.onclick();
  assert.equal(c.hex.value,'#22bb44');
  assert.equal(appearanceSettings(c.state())['--paper'],background?'#22bb44':'#e0f5e5');
 });
 test(`${label}: hex entry rejects partial values and can commit with Enter`,()=>{
  const c=setup(background),before=c.state();c.hex.value='#abc';c.hex.oninput();
  assert.deepEqual(c.state(),before);c.apply.onclick();assert.equal(c.errors(),1);
  c.hex.value='#12AB34';let prevented=false;
  c.hex.onkeydown({key:'Enter',preventDefault:()=>prevented=true});
  assert.equal(c.picker.value,'#12ab34');assert.ok(prevented);
 });
}
