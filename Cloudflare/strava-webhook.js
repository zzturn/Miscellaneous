/**
 * Strava Webhook 事件处理与 GitHub Actions 自动触发服务
 * 
 * 功能简介：
 *   - 验证 Strava Webhook 订阅 (GET)
 *   - 监听 Strava 新运动（跑步）记录 (POST)
 *   - 自动将跑步记录同步到 iCalendar（.ics/Gist）
 *   - 自动触发 GitHub Actions 工作流
 * 
 * 典型流程：
 *   1. Strava 新运动 → Worker 接收 Webhook
 *   2. 拉取活动详情，过滤“跑步”类型
 *   3. 写入/追加到 gist 中的 workout.ics 日历文件
 *   4. PATCH 更新 gist
 *   5. 触发目标仓库 GitHub Actions
 * 
 * 接口说明：
 *   - GET：用于 Strava webhook 注册验证
 *     - 必需参数：hub.mode=subscribe & hub.challenge
 *     - 返回：JSON 格式 {"hub.challenge": "..."}
 *   - POST：用于处理实际活动事件
 *     - 仅处理 object_type=activity & aspect_type=create 的新建运动
 *     - 仅同步“跑步”类型
 *     - 防止重复写入（通过 UID 检查）
 * 
 * 环境变量要求（env）：
 *   - GITHUB_NAME         GitHub 用户名/组织名
 *   - REPO_NAME           目标仓库名
 *   - ACTION_ID           要触发的 workflow id
 *   - GITHUB_TOKEN        GitHub Token，需 actions:write 权限
 *   - GIST_ID             目标 gist id
 *   - STRAVA_TOKEN        Strava API 访问 token
 *   - STRAVA_CLIENT_ID    Strava 应用 client_id
 *   - STRAVA_CLIENT_SECRET Strava 应用 client_secret
 *   - STRAVA_REFRESH_TOKEN Strava refresh_token
 * 
 * 安全注意事项：
 *   - 仅允许 GET/POST 方法，其他返回 405
 *   - 不记录敏感 token
 *   - 所有外部 API 调用均带认证
 * 
 * Webhook 事件示例（POST体）：
 *   {
 *     "object_type": "activity",
 *     "object_id": 14537064855,
 *     "aspect_type": "create",
 *     "owner_id": 987654321,
 *     "subscription_id": 280784,
 *     "event_time": 1714368000
 *   }
 * 
 * 维护历史：
 *   - 2025-04-30 初始实现
 *   - 2025-05-18 增补详细注释
 *   - 2025-05-22 跑步记录自动同步至日历
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

      if (body.object_type === "activity" && body.aspect_type === "create") {
        const activityId = body.object_id;
        let token = env.STRAVA_TOKEN;

        // 获取活动详情，自动刷新token
        let activity;
        try {
          activity = await getStravaActivity(activityId, env, token);
        } catch (e) {
          return new Response("Failed to fetch activity: " + e.message, { status: 500 });
        }

        if (activity.type !== "Run") {
          return new Response("Not a run activity, ignored.");
        }

        // 读取原 gist .ics 文件内容
        const gistRawUrl = `https://gist.githubusercontent.com/${env.GITHUB_NAME}/${env.GIST_ID}/raw/workout.ics`;
        const gistResp = await fetch(gistRawUrl);
        let icsContent = await gistResp.text();

        // 防止重复插入
        const uid = `${activity.id}@strava`;
        if (hasEvent(icsContent, uid)) {
          return new Response("Event already exists, skipped.");
        }

        // 构造 iCalendar VEVENT
        const start = new Date(activity.start_date);
        const end = new Date(start.getTime() + activity.elapsed_time * 1000);

        function toICalTime(date) {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + "Z";
        }

        const distance = (activity.distance / 1000).toFixed(2); // km
        const duration = Math.floor(activity.elapsed_time / 60) + "分钟";
        const avg_hr = activity.average_heartrate ? Math.round(activity.average_heartrate) + " bpm" : "无";
        const avg_pace = activity.average_speed ? formatPace(activity.average_speed) : "无";
        const source = activity.device_name || "Strava";

        const summary = `🏃‍♂️跑步${distance}km`;
        const description = [
          `距离: ${distance} km`,
          `运动时间: ${duration}`,
          `平均心率: ${avg_hr}`,
          `平均配速: ${avg_pace}`,
          `数据来源: ${source}`,
          `活动链接: https://www.strava.com/activities/${activity.id}`
        ].join('\\n');
        const vevent = `
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${toICalTime(new Date())}
DTSTART:${toICalTime(start)}
DTEND:${toICalTime(end)}
SUMMARY:${summary}
DESCRIPTION:${description}
END:VEVENT`.trim();

        // 插入事件
        icsContent = icsContent.replace(/END:VCALENDAR/, vevent + "\nEND:VCALENDAR");

        // 更新 gist
        const gistApiUrl = `https://api.github.com/gists/${env.GIST_ID}`;
        const updatePayload = {
          files: {
            "workout.ics": { content: icsContent }
          }
        };
        const updateResp = await fetch(gistApiUrl, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
            "Accept": "application/vnd.github+json",
            "User-Agent": "strava-webhook"
          },
          body: JSON.stringify(updatePayload)
        });
        if (!updateResp.ok) {
          const errText = await updateResp.text();
          return new Response("Failed to update gist: " + errText, { status: 500 });
        }

        // 保留原有触发 GitHub Actions 的逻辑
        const githubApiUrl = `https://api.github.com/repos/${env.GITHUB_NAME}/${env.REPO_NAME}/actions/workflows/${env.ACTION_ID}/dispatches`;
        const payload = { ref: "master" };
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

// 工具函数
async function refreshStravaToken(env) {
  const urlencoded = new URLSearchParams();
  urlencoded.append("client_id", env.STRAVA_CLIENT_ID);
  urlencoded.append("client_secret", env.STRAVA_CLIENT_SECRET);
  urlencoded.append("refresh_token", env.STRAVA_REFRESH_TOKEN);
  urlencoded.append("grant_type", "refresh_token");


  const resp = await fetch('https://www.strava.com/oauth/token', {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: urlencoded
  });
  if (!resp.ok) throw new Error("Failed to refresh Strava token" + resp.json());
  const data = await resp.json();
  // 实际生产环境应将 data.access_token 写入KV存储
  return data.access_token;
}

// 配速格式化函数：将米/秒转换为 '分钟'秒" 格式
function formatPace(speedInMetersPerSecond) {
  // 计算每公里所需秒数
  const secondsPerKilometer = 1000 / speedInMetersPerSecond;
  
  // 计算分钟和秒
  const minutes = Math.floor(secondsPerKilometer / 60);
  const seconds = Math.round(secondsPerKilometer % 60);
  
  // 处理秒数为个位数时的补零（例如 5秒 → 05）
  const paddedSeconds = seconds.toString().padStart(2, '0');
  
  return `${minutes}'${paddedSeconds}"`;
}

async function getStravaActivity(activityId, env, token) {
  let resp = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (resp.status === 401) {
    const newToken = await refreshStravaToken(env);
    resp = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
      headers: { "Authorization": `Bearer ${newToken}` }
    });
  }
  if (!resp.ok) throw new Error("Failed to fetch activity");
  return await resp.json();
}

function hasEvent(icsContent, uid) {
  return icsContent.includes(`UID:${uid}`);
}

export {
  index_default as default
};
