# Tampermonkey 脚本集

本目录包含实用的 Tampermonkey 用户脚本。

## 脚本列表

| 脚本 | 功能 |
|------|------|
| [GitLab MR Helper](#gitlab-mr-helper) | MR 快捷操作：设置标题、删除分支 |
| [Inoreader AI Summary](#inoreader-ai-summary) | AI 生成文章总结 |

---

## GitLab MR Helper

在 GitLab MR 页面添加快捷按钮：一键设置 MR 标题和合并后删除分支。

### 功能特性

- 📝 **设置标题** - 使用最新 commit message 作为 MR 标题
- 🗑️ **合并后删除** - 一键设置合并后自动删除源分支
- 🎨 **GitLab 风格** - 按钮样式与 GitLab 原生 UI 一致
- ✅ **Toast 通知** - 操作结果即时反馈

### 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)
2. 点击 Tampermonkey 图标 → 添加新脚本
3. 将 [gitlab-mr-helper.user.js](./gitlab-mr-helper.user.js) 的内容粘贴进去
4. 保存（Ctrl+S / Cmd+S）

### 使用方法

1. 打开任意 GitLab MR 详情页
2. 页面右上角会出现两个按钮：
   - **📝 设置标题** - 自动将 MR 标题设置为最新 commit message
   - **🗑️ 合并后删除** - 设置合并后自动删除源分支

### URL 匹配

默认匹配以下 URL：
- `http://192.168.9.111:60200/*/*/merge_requests/*`
- `https://*/-/merge_requests/*`

如需匹配其他 GitLab 实例，修改脚本中的 `@match` 规则。

### 更新日志

#### v1.3.0
- 初始版本
- 支持设置 MR 标题
- 支持设置合并后删除源分支

---

## Inoreader AI Summary

点击 Inoreader 原生总结按钮，使用 AI 生成文章总结（带打字效果）。

### 功能特性

- 🚀 **一键总结** - 点击 Inoreader 原生总结按钮即可生成 AI 总结
- ✨ **打字效果** - 模拟流式输出，缓解等待焦虑
- 🔄 **多 AI 支持** - 支持 DeepSeek、OpenAI、Claude
- 💾 **智能缓存** - 7 天内自动使用缓存，节省 API 调用
- 📋 **一键复制** - 复制 Markdown 格式的总结内容
- 🎨 **美观界面** - 总结显示在文章内容上方

### 安装

#### 1. 安装 Tampermonkey

- [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- [Safari](https://apps.apple.com/app/tampermonkey/id1482490089)
- [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

#### 2. 安装脚本

1. 点击 Tampermonkey 图标 → 添加新脚本
2. 将 [inoreader-ai-summary.user.js](./inoreader-ai-summary.user.js) 的内容粘贴进去
3. 保存（Ctrl+S / Cmd+S）

### 配置

#### 设置 API Key

1. 打开 [Inoreader](https://www.inoreader.com)
2. 点击 Tampermonkey 图标
3. 选择「⚙️ 设置 API Key」
4. 选择 AI 提供商并输入 API Key

#### 获取 API Key

| 提供商 | 获取地址 | 价格参考 |
|--------|----------|----------|
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com/) | ¥1/百万 tokens |
| OpenAI | [platform.openai.com](https://platform.openai.com/) | $0.15/百万 tokens |
| Claude | [console.anthropic.com](https://console.anthropic.com/) | $0.25/百万 tokens |

> 💡 **推荐**: DeepSeek 性价比最高，中文效果优秀

#### 自定义提示词

1. 点击 Tampermonkey 图标
2. 选择「📝 自定义提示词」
3. 输入你的自定义提示词（留空使用默认）

默认提示词：
```
你是一个专业的文章分析助手。请对给定的文章内容进行结构化总结，包括：
1. 核心观点（3-5点）
2. 关键信息
3. 可行性建议（如果适用）
4. 总结
请使用简洁清晰的语言。
```

### 使用方法

1. 在 Inoreader 中打开任意文章
2. 点击文章底部的「总结」按钮（Inoreader 原生按钮）
3. 等待 AI 生成总结（Console 可查看详细耗时）

### 操作按钮

| 按钮 | 功能 |
|------|------|
| 📋 复制 | 复制 Markdown 格式的总结内容 |
| 🔄 重新分析 | 清除缓存，重新调用 API |
| ✕ 关闭 | 隐藏总结面板 |

### 菜单命令

| 命令 | 说明 |
|------|------|
| ⚙️ 设置 API Key | 配置 AI 提供商和 API Key |
| 🔄 切换 AI 提供商 | 查看当前提供商 |
| 📝 自定义提示词 | 设置总结的提示词 |
| 🗑️ 清除所有缓存 | 清除所有文章的缓存 |

### 性能监控

打开浏览器 Console (F12)，可查看详细的性能日志：

```
[AI总结] 按钮点击开始
[AI总结] 内容提取耗时: 3.5ms
[AI总结] API 调用耗时: 3245ms (3.25s)
[AI总结] ========== 性能统计 ==========
  - 容器检查: 0.5ms
  - 内容提取: 3.5ms
  - 缓存检查: 0.3ms
  - API调用: 3.25s
  - 结果渲染: 2100ms (含打字效果)
[AI总结] 总耗时: 5.35s
```

### 常见问题

#### Q: 点击按钮没反应？

1. 确认已安装 Tampermonkey 并启用脚本
2. 确认已配置 API Key
3. 打开 Console 查看错误信息

#### Q: 提示「未设置 API Key」？

1. 点击 Tampermonkey 图标
2. 选择「⚙️ 设置 API Key」
3. 选择 AI 提供商并输入 API Key

#### Q: 总结时间过长？

- API 调用时间取决于网络和 AI 服务响应速度
- 建议使用 DeepSeek，国内访问速度较快
- 查看性能日志确认瓶颈在哪个环节

#### Q: 如何切换 AI 提供商？

1. 点击 Tampermonkey 图标
2. 选择「⚙️ 设置 API Key」
3. 输入新的提供商序号和对应的 API Key

### 技术细节

- **缓存**: 使用 `GM_setValue` 本地存储，7 天有效期
- **渲染**: 支持 marked.js 渲染 Markdown
- **打字效果**: 每次随机输出 1-3 个字符，模拟真实打字

### 更新日志

#### v2.0.0
- 移除侧边栏，改用文章内总结
- 添加打字效果
- 添加性能监控日志
- 优化按钮点击响应

#### v1.5.0
- 支持原生总结按钮集成
- 添加文章内总结显示

#### v1.4.0
- 初始版本
- 侧边栏模式

---

## License

MIT
