export const DATA_FILE='mistake-review-next.json';
export const REMINDER_FILE='mistake-review-next-reminder.json';
export function gistId(value){
 const raw=String(value||'').trim();const id=raw.includes('/')?raw.split(/[/?#]/).filter(Boolean).at(-1):raw;
 if(!/^[0-9a-f]{5,64}$/i.test(id))throw new Error('请填写有效的 Gist ID。');return id;
}
export class GistClient {
 constructor(token,fetcher=globalThis.fetch){if(!token?.trim())throw new Error('请在本页输入 GitHub Gist Token，不要发到聊天中。');this.token=token.trim();this.fetcher=fetcher;}
 async request(method,path,body){
  const response=await this.fetcher('https://api.github.com/gists'+path,{method,signal:AbortSignal.timeout(15000),headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${this.token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok){if(response.status===401)throw new Error('GitHub 登录凭据无效或已过期。');if(response.status===403)throw new Error('GitHub 拒绝访问，请检查 Gist 权限或 API 频率限制。');if(response.status===404)throw new Error('找不到这个 Gist，或当前账号无权读取。');throw new Error(`云端请求失败（${response.status}）。`);}
  return response.json();
 }
 get(id){return this.request('GET','/'+gistId(id));}
 create(data){return this.request('POST','',{description:'错题回顾新版数据备份',public:false,files:{[DATA_FILE]:{content:JSON.stringify({...data,_syncedAt:new Date().toISOString()})}}});}
 upload(id,data){return this.request('PATCH','/'+gistId(id),{files:{[DATA_FILE]:{content:JSON.stringify({...data,_syncedAt:new Date().toISOString()})}}});}
 reminder(id,config){return this.request('PATCH','/'+gistId(id),{files:{[REMINDER_FILE]:{content:JSON.stringify(config)}}});}
}
export function readCloudData(gist){const file=gist.files?.[DATA_FILE]||gist.files?.['mistake-review.json'];if(!file)throw new Error('Gist 中没有错题备份文件。');if(file.truncated)throw new Error('云端文件过大，请下载完整 JSON 后手动导入。');try{return JSON.parse(file.content);}catch{throw new Error('云端备份不是有效 JSON。');}}
export function reminderDecision(config,data,now=new Date()){
 if(!config?.enabled||!config.subscription?.endpoint)return {send:false,reason:'disabled'};
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:config.tz||'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 const date=`${parts.year}-${parts.month}-${parts.day}`,time=`${parts.hour}:${parts.minute}`;
 if(config.lastSent===date||time<(config.time||'20:00'))return {send:false,reason:'not-due'};
 const count=(data.probs||[]).filter(p=>p.status==='active'&&p.next&&p.next<=date).length;
 return {send:true,date,count};
}
