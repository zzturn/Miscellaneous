import { KEYBOARD_ROWS, type KeyDef } from '../../lib/keyboard-layout';
import type { BindingCategory } from '../../types/editor';

interface KeyboardProps {
  keyCategories: Map<string, Set<BindingCategory>>;
  activeCategory: BindingCategory | 'all';
  selectedKey: string | null;
  onKeyClick: (keyId: string) => void;
}

const CATEGORY_STYLES: Record<BindingCategory | 'none', { bg: string; border: string; color: string }> = {
  none:       { bg: '#f3f4f6', border: '#d1d5db', color: '#9ca3af' },
  navigation: { bg: '#dbeafe', border: '#60a5fa', color: '#1d4ed8' },
  selection:  { bg: '#e0f2fe', border: '#38bdf8', color: '#0369a1' },
  deletion:   { bg: '#ffedd5', border: '#fb923c', color: '#c2410c' },
  application:{ bg: '#dcfce7', border: '#4ade80', color: '#15803d' },
  window:     { bg: '#f3e8ff', border: '#c084fc', color: '#7e22ce' },
  input:      { bg: '#fef9c3', border: '#facc15', color: '#a16207' },
  variable:   { bg: '#e0e7ff', border: '#818cf8', color: '#4338ca' },
  custom:     { bg: '#e5e7eb', border: '#9ca3af', color: '#374151' },
};

/** 分类 → 图例标签 */
const CATEGORY_LABELS: [BindingCategory, string][] = [
  ['navigation', '导航'],
  ['selection', '选择'],
  ['deletion', '删除'],
  ['application', '应用'],
  ['window', '窗口'],
  ['input', '输入法'],
  ['custom', '自定义'],
];

/** 每行所有按键的 width 之和（包含 spacer） */
function rowUnitTotal(row: KeyDef[]): number {
  return row.reduce((sum, k) => sum + (k.width || 1), 0);
}

export function Keyboard({ keyCategories, activeCategory, selectedKey, onKeyClick }: KeyboardProps) {
  // 过滤分类时，只高亮匹配的键
  const dimmedKeys = new Set<string>();
  if (activeCategory !== 'all') {
    for (const row of KEYBOARD_ROWS) {
      for (const keyDef of row) {
        if (keyDef.spacer) continue;
        const cats = keyCategories.get(keyDef.id);
        if (!cats || !cats.has(activeCategory as BindingCategory)) {
          dimmedKeys.add(keyDef.id);
        }
      }
    }
  }

  // 图例中只高亮当前分类
  const legendCategories = activeCategory === 'all'
    ? CATEGORY_LABELS
    : CATEGORY_LABELS.filter(([cat]) => cat === activeCategory);

  return (
    <div className="select-none p-4">
      <div className="flex flex-col gap-1 mx-auto" style={{ width: '1022px' }}>
        {KEYBOARD_ROWS.map((row, rowIdx) => {
          const total = rowUnitTotal(row);
          return (
            <div key={rowIdx} className="flex gap-0.5" style={{ width: '100%' }}>
              {row.map((keyDef) => {
                const pct = ((keyDef.width || 1) / total) * 100;
                if (keyDef.spacer) {
                  return <div key={keyDef.id} style={{ width: `${pct}%`, height: '48px', flexShrink: 0 }} />;
                }
                return (
                  <KeyCap
                    key={keyDef.id}
                    def={keyDef}
                    pct={pct}
                    categories={keyCategories.get(keyDef.id)}
                    activeCategory={activeCategory}
                    isDimmed={dimmedKeys.has(keyDef.id)}
                    isSelected={selectedKey === keyDef.id}
                    onClick={() => onKeyClick(keyDef.id)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center text-xs">
        {legendCategories.map(([cat, label]) => {
          const s = CATEGORY_STYLES[cat];
          return (
            <span key={cat} className="flex items-center gap-1 font-medium" style={{ color: s.color }}>
              <span
                className="inline-block w-3 h-3 rounded-sm border"
                style={{ backgroundColor: s.bg, borderColor: s.border }}
              />
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function KeyCap({
  def,
  pct,
  categories,
  activeCategory,
  isDimmed,
  isSelected,
  onClick,
}: {
  def: KeyDef;
  pct: number;
  categories?: Set<BindingCategory>;
  activeCategory: BindingCategory | 'all';
  isDimmed: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const colorCat = activeCategory !== 'all' && categories?.has(activeCategory as BindingCategory)
    ? activeCategory
    : (categories?.values().next().value || 'none');
  const style = CATEGORY_STYLES[colorCat];

  const isBindable = /^[a-z]$/.test(def.id) ||
    ['spacebar', 'comma', 'period', 'slash', 'semicolon', 'quote',
     'tab', 'escape', 'caps_lock'].includes(def.id);

  const bg = isDimmed ? '#f9fafb' : style.bg;
  const border = isDimmed ? '#e5e7eb' : style.border;
  const color = isDimmed ? '#d1d5db' : style.color;
  const opacity = isDimmed ? 0.35 : (isBindable ? 1 : 0.4);

  return (
    <button
      onClick={onClick}
      style={{
        width: `${pct}%`,
        backgroundColor: bg,
        borderColor: border,
        color,
        boxSizing: 'border-box',
      }}
      className={`
        h-12 rounded-md border text-sm font-medium transition-all duration-150
        flex items-center justify-center overflow-hidden
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        ${isBindable && !isDimmed ? 'cursor-pointer hover:scale-105 hover:shadow-md' : ''}
        ${!isBindable && !isDimmed ? 'cursor-default' : ''}
      `}
      title={def.id}
    >
      <span className="truncate px-1" style={{ opacity }}>{def.label}</span>
    </button>
  );
}
