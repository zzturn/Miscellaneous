import type {
  KarabinerConfig,
  Rule,
  Manipulator,
  ToEvent,
  Condition,
  ModifierKey,
} from '../types/karabiner';
import type { KeyBinding, BindingAction, BindingCategory } from '../types/editor';

interface GeneratorOptions {
  title: string;
  url?: string;
  version?: string;
  author?: string;
  importUrl?: string;
}

/**
 * 将 KeyBinding[] 生成完整的 Karabiner JSON 配置
 */
export function generateConfig(
  bindings: KeyBinding[],
  options: GeneratorOptions,
): KarabinerConfig {
  // 按 category 分组为 Rules
  const categoryRules = new Map<string, Manipulator[]>();
  const categoryLabels: Record<BindingCategory, string> = {
    navigation: '导航',
    selection: '选择',
    deletion: '删除',
    application: '应用切换',
    window: '窗口管理',
    input: '输入法',
    variable: '层激活',
    custom: '自定义',
  };

  for (const binding of bindings) {
    const cat = binding.category;
    if (!categoryRules.has(cat)) categoryRules.set(cat, []);
    const manipulator = bindingToManipulator(binding);
    if (manipulator) {
      categoryRules.get(cat)!.push(manipulator);
    }
  }

  const rules: Rule[] = [];
  for (const [cat, manipulators] of categoryRules) {
    const label = categoryLabels[cat as BindingCategory] || cat;
    rules.push({
      description: `Hyper: ${label}`,
      manipulators,
    });
  }

  return {
    title: options.title,
    url: options.url,
    version: options.version || new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    maintainers: options.author ? [options.author] : undefined,
    author: options.author,
    json_url: options.url,
    import_url: options.importUrl,
    rules,
  };
}

/**
 * 将单个 KeyBinding 转换为 Manipulator
 */
function bindingToManipulator(b: KeyBinding): Manipulator | null {
  const from = {
    key_code: b.key,
    ...(b.modifiers.length > 0
      ? { modifiers: { mandatory: b.modifiers as ModifierKey[] } }
      : undefined),
  };

  const to = actionToEvents(b.action);
  if (!to || to.length === 0) return null;

  const conditions = buildConditions(b);

  const manipulator: Manipulator = {
    type: 'basic',
    description: b.description,
    from,
    to,
    conditions: conditions.length > 0 ? conditions : undefined,
  };

  return manipulator;
}

/**
 * 根据 BindingAction 生成 ToEvent[]
 */
function actionToEvents(action: BindingAction): ToEvent[] | null {
  switch (action.type) {
    case 'app-toggle':
      return [{ shell_command: `open -b ${action.bundleId}` }];

    case 'key-remap':
      return [{
        key_code: action.toKey,
        ...(action.toModifiers?.length
          ? { modifiers: action.toModifiers as ModifierKey[] }
          : undefined),
      }];

    case 'shortcut':
      return [{
        key_code: action.key,
        modifiers: action.modifiers as ModifierKey[],
      }];

    case 'shell-command':
      return [{ shell_command: action.command }];

    case 'variable-set':
      return [{
        set_variable: {
          name: action.name,
          value: action.value,
          ...(action.keyUpValue !== undefined ? { key_up_value: action.keyUpValue } : undefined),
        },
      }];

    default:
      return null;
  }
}

/**
 * 生成应用 Toggle 的完整规则（open + hide）
 */
export function generateAppToggleRule(
  key: string,
  modifiers: ModifierKey[],
  appName: string,
  bundleId: string,
  layer?: string,
): KeyBinding[] {
  const baseCondition = layer
    ? [{ type: 'variable_if' as const, name: layer, value: 1 }]
    : undefined;

  // Open binding
  const openBinding: KeyBinding = {
    id: `app-open-${key}-${modifiers.join('+')}`,
    key: key as KeyBinding['key'],
    modifiers,
    category: 'application',
    description: `打开 ${appName}`,
    action: { type: 'app-toggle', appName, bundleId },
    layer,
    conditions: [
      ...(baseCondition || []),
      { type: 'frontmost_application_unless', bundle_identifiers: [bundleId] },
    ],
  };

  // Hide binding
  const hideBinding: KeyBinding = {
    id: `app-hide-${key}-${modifiers.join('+')}`,
    key: key as KeyBinding['key'],
    modifiers,
    category: 'application',
    description: `隐藏 ${appName}`,
    action: { type: 'shortcut', key: 'h', modifiers: ['left_command'] },
    layer,
    conditions: [
      ...(baseCondition || []),
      { type: 'frontmost_application_if', bundle_identifiers: [bundleId] },
    ],
  };

  return [openBinding, hideBinding];
}

/**
 * 构建条件
 */
function buildConditions(b: KeyBinding): Condition[] {
  const conditions: Condition[] = [];

  if (b.layer) {
    conditions.push({ type: 'variable_if', name: b.layer, value: 1 });
  }

  if (b.conditions) {
    conditions.push(...b.conditions.filter(c => c.type !== 'variable_if'));
  }

  return conditions;
}

/**
 * 生成 Karabiner import URL
 */
export function generateImportUrl(repoUrl: string, fileName: string): string {
  const rawUrl = repoUrl.replace('github.com', 'raw.githubusercontent.com')
    .replace('/blob/master/', '/master/');
  return `karabiner://karabiner/assets/complex_modifications/import?url=${rawUrl}/${fileName}`;
}
