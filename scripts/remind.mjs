// Credentials live only in GitHub Actions secrets, never in the static website.
import {GistClient,readCloudData,REMINDER_FILE,reminderDecision} from '../cloud.js';
const {GIST_TOKEN,GIST_ID,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY,VAPID_SUBJECT}=process.env;
if(!GIST_TOKEN||!GIST_ID||!VAPID_PUBLIC_KEY||!VAPID_PRIVATE_KEY||!VAPID_SUBJECT){
 console.log('Reminder sender is not configured. See PUSH_SETUP.md.');
 process.exit(1);
}
if (!/^[\x21-\x7e]+$/.test(GIST_TOKEN.trim())) {
 console.error('GIST_TOKEN contains whitespace or non-ASCII characters. Paste only the GitHub token into the secret value.');
 process.exit(1);
}
let stage='read Gist';
try{
 const client=new GistClient(GIST_TOKEN),gist=await client.get(GIST_ID);
 stage='read backup and reminder schedule';
 const cfg=JSON.parse(gist.files?.[REMINDER_FILE]?.content||'{}');
 const data=readCloudData(gist),decision=reminderDecision(cfg,data);
 if(!decision.send){console.log('No reminder is due.');process.exit(0);}
 stage='send Web Push';
 const webpush=(await import('web-push')).default;
 webpush.setVapidDetails(VAPID_SUBJECT,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY);
 await webpush.sendNotification(cfg.subscription,JSON.stringify({title:'📝 错题回顾',body:decision.count?`今天有 ${decision.count} 道错题待复习。`:'今天没有待复习的错题，继续保持！',badge:decision.count,url:cfg.url}),{TTL:3600});
 stage='record delivery';
 await client.reminder(GIST_ID,{...cfg,lastSent:decision.date});
 console.log(`Reminder sent: ${decision.count} due problems.`);
}catch(error){
 // Do not print tokens, subscription URLs, or raw push-provider responses.
 const known=error.cause?.code;
 const networkCode=['ENOTFOUND','ETIMEDOUT','ECONNRESET','UND_ERR_CONNECT_TIMEOUT'].includes(known)?known:'';
 const status=Number(error.statusCode)||Number(error.status)||0;
 console.error(`Reminder failed at ${stage} (${status || networkCode || error.name}).`);
 process.exitCode=1;
}
