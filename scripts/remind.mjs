// Credentials live only in GitHub Actions secrets, never in the static website.
import {GistClient,readCloudData,REMINDER_FILE,reminderDecision} from '../cloud.js';
const {GIST_TOKEN,GIST_ID,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY,VAPID_SUBJECT}=process.env;
if(!GIST_TOKEN||!GIST_ID||!VAPID_PUBLIC_KEY||!VAPID_PRIVATE_KEY||!VAPID_SUBJECT){
 console.log('Reminder sender is not configured. See PUSH_SETUP.md.');
 process.exit(0);
}
try{
 const client=new GistClient(GIST_TOKEN),gist=await client.get(GIST_ID);
 const cfg=JSON.parse(gist.files?.[REMINDER_FILE]?.content||'{}');
 const data=readCloudData(gist),decision=reminderDecision(cfg,data);
 if(!decision.send){console.log('No reminder is due.');process.exit(0);}
 const webpush=(await import('web-push')).default;
 webpush.setVapidDetails(VAPID_SUBJECT,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY);
 await webpush.sendNotification(cfg.subscription,JSON.stringify({title:'📝 错题回顾',body:decision.count?`今天有 ${decision.count} 道错题待复习。`:'今天没有待复习的错题，继续保持！',badge:decision.count,url:cfg.url}),{TTL:3600});
 await client.reminder(GIST_ID,{...cfg,lastSent:decision.date});
 console.log(`Reminder sent: ${decision.count} due problems.`);
}catch(error){
 // Do not print tokens, subscription URLs, or raw push-provider responses.
 console.error(`Reminder failed (${error.statusCode||error.name||'unknown'}). Check credentials, subscription and Actions configuration.`);
 process.exitCode=1;
}
