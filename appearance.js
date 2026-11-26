export const THEMES = [
  {id:'blue',name:'蓝色',color:'#4f7fe5'},
  {id:'purple',name:'紫色',color:'#8056d9'},
  {id:'rose',name:'粉色',color:'#c65179'},
  {id:'orange',name:'橙色',color:'#bc651f'},
  {id:'teal',name:'青色',color:'#167d83'},
  {id:'slate',name:'灰色',color:'#526179'}
];
export function colorSettings(color='#4f7fe5',dark=false){
  if(!/^#[0-9a-f]{6}$/i.test(color))throw new Error('请选择有效的六位主题颜色。');
  const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  const mix=(target,amount)=>'#'+rgb.map((v,i)=>Math.round(v*(1-amount)+target[i]*amount).toString(16).padStart(2,'0')).join('');
  const luminance=rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  return {'--accent':color,'--on-accent':(luminance+.05)/.05>=4.5?'#101826':'#ffffff','--accent-soft':mix(dark?[22,29,42]:[255,255,255],dark?.76:.90),'--nav-bg':mix([17,24,39],.85),'--nav-active':mix([255,255,255],.12),'--heat-1':mix(dark?[22,29,42]:[255,255,255],.76),'--heat-2':mix(dark?[22,29,42]:[255,255,255],.46)};
}
