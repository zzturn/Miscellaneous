import type { AppInfo } from '../types/editor';

/** 常见 macOS 应用数据库 — 用于 Bundle ID 自动补全 */
export const APP_DATABASE: AppInfo[] = [
  // 浏览器
  { name: 'Safari', bundleId: 'com.apple.Safari', category: 'browser' },
  { name: 'Google Chrome', bundleId: 'com.google.Chrome', category: 'browser' },
  { name: 'Firefox', bundleId: 'org.mozilla.firefox', category: 'browser' },
  { name: 'Arc', bundleId: 'company.thebrowser.Browser', category: 'browser' },
  { name: 'Microsoft Edge', bundleId: 'com.microsoft.edgemac', category: 'browser' },

  // 编辑器 & IDE
  { name: 'Visual Studio Code', bundleId: 'com.microsoft.VSCode', category: 'editor' },
  { name: 'IntelliJ IDEA', bundleId: 'com.jetbrains.intellij', category: 'editor' },
  { name: 'DataGrip', bundleId: 'com.jetbrains.datagrip', category: 'editor' },
  { name: 'PyCharm', bundleId: 'com.jetbrains.pycharm', category: 'editor' },
  { name: 'WebStorm', bundleId: 'com.jetbrains.WebStorm', category: 'editor' },
  { name: 'GoLand', bundleId: 'com.jetbrains.goland', category: 'editor' },
  { name: 'Xcode', bundleId: 'com.apple.dt.Xcode', category: 'editor' },
  { name: 'Sublime Text', bundleId: 'com.sublimetext.4', category: 'editor' },
  { name: 'Typora', bundleId: 'abnerworks.Typora', category: 'editor' },
  { name: 'Cursor', bundleId: 'com.todesktop.230313mzl4w4u92', category: 'editor' },

  // 终端
  { name: 'iTerm', bundleId: 'com.googlecode.iterm2', category: 'terminal' },
  { name: 'Terminal', bundleId: 'com.apple.Terminal', category: 'terminal' },
  { name: 'Termius', bundleId: 'com.termius-dmg.mac', category: 'terminal' },
  { name: 'Warp', bundleId: 'dev.warp.Warp-Stable', category: 'terminal' },

  // 通讯
  { name: 'WeChat', bundleId: 'com.tencent.xinWeChat', category: 'communication' },
  { name: 'QQ', bundleId: 'com.tencent.qq', category: 'communication' },
  { name: 'Telegram', bundleId: 'com.tdesktop.Telegram', category: 'communication' },
  { name: 'Slack', bundleId: 'com.tinyspeck.slackmacgap', category: 'communication' },
  { name: 'Discord', bundleId: 'com.hnc.Discord', category: 'communication' },
  { name: 'Lark', bundleId: 'com.electron.lark', category: 'communication' },
  { name: 'DingTalk', bundleId: 'com.alibaba.DingTalkMac', category: 'communication' },

  // 笔记 & 效率
  { name: 'Obsidian', bundleId: 'md.obsidian', category: 'notes' },
  { name: 'Notes', bundleId: 'com.apple.Notes', category: 'notes' },
  { name: 'Reminders', bundleId: 'com.apple.reminders', category: 'notes' },
  { name: 'Notion', bundleId: 'notion.id', category: 'notes' },
  { name: 'Bear', bundleId: 'net.shinyfrog.bear', category: 'notes' },

  // 系统 & 工具
  { name: 'Finder', bundleId: 'com.apple.finder', category: 'system' },
  { name: 'Settings', bundleId: 'com.apple.systempreferences', category: 'system' },
  { name: 'Activity Monitor', bundleId: 'com.apple.ActivityMonitor', category: 'system' },
  { name: 'Mail', bundleId: 'com.apple.mail', category: 'system' },
  { name: 'Calendar', bundleId: 'com.apple.iCal', category: 'system' },
  { name: 'Karabiner-Elements', bundleId: 'org.pqrs.Karabiner-Elements.Settings', category: 'system' },
  { name: 'Karabiner-EventViewer', bundleId: 'org.pqrs.Karabiner-EventViewer', category: 'system' },
  { name: 'Apifox', bundleId: 'cn.apifox.app', category: 'tool' },
  { name: 'Surge', bundleId: 'com.nssurge.surge-mac', category: 'tool' },
  { name: 'Surge Dashboard', bundleId: 'com.nssurge.surge-dashboard', category: 'tool' },
  { name: ' Alfred', bundleId: 'com.runningwithcrayons.Alfred', category: 'tool' },
  { name: 'Raycast', bundleId: 'com.raycast.macos', category: 'tool' },
  { name: 'Scroll Reverser', bundleId: 'com.pilotmoon.scroll-reverser', category: 'tool' },
];

/**
 * 搜索应用 — 支持名称和 Bundle ID 模糊匹配
 */
export function searchApps(query: string): AppInfo[] {
  if (!query || query.length < 1) return APP_DATABASE.slice(0, 20);
  const q = query.toLowerCase();
  return APP_DATABASE.filter(
    app => app.name.toLowerCase().includes(q) || app.bundleId.toLowerCase().includes(q),
  );
}

/**
 * 通过 Bundle ID 查找应用
 */
export function findAppByBundleId(bundleId: string): AppInfo | undefined {
  return APP_DATABASE.find(app => app.bundleId === bundleId);
}

/**
 * 通过名称查找应用
 */
export function findAppByName(name: string): AppInfo | undefined {
  return APP_DATABASE.find(app => app.name.toLowerCase() === name.toLowerCase());
}
