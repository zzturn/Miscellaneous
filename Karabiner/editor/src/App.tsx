import { useEditorStore } from './store/editor-store';
import { Keyboard } from './components/Keyboard/Keyboard';
import { DetailPanel } from './components/Editor/DetailPanel';
import { AppManager } from './components/AppManager/AppManager';
import { ImportExport } from './components/ImportExport/ImportExport';
import { CATEGORIES } from './types/editor';
import type { BindingCategory, KeyBinding, KeyCode } from './types/editor';
import { generateAppToggleRule } from './lib/generator';
import { findAppByBundleId } from './lib/apps';

/** 分类颜色映射（inline styles，避免 Tailwind v4 JIT 扫不到动态类名） */
const catColors: Record<string, { bg: string; bgLight: string; border: string; text: string; textLight: string }> = {
  navigation: { bg: '#dbeafe', bgLight: '#eff6ff', border: '#60a5fa', text: '#1d4ed8', textLight: '#3b82f6' },
  selection:  { bg: '#e0f2fe', bgLight: '#f0f9ff', border: '#38bdf8', text: '#0369a1', textLight: '#0ea5e9' },
  deletion:   { bg: '#ffedd5', bgLight: '#fff7ed', border: '#fb923c', text: '#c2410c', textLight: '#f97316' },
  application:{ bg: '#dcfce7', bgLight: '#f0fdf4', border: '#4ade80', text: '#15803d', textLight: '#22c55e' },
  window:     { bg: '#f3e8ff', bgLight: '#faf5ff', border: '#c084fc', text: '#7e22ce', textLight: '#a855f7' },
  input:      { bg: '#fef9c3', bgLight: '#fefce8', border: '#facc15', text: '#a16207', textLight: '#eab308' },
  variable:   { bg: '#e0e7ff', bgLight: '#eef2ff', border: '#818cf8', text: '#4338ca', textLight: '#6366f1' },
  custom:     { bg: '#e5e7eb', bgLight: '#f3f4f6', border: '#9ca3af', text: '#374151', textLight: '#6b7280' },
};

export default function App() {
  const store = useEditorStore();
  const {
    rawConfig,
    bindings,
    activeCategory,
    activeView,
    selectedKeyId,
    selectedBindingId,
    importConfig,
    selectKey,
    selectBinding,
    setCategory,
    setView,
    addBinding,
    removeBinding,
  } = store;

  // 构建键→分类集合映射（一个键可属于多个分类，如 H 无修饰→导航，H+Shift→选择）
  const keyCategories = new Map<string, Set<BindingCategory>>();
  for (const b of bindings) {
    if (b.layer === 'hyper_on' || !b.layer) {
      if (!keyCategories.has(b.key)) {
        keyCategories.set(b.key, new Set());
      }
      keyCategories.get(b.key)!.add(b.category);
    }
  }

  // 按分类筛选
  const filteredBindings = activeCategory === 'all'
    ? bindings
    : bindings.filter(b => b.category === activeCategory);

  const handleAddApp = (appName: string, bundleId: string, key: string, mods: string[]) => {
    const newBindings = generateAppToggleRule(key, mods as any[], appName, bundleId, 'hyper_on');
    newBindings.forEach(b => addBinding(b));
  };

  return (
    <div className="h-screen flex flex-col bg-white text-gray-800">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">⌨</span>
          Karabiner 可视化配置
        </h1>
        <ImportExport
          config={rawConfig}
          bindings={bindings}
          onImport={importConfig}
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Category Navigation */}
        <nav className="w-44 border-r p-3 space-y-1 shrink-0">
          <div className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">分类</div>

          <button
            onClick={() => setCategory('all')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
              activeCategory === 'all' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
            }`}
          >
            全部 <span className="text-gray-400">({bindings.length})</span>
          </button>

          {CATEGORIES.map(cat => {
            const count = bindings.filter(b => b.category === cat.id).length;
            if (count === 0) return null;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  backgroundColor: isActive ? catColors[cat.id]?.bg : catColors[cat.id]?.bgLight,
                  borderColor: isActive ? catColors[cat.id]?.border : 'transparent',
                  borderWidth: isActive ? '1px' : '0',
                  color: isActive ? catColors[cat.id]?.text : catColors[cat.id]?.textLight,
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 border transition-all"
              >
                <span>{cat.icon}</span>
                {cat.label}
                <span className="ml-auto opacity-60">{count}</span>
              </button>
            );
          })}

          <div className="border-t pt-3 mt-3">
            <div className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">视图</div>
            {(['keyboard', 'apps'] as const).map(view => (
              <button
                key={view}
                onClick={() => setView(view)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  activeView === view ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                }`}
              >
                {view === 'keyboard' ? '⌨ 键盘视图' : '📱 应用管理'}
              </button>
            ))}
          </div>
        </nav>

        {/* Center: Main View */}
        <main className="flex-1 overflow-y-auto">
          {activeView === 'keyboard' && (
            <>
              {rawConfig ? (
                <Keyboard
                  keyCategories={keyCategories}
                  activeCategory={activeCategory}
                  selectedKey={selectedKeyId}
                  onKeyClick={selectKey}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="text-6xl mb-4">⌨</div>
                  <p className="text-lg mb-2">导入 Karabiner 配置文件开始</p>
                  <p className="text-sm">支持拖拽 JSON 文件或粘贴导入</p>
                </div>
              )}

              {/* Binding list under keyboard */}
              {selectedKeyId && (
                <div className="border-t p-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <span className="text-xl font-mono uppercase">{selectedKeyId}</span>
                    的绑定
                    <span className="text-sm text-gray-400">
                      {bindings.filter(b => b.key === selectedKeyId).length} 个
                    </span>
                  </h3>
                  <div className="space-y-1">
                    {bindings
                      .filter(b => b.key === selectedKeyId)
                      .map(b => (
                        <BindingRow
                          key={b.id}
                          binding={b}
                          isSelected={b.id === selectedBindingId}
                          onClick={() => selectBinding(b.id)}
                          onDelete={() => removeBinding(b.id)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeView === 'apps' && (
            <div className="p-4">
              <AppManager
                bindings={bindings}
                onAddApp={handleAddApp}
                onRemoveBinding={removeBinding}
                onSelectBinding={selectBinding}
              />
            </div>
          )}
        </main>

        {/* Right: Detail Panel */}
        <aside className="w-80 border-l overflow-y-auto shrink-0 bg-gray-50/50">
          <DetailPanel
            bindings={filteredBindings}
            selectedKeyId={selectedKeyId}
            selectedBindingId={selectedBindingId}
            onSelectBinding={selectBinding}
          />
        </aside>
      </div>

      {/* Footer: Status */}
      <footer className="border-t px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <span>
          {rawConfig ? `${bindings.length} 条规则` : '未导入配置'}
        </span>
        <span>
          {rawConfig?.title || ''} {rawConfig?.version || ''}
        </span>
      </footer>
    </div>
  );
}

/** 单条绑定行 */
function BindingRow({
  binding,
  isSelected,
  onClick,
  onDelete,
}: {
  binding: KeyBinding;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const modLabels: Record<string, string> = {
    command: '⌘',
    option: '⌥',
    control: '⌃',
    shift: '⇧',
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      <div className="w-20 text-sm font-mono">
        {binding.modifiers.map(m => modLabels[m] || m).join('')}{binding.key.toUpperCase()}
      </div>
      <div className="flex-1 text-sm text-gray-600 truncate">{binding.description}</div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="text-xs text-red-400 hover:text-red-600 px-1"
      >
        ✕
      </button>
    </div>
  );
}
