import type { KarabinerConfig, Manipulator, Rule, ToEvent } from '../types/karabiner';
import type { KeyBinding, BindingCategory, BindingAction } from '../types/editor';
import { findAppByBundleId, findAppByName } from './apps';

let nextId = 0;
function uid(): string {
  return `binding-${++nextId}`;
}

/**
 * 解析 Karabiner JSON 配置为编辑器的语义化 KeyBinding 模型
 */
export function parseConfig(config: KarabinerConfig): KeyBinding[] {
  const bindings: KeyBinding[] = [];

  for (const rule of config.rules) {
    for (const manipulator of rule.manipulators) {
      if (manipulator.type !== 'basic') continue;

      // 跳过纯变量设置规则（Hyper 激活、Tab 激活等）
      if (isVariableActivation(manipulator)) continue;

      const binding = parseManipulator(manipulator, rule);
      if (binding) {
        bindings.push(binding);
      }
    }
  }

  return bindings;
}

/**
 * 检测是否为变量层激活规则（如 CapsLock → set hyper_on）
 */
function isVariableActivation(m: Manipulator): boolean {
  if (m.to?.length === 1 && m.to[0].set_variable) return true;
  return false;
}

/**
 * 解析单条 manipulator 为 KeyBinding
 */
function parseManipulator(m: Manipulator, rule: Rule): KeyBinding | null {
  const key = m.from.key_code;
  if (!key) return null;

  const modifiers = extractModifiers(m);
  const layer = extractLayer(m);
  const category = classifyManipulator(m, rule, modifiers);
  const action = extractAction(m);
  const description = m.description || '';

  const binding: KeyBinding = {
    id: uid(),
    key,
    modifiers,
    category,
    description,
    action,
    layer,
    conditions: m.conditions,
  };

  // to_if_alone（如 CapsLock alone → Escape）
  if (m.to_if_alone?.length === 1 && m.to_if_alone[0].key_code) {
    binding.toIfAlone = m.to_if_alone[0].key_code;
  }

  return binding;
}

/**
 * 提取修饰键
 */
function extractModifiers(m: Manipulator): string[] {
  const mods = m.from.modifiers;
  if (!mods) return [];

  const result: string[] = [];
  if (mods.mandatory) {
    result.push(...normalizeModifiers(mods.mandatory));
  }
  return result;
}

function normalizeModifiers(mods: string[]): string[] {
  return mods.map(m => {
    if (m === 'left_command' || m === 'right_command') return 'command';
    if (m === 'left_shift' || m === 'right_shift') return 'shift';
    if (m === 'left_control' || m === 'right_control') return 'control';
    if (m === 'left_option' || m === 'right_option') return 'option';
    return m;
  }).filter((v, i, a) => a.indexOf(v) === i);
}

/**
 * 提取所属层
 */
function extractLayer(m: Manipulator): string | undefined {
  for (const c of m.conditions || []) {
    if (c.type === 'variable_if') return c.name;
  }
  return undefined;
}

/**
 * 分类 manipulator — 优先按 rule 描述（JSON 中的原始分组），兜底用键码启发式
 */
function classifyManipulator(
  m: Manipulator,
  rule: Rule,
  modifiers: string[],
): BindingCategory {
  // ── 第一优先级：rule 描述关键词（直接对应 JSON 中的规则分组） ──
  const ruleDesc = (rule.description || '').toLowerCase();
  if (ruleDesc.includes('应用')) return 'application';
  if (ruleDesc.includes('窗口')) return 'window';
  if (ruleDesc.includes('输入法')) return 'input';
  if (ruleDesc.includes('删除')) return 'deletion';
  if (ruleDesc.includes('选中') || ruleDesc.includes('选择')) return 'selection';
  if (ruleDesc.includes('导航')) return 'navigation';

  // ── 兜底：基于绑定描述和键码的启发式分类 ──
  const desc = (m.description || '').toLowerCase();

  if (desc.includes('dock') || desc.includes('desktop') || desc.includes('expose') ||
      desc.includes('launchpad') || desc.includes('notification')) {
    return 'window';
  }

  if (isNavigationAction(m) && !modifiers.includes('shift')) return 'navigation';
  if (isNavigationAction(m) && modifiers.includes('shift')) return 'selection';

  if (isDeletionAction(m) || desc.includes('delete') || desc.includes('backspace')) {
    return 'deletion';
  }

  if (m.to?.some(t => t.shell_command?.includes('open -'))) return 'application';
  if (m.conditions?.some(c => c.type === 'frontmost_application_if') &&
      m.to?.some(t => t.key_code === 'h' && t.modifiers?.includes('left_command'))) {
    return 'application';
  }

  if (desc.includes('emoji') || desc.includes('capslock') || desc.includes('rime')) {
    return 'input';
  }

  if (m.to?.some(t => t.set_variable)) return 'variable';

  return 'custom';
}

function isNavigationAction(m: Manipulator): boolean {
  if (!m.to) return false;
  const navKeys = ['left_arrow', 'right_arrow', 'up_arrow', 'down_arrow', 'page_up', 'page_down', 'home', 'end'];
  return m.to.some(t => t.key_code && navKeys.includes(t.key_code));
}

function isDeletionAction(m: Manipulator): boolean {
  if (!m.to) return false;
  return m.to.some(t =>
    t.key_code === 'delete_or_backspace' || t.key_code === 'delete_forward'
  );
}

/**
 * 提取动作类型
 */
function extractAction(m: Manipulator): BindingAction {
  if (!m.to || m.to.length === 0) {
    return { type: 'other', raw: m };
  }

  const first = m.to[0];

  // Shell 命令 — 应用打开
  if (first.shell_command) {
    const cmd = first.shell_command;
    const appMatch = cmd.match(/open\s+(?:-a|-b)\s+['"]?([^'"\s]+)['"]?/);
    if (appMatch) {
      const identifier = appMatch[1];
      const isBundle = cmd.includes(' -b ');

      let appName = isBundle ? '' : identifier;
      let bundleId = isBundle ? identifier : '';

      // 从 bundleId 查找 appName
      if (bundleId && !appName) {
        const app = findAppByBundleId(bundleId);
        if (app) appName = app.name;
      }
      // 从 appName 查找 bundleId
      if (appName && !bundleId) {
        const app = findAppByName(appName);
        if (app) bundleId = app.bundleId;
      }

      return {
        type: 'app-toggle',
        appName,
        bundleId,
      };
    }

    return { type: 'shell-command', command: cmd };
  }

  // Cmd+H — 应用隐藏
  if (first.key_code === 'h' && first.modifiers?.includes('left_command')) {
    const bundleId = m.conditions?.find(c => c.bundle_identifiers)?.bundle_identifiers?.[0] || '';
    const app = findAppByBundleId(bundleId);
    return {
      type: 'app-toggle',
      appName: app?.name || '',
      bundleId,
    };
  }

  // 变量设置
  if (first.set_variable) {
    return {
      type: 'variable-set',
      name: first.set_variable.name,
      value: first.set_variable.value,
      keyUpValue: first.set_variable.key_up_value,
    };
  }

  // 按键映射（有修饰键 → 快捷键，无修饰键 → 按键重映射）
  if (first.key_code) {
    if (first.modifiers && first.modifiers.length > 0) {
      return {
        type: 'shortcut',
        key: first.key_code,
        modifiers: first.modifiers,
      };
    }
    return {
      type: 'key-remap',
      toKey: first.key_code,
      toModifiers: [],
    };
  }

  return { type: 'other', raw: m };
}

/**
 * 将 bindings 按主键分组
 */
export function groupByKey(bindings: KeyBinding[]): Map<string, KeyBinding[]> {
  const groups = new Map<string, KeyBinding[]>();
  for (const b of bindings) {
    const key = b.key;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  }
  return groups;
}

/**
 * 检测冲突：同键位+同修饰键+同层的规则
 */
export function findConflicts(bindings: KeyBinding[]): Map<string, KeyBinding[]> {
  const keyMap = new Map<string, KeyBinding[]>();

  for (const b of bindings) {
    const sig = `${b.key}|${b.modifiers.sort().join('+')}|${b.layer || ''}`;
    if (!keyMap.has(sig)) keyMap.set(sig, []);
    keyMap.get(sig)!.push(b);
  }

  const conflicts = new Map<string, KeyBinding[]>();
  for (const [sig, bs] of keyMap) {
    if (bs.length > 1) {
      for (const b of bs) {
        conflicts.set(b.id, bs);
      }
    }
  }
  return conflicts;
}
