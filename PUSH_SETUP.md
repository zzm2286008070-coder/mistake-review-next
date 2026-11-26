# 后台提醒配置

此仓库已包含 Web Push 接收端和 GitHub Actions 发送端。默认不启用发送任务，不会仅凭网页上的时间设置宣称后台提醒已生效。

1. 在网页“学习统计 → GitHub 云同步”连接一个专用 Gist。Token 需有 `gist` 权限，输入网页的密码框，不要放进聊天、源文件、备份 JSON 或提交记录。
2. 本地 `npm ci` 后运行 `npx web-push generate-vapid-keys` 生成公私钥。**公钥**可填网页；**私钥**只放 GitHub Actions Secrets，不要提交到仓库。
3. 本仓库 Settings → Secrets and variables → Actions 中添加 Secrets：`GIST_TOKEN`、`GIST_ID`、`VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY`、`VAPID_SUBJECT`。Subject 可填自己的 mailto 联系地址或 HTTPS 联系页面。
4. 在同一设置的 Variables 中增加 `PUSH_ENABLED`，值为 `true`。
5. 手机打开网站（iPhone 先用 Safari 添加到主屏幕），学习统计里填写公钥、选择时间、点击“订阅并更新提醒”并授权通知。这会保存提醒时间和该设备订阅。发送端按最近一次上传的云端错题统计。
6. Actions → Background Reminder → Run workflow，在提醒时间已到的情况下检验。网页“本机测试通知”只检验通知展示，不代表服务器已接通。

发送端约每 15 分钟检查一次，GitHub 排队或低活跃仓库的调度可能延迟、暂停，不是准点闹钟。公仓库长期没有活动时计划任务也可能被 GitHub 暂停。

待复习数由最近上传的云端题目与发送日重新计算（包含逾期）。新增和复习后请手动上传，否则发送端仍基于旧备份。当前一份提醒配置只对应一个设备，新设备订阅会替换旧设备。不要让旧项目和本项目的发送端同时读取同一份提醒配置；本项目使用独立文件名。

关闭提醒：保持云端连接，点击“关闭提醒”。断开网页的 Token 会话不会自动删除云端订阅或停用 Actions。也可把 `PUSH_ENABLED` 改为 `false` 停止此仓库发送任务。

静态 GitHub Pages 无法自行保存服务端私钥或在 App 关闭后运行定时器，必须配合这个发送端。浏览器、系统和网络条件也会影响通知及图标角标的支持。
