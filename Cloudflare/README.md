# Cloudflare

[openkey.js](https://github.com/zzturn/Miscellaneous/raw/master/Cloudflare/openkey.js) 是个人在用的 openai 反向代理，对于一些额度不高/稳定性不高的 tokens 池，根据每个请求随机选择 token，避免常规使用中，单一 token 不稳定导致需要频繁切换的问题；同时解决了网络问题。

[reverseproxy.js](https://github.com/zzturn/Miscellaneous/raw/master/Cloudflare/reverseproxy.js) 反向代理，解决网络问题，`usage: https://<cloudflare_domain>/proxy/<target_url>` 将其中的 `cloudflare_domain` 替换为 worker 的 domain，`target_url` 替换为需要代理的 url，比如 https://proxy.cloudflare.com/proxy/https://api.github.com

[reverseproxy_encode.js](https://github.com/zzturn/Miscellaneous/raw/master/Cloudflare/reverseproxy_encode.js) 反向代理，与 `reversepeoxy.js` 不同的是，需要代理的 url 需要进行 urlencode，比如 https://proxy.cloudflare.com?target=https:%2F%2Fapi.github.com