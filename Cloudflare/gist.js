/**
 * Gist HTML 渲染服务 (Gist HTML Renderer Worker)
 * 
 * 功能描述：
 *   将 GitHub Gist 中的 HTML 源代码转换为可直接访问的网页。
 *   用户只需将 Gist 原始链接路径附加到 Worker 域名后即可访问渲染后的页面。
 * 
 * 工作原理：
 *   1. 接收形如 /{gist_user}/{gist_id}/raw/{filename} 的请求路径
 *   2. 代理请求到 gist.githubusercontent.com 获取原始 HTML
 *   3. 返回包含正确 Content-Type 的响应
 * 
 * 示例用法：
 *   - Gist 原始URL: https://gist.githubusercontent.com/zzturn/baf95b2092a37051e1b8de08e6882a91/raw/index.html
 *   - Worker 访问URL: https://gist.zturn.eu.org/zzturn/baf95b2092a37051e1b8de08e6882a91/raw/index.html
 * 
 * 路由规则：
 *   - GET /* : 代理 Gist HTML 内容
 * 
 * 技术说明：
 *   - 自动设置 Content-Type: text/html; charset=utf-8
 *   - 遵循 GitHub 的 raw 内容响应头
 *   - 支持动态内容更新 (Gist 修改后同步更新)
 * 
 * 
 * 维护记录：
 *   - 2025-05-17 创建基础功能
 *   - 2025-05-18 添加注释
 * 
 * @author zzturn
 */


export default {
  async fetch(request, env, ctx) {
    // 获取路径部分
    const url = new URL(request.url);
    const path = url.pathname; // 如 /zzn/123/raw/123/resume.html

    // 拼接 Gist 原始地址
    const gistUrl = 'https://gist.githubusercontent.com' + path;

    // 请求 Gist
    const resp = await fetch(gistUrl);

    // 直接返回 gist 内容，设置 content-type
    return new Response(await resp.body, {
      status: resp.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // 你也可以添加 CORS 或其他 header
      },
    });
  }
}
