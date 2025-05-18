# Cloudflare

~~[`openkey.js`](https://github.com/zzturn/Miscellaneous/raw/master/Cloudflare/openkey.js) 是个人在用的 openai 反向代理，对于一些额度不高/稳定性不高的 tokens 池，根据每个请求随机选择 token，避免常规使用中，单一 token 不稳定导致需要频繁切换的问题；同时解决了网络问题。~~

[`reverseproxy.js`](https://github.com/zzturn/Miscellaneous/raw/master/Cloudflare/reverseproxy.js) 反向代理，解决网络问题，`usage: https://<cloudflare_domain>/proxy/<target_url>` 将其中的 `cloudflare_domain` 替换为 worker 的 domain，`target_url` 替换为需要代理的 url，比如 https://proxy.cloudflare.com/proxy/https://api.github.com

[`reverseproxy_encode.js`](https://github.com/zzturn/Miscellaneous/raw/master/Cloudflare/reverseproxy_encode.js) 反向代理，与 `reversepeoxy.js` 不同的是，需要代理的 url 需要进行 urlencode，比如 https://proxy.cloudflare.com?target=https:%2F%2Fapi.github.com

[`html-preview.js`](https://github.com/zzturn/Miscellaneous/raw/master/Cloudflare/html-preview.js) HTML 代码在线即时预览，左侧编辑 HTML 代码，右侧自动更新显示预览画面

[`gist.js`](https://github.com/zzturn/Miscellaneous/raw/master/Cloudflare/gist.js) Gist HTML 渲染服务。将 GitHub Gist 中的 HTML 源代码转换为可直接访问的网页。用户只需将 Gist 原始链接路径附加到 Worker 域名后即可访问渲染后的页面。 示例用法：
 - Gist 原始URL: https://gist.githubusercontent.com/zzturn/baf95b2092a37051e1b8de08e6882a91/raw/index.html
 - Worker 访问URL: https://gist.zturn.eu.org/zzturn/baf95b2092a37051e1b8de08e6882a91/raw/index.html

[`strava-webhook.js`](https://github.com/zzturn/Miscellaneous/raw/master/Cloudflare/strava-webhook.js) Strava Webhook 事件处理器，触发 `GitHub Workflow`. 作者主要用于跑步运动之后 `running_page` 的数据更新。