import {validColor} from './appearance.js';

// Some mobile pickers only commit on change, or expose the chosen value on close.
// The explicit button also reads that value without relying on either event.
export function bindColorControl({picker,hex,apply,current,onApply,onInvalid}){
 const commit=(raw,report=false)=>{
  const value=raw.trim().toLowerCase();
  if(!validColor(value)){if(report)onInvalid();return;}
  if(picker.value!==value)picker.value=value;
  if(hex.value!==value)hex.value=value;
  onApply(value);
 };
 picker.oninput=()=>commit(picker.value);
 picker.onchange=()=>commit(picker.value,true);
 hex.oninput=()=>commit(hex.value);
 hex.onchange=()=>commit(hex.value,true);
 apply.onclick=()=>commit(picker.value.toLowerCase()!==current().toLowerCase()?picker.value:hex.value,true);
 hex.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commit(hex.value,true);}};
}
