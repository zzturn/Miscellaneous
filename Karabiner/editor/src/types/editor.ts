import type { KeyCode, ModifierKey, Condition } from './karabiner';

// ==================== Editor Internal Model ====================

export type BindingCategory =
  | 'navigation'   // 导航：方向键、行首尾、翻页
  | 'selection'    // 选择：选中移动
  | 'deletion'     // 删除：字符、词、行
  | 'application'  // 应用：打开/隐藏/切换
  | 'window'       // 窗口：Mission Control、Desktop 等
  | 'input'        // 输入法：切换输入法、Emoji
  | 'variable'     // 变量层：Hyper 激活、Tab 数字层
  | 'custom';      // 自定义：其他规则

export type ActionType =
  | 'app-toggle'       // 打开/隐藏应用 Toggle
  | 'app-open'         // 仅打开应用
  | 'key-remap'        // 按键映射（含修饰键）
  | 'shell-command'    // Shell 命令
  | 'shortcut'         // 系统快捷键（如 Cmd+Tab）
  | 'variable-set'     // 设置变量
  | 'input-source'     // 切换输入源
  | 'mouse-button'     // 鼠标按钮映射
  | 'simultaneous'     // 同时按键
  | 'other';           // 其他

export interface AppToggleAction {
  type: 'app-toggle';
  appName: string;
  bundleId: string;
}

export interface KeyRemapAction {
  type: 'key-remap';
  toKey: KeyCode;
  toModifiers: ModifierKey[];
}

export interface ShellCommandAction {
  type: 'shell-command';
  command: string;
  description?: string;
}

export interface ShortcutAction {
  type: 'shortcut';
  key: KeyCode;
  modifiers: ModifierKey[];
}

export interface VariableSetAction {
  type: 'variable-set';
  name: string;
  value: number;
  keyUpValue?: number;
}

export interface InputSourceAction {
  type: 'input-source';
  language?: string;
  inputSourceId?: string;
}

export interface MouseButtonAction {
  type: 'mouse-button';
  button: string;
}

export interface OtherAction {
  type: 'other';
  raw: unknown;
}

export type BindingAction =
  | AppToggleAction
  | KeyRemapAction
  | ShellCommandAction
  | ShortcutAction
  | VariableSetAction
  | InputSourceAction
  | MouseButtonAction
  | OtherAction;

/** 语义化的按键绑定 — 编辑器的核心数据模型 */
export interface KeyBinding {
  id: string;
  key: KeyCode;
  modifiers: ModifierKey[];
  category: BindingCategory;
  description: string;
  action: BindingAction;

  // 条件
  layer?: string;                    // 所属层（如 'hyper_on', 'tab_pressed'）
  conditions?: Condition[];

  // 特殊行为
  toIfAlone?: KeyCode;
  toAfterKeyUp?: { set_variable?: { name: string; value: number } };

  // iTerm2 兼容映射
  iTermCompat?: {
    terminalTo: KeyCode | string;
    terminalModifiers?: ModifierKey[];
    otherTo: KeyCode | string;
    otherModifiers?: ModifierKey[];
  };
}

/** 按键组 — 按主键分组的所有修饰键变体 */
export interface KeyGroup {
  key: KeyCode;
  bindings: KeyBinding[];
  hasConflict: boolean;
}

/** 分类信息 */
export interface CategoryInfo {
  id: BindingCategory;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'navigation', label: '导航', color: 'text-nav', bgColor: 'bg-nav-light', icon: '⬆' },
  { id: 'selection', label: '选择', color: 'text-nav', bgColor: 'bg-nav-light', icon: '✦' },
  { id: 'deletion', label: '删除', color: 'text-del', bgColor: 'bg-del-light', icon: '⌫' },
  { id: 'application', label: '应用', color: 'text-app', bgColor: 'bg-app-light', icon: '⚡' },
  { id: 'window', label: '窗口', color: 'text-win', bgColor: 'bg-win-light', icon: '⊞' },
  { id: 'input', label: '输入法', color: 'text-input', bgColor: 'bg-input-light', icon: '⌨' },
  { id: 'variable', label: '层激活', color: 'text-custom', bgColor: 'bg-custom-light', icon: '⚡' },
  { id: 'custom', label: '自定义', color: 'text-custom', bgColor: 'bg-custom-light', icon: '⚙' },
];

/** 应用信息 */
export interface AppInfo {
  name: string;
  bundleId: string;
  category: string;  // browser, editor, terminal, communication, tool, etc.
}

/** 编辑器状态 */
export interface EditorState {
  config: import('./karabiner').KarabinerConfig | null;
  bindings: KeyBinding[];
  selectedKeyId: KeyCode | null;
  selectedBindingId: string | null;
  activeCategory: BindingCategory | 'all';
  activeView: 'keyboard' | 'matrix' | 'apps';
  activeFile: string;
  searchQuery: string;
}
