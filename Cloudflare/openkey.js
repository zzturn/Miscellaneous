/**
 * 用于 openai 反向代理，同时将 token 与请求解耦，但需要额外维护 tokens 池
 * 个人使用场景就是，对于一些额度不高/稳定性不高的 tokens 池，根据每个请求随机选择 token，避免常规用法中，单一 token 不稳定导致需要频繁切换 token
 * 
 * 实际使用与常规 openai 请求一直，只需要 url 替换为 cf worker 的 url，同时 Authorization 设置为提前确定的 token
 * 
 * requirements: 
 *   1. 创建并关联一个 kv 存储，并设置命名为 OPENAI
 *   2. 设置以下环境变量
 *     - REQ_TOKEN: 请求 cloudflare worker 所用的 authorization
 *     - REDIS_KEY: kv 存储中，存放 tokens 的 key
 *     - TARGET_URL: openai 的请求 host，一般是 api.openai.com
 */

export default {
    async fetch(request, env) {
        // Clone the request to avoid the body being locked
        const originalRequest = request.clone();

        // 校验
        if (originalRequest.headers.get('Authorization') !== env.REQ_TOKEN && originalRequest.method !== 'OPTIONS') {
            return new Response('Access Denied', { status: 403, statusText: 'Forbidden' });
        }

        // 获取 token
        let tokens = await env.OPENAI.get(env.REDIS_KEY);
        // console.log(tokens);
        let token_list = tokens.split(',');
        var randomIndex = Math.floor(Math.random() * token_list.length);
        var random_token = token_list[randomIndex];
        console.log(random_token);

        // 处理请求 
        const requestHeaders = new Headers(originalRequest.headers);
        requestHeaders.set('Authorization', 'Bearer ' + random_token);

        const headers_Origin = request.headers.get("Access-Control-Allow-Origin") || "*"

        const url = new URL(request.url);
        url.host = env.TARGET_URL;

        const modifiedRequest = new Request(url, {
            headers: requestHeaders,
            method: request.method,
            body: await request.arrayBuffer(),
            redirect: 'follow'
        });

        const response = await fetch(modifiedRequest);
        const modifiedResponse = new Response(response.body, response);

        // 添加允许跨域访问的响应头
        modifiedResponse.headers.set('Access-Control-Allow-Origin', headers_Origin);

        return modifiedResponse;
    },
};
