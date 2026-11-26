export const THEMES = [
  {id:'blue',name:'蓝色',color:'#4f7fe5',background:'#f5f3f0'},
  {id:'purple',name:'紫色',color:'#8056d9',background:'#f2eefb'},
  {id:'rose',name:'粉色',color:'#c65179',background:'#fff0f4'},
  {id:'orange',name:'橙色',color:'#bc651f',background:'#fff4e8'},
  {id:'teal',name:'青色',color:'#167d83',background:'#eaf5f4'},
  {id:'slate',name:'灰色',color:'#526179',background:'#f0f2f5'}
];
export const BACKGROUNDS = {
 light:[{name:'暖灰',color:'#f5f3f0'},{name:'奶油',color:'#fff4db'},{name:'浅蓝',color:'#eaf2ff'},{name:'淡紫',color:'#f1e9ff'},{name:'浅粉',color:'#ffedf3'},{name:'浅绿',color:'#eaf5ec'}],
 dark:[{name:'深蓝',color:'#131a25'},{name:'深紫',color:'#261d32'},{name:'深绿',color:'#142c26'},{name:'深灰',color:'#20242b'}]
};
export const validColor = value => typeof value==='string' && /^#[0-9a-f]{6}$/i.test(value);
export function selectTheme(preferences,color){
 if(!validColor(color))throw new Error('请选择有效的六位主题颜色。');
 return {...preferences,color:color.toLowerCase(),backgroundLight:null,backgroundDark:null};
}
function themeBackground(color,dark){
 const preset=THEMES.find(t=>t.color.toLowerCase()===color.toLowerCase());
 if(!dark&&preset)return preset.background;
 const base=dark?[19,26,37]:[255,255,255],amount=dark?.22:.14;
 return '#'+[1,3,5].map((offset,i)=>Math.round(parseInt(color.slice(offset,offset+2),16)*amount+base[i]*(1-amount)).toString(16).padStart(2,'0')).join('');
}
function luminance(color){return [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);}
export function appearanceSettings(preferences={}){
 const dark=preferences.dark===true;
 const accent=validColor(preferences.color)?preferences.color:'#4f7fe5';
 const custom=dark?preferences.backgroundDark:preferences.backgroundLight;
 const background=validColor(custom)?custom:themeBackground(accent,dark);
 const l=luminance(background),ink='#172033';
 const darkContrast=(l+.05)/(luminance(ink)+.05),lightContrast=1.05/(l+.05);
 return {...colorSettings(accent,dark),'--paper':background,'--page-ink':lightContrast>darkContrast?'#ffffff':ink};
}
export function colorSettings(color='#4f7fe5',dark=false){
  if(!/^#[0-9a-f]{6}$/i.test(color))throw new Error('请选择有效的六位主题颜色。');
  const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  const mix=(target,amount)=>'#'+rgb.map((v,i)=>Math.round(v*(1-amount)+target[i]*amount).toString(16).padStart(2,'0')).join('');
  const luminance=rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  return {'--accent':color,'--on-accent':(luminance+.05)/.05>=4.5?'#101826':'#ffffff','--accent-soft':mix(dark?[22,29,42]:[255,255,255],dark?.76:.90),'--nav-bg':mix([17,24,39],.85),'--nav-active':mix([255,255,255],.12),'--heat-1':mix(dark?[22,29,42]:[255,255,255],.76),'--heat-2':mix(dark?[22,29,42]:[255,255,255],.46)};
}
