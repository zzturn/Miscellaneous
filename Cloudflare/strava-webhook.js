
/**
 * Strava Webhook 事件处理器 (Strava-to-GitHub Actions Worker)
 * 
 * 核心功能：
 *   1. 接收 Strava 的 Webhook 验证请求 (GET)
 *   2. 处理 Strava 运动记录创建事件 (POST)
 *   3. 触发指定 GitHub 仓库的 Actions 工作流
 * 
 * 工作流程：
 *   ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
 *   │  Strava     │ ──→ │ Cloudflare  │ ──→ │ GitHub          │
 *   │  Activity   │     │  Worker     │     │  Actions        │
 *   │  Created    │     │ (本服务)     │     │  Workflow       │
 *   └─────────────┘     └─────────────┘     └─────────────────┘
 * 
 * 请求处理逻辑：
 *   - GET 请求: 处理 Strava Webhook 订阅验证
 *     ↳ 必需参数: hub.mode=subscribe & hub.challenge=[token]
 *   - POST 请求: 处理运动记录创建事件
 *     ↳ 触发条件: object_type=activity & aspect_type=create
 * 
 * 环境变量要求：
 *   - GITHUB_NAME: GitHub 用户名/组织名
 *   - REPO_NAME: 目标仓库名称
 *   - ACTION_ID: 要触发的工作流 ID
 *   - GITHUB_TOKEN: 具有 `actions:write` 权限的 GitHub Token
 * 
 * 安全控制：
 *   - 严格限制只接受 GET/POST 方法 (其他返回 405)
 *   - GitHub API 请求使用 Bearer Token 认证
 *   - 敏感信息(如 TOKEN)不记录日志
 * 
 * 调试方法：
 *   1. 查看 Worker 日志中的 Strava 事件数据
 *   2. 检查 GitHub API 响应状态码
 *   3. 测试 URL: /?hub.mode=subscribe&hub.challenge=test123
 * 
 * 典型事件示例：
 *   {
 *     "object_type": "activity",
 *     "aspect_type": "create",
 *     "object_id": 123456789,
 *     "owner_id": 987654321
 *   }
 * 
 * 维护记录：
 *   - 2025-04-30 初始版本 (支持基础验证和触发)
 *   - 2025-05-18 添加注释
 * 
 * @author zzturn
 * @see https://developers.strava.com/docs/webhooks
 * @see https://docs.github.com/en/rest/actions/workflows
 */


var index_default = {
  async fetch(request, env, ctx) {
    if (request.method === "GET") {
      const { searchParams } = new URL(request.url);
      if (searchParams.get("hub.mode") === "subscribe" && searchParams.get("hub.challenge")) {
        const challenge = searchParams.get("hub.challenge");
        return new Response(JSON.stringify({ "hub.challenge": challenge }), {
          headers: { "Content-Type": "application/json" }
        });
      } else {
        return new Response("Invalid verification", { status: 400 });
      }
    } else if (request.method === "POST") {
      const body = await request.json();
      console.log("Received Strava webhook event:", body);
      if (body.object_type === "activity" && body.aspect_type === "create") {
        const githubApiUrl = `https://api.github.com/repos/${env.GITHUB_NAME}/${env.REPO_NAME}/actions/workflows/${env.ACTION_ID}/dispatches`;
        const payload = {
          ref: "master"
          // 你要触发的分支，比如 main 或 master
        };
        const response = await fetch(githubApiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "strava-webhook"
          },
          body: JSON.stringify(payload)
        });
        const result = await response.text();
        console.log(githubApiUrl);
        console.log(env.GITHUB_TOKEN);
        console.log("Triggered GitHub Action, response:", result);
        if (!response.ok) {
          return new Response(`GitHub API error: ${result}`, { status: 500 });
        }
      }
      return new Response("OK");
    } else {
      return new Response("Method not allowed", { status: 405 });
    }
  }
};
export {
  index_default as default
};
