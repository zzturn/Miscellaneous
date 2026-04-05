import type { KeyBinding } from '../../types/editor';
import { CATEGORIES, type BindingCategory } from '../../types/editor';

interface DetailPanelProps {
  bindings: KeyBinding[];
  selectedKeyId: string | null;
  selectedBindingId: string | null;
  onSelectBinding: (id: string) => void;
}

const MODIFIER_LABELS: Record<string, string> = {
  command: '⌘ Cmd',
  option: '⌥ Option',
  control: '⌃ Ctrl',
  shift: '⇧ Shift',
};

export function DetailPanel({
  bindings,
  selectedKeyId,
  selectedBindingId,
  onSelectBinding,
}: DetailPanelProps) {
  if (!selectedKeyId) {
    return (
      <div className="p-6 text-gray-400 text-center">
        <p className="text-lg mb-2">←</p>
        <p>点击键盘上的按键查看绑定</p>
      </div>
    );
  }

  const keyBindings = bindings.filter(b => b.key === selectedKeyId);

  if (keyBindings.length === 0) {
    return (
      <div className="p-6 text-gray-400 text-center">
        <p className="text-2xl font-mono mb-2 uppercase">{selectedKeyId}</p>
        <p>此键在 Hyper 层无绑定</p>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
          + 添加绑定
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-mono uppercase">{selectedKeyId}</h2>
        <span className="text-sm text-gray-400">{keyBindings.length} 条规则</span>
      </div>

      {/* 修饰键矩阵 */}
      <ModifierMatrix
        bindings={keyBindings}
        selectedBindingId={selectedBindingId}
        onSelect={onSelectBinding}
      />

      {/* 规则列表 */}
      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">所有绑定</h3>
        {keyBindings.map(b => (
          <BindingCard
            key={b.id}
            binding={b}
            isSelected={b.id === selectedBindingId}
            onClick={() => onSelectBinding(b.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ModifierMatrix({
  bindings,
  selectedBindingId,
  onSelect,
}: {
  bindings: KeyBinding[];
  selectedBindingId: string | null;
  onSelect: (id: string) => void;
}) {
  const modCombinations = [
    { label: '无修饰', mods: [] },
    { label: '⌘', mods: ['command'] },
    { label: '⌥', mods: ['option'] },
    { label: '⌃', mods: ['control'] },
    { label: '⇧', mods: ['shift'] },
  ];

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 text-gray-500 font-medium">修饰键</th>
            <th className="text-left p-2 text-gray-500 font-medium">动作</th>
          </tr>
        </thead>
        <tbody>
          {modCombinations.map(({ label, mods }) => {
            const binding = findBindingForMods(bindings, mods);
            return (
              <tr
                key={label}
                onClick={() => binding && onSelect(binding.id)}
                className={`
                  border-t cursor-pointer transition-colors
                  ${binding ? 'hover:bg-blue-50' : 'opacity-40'}
                  ${binding?.id === selectedBindingId ? 'bg-blue-50' : ''}
                `}
              >
                <td className="p-2 font-mono">{label}</td>
                <td className="p-2">
                  {binding ? (
                    <BindingActionLabel binding={binding} />
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function BindingCard({
  binding,
  isSelected,
  onClick,
}: {
  binding: KeyBinding;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cat = CATEGORIES.find(c => c.id === binding.category);

  return (
    <div
      onClick={onClick}
      className={`
        p-3 rounded-lg border cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs px-2 py-0.5 rounded-full ${cat?.bgColor} ${cat?.color}`}>
          {cat?.icon} {cat?.label}
        </span>
        {binding.modifiers.length > 0 && (
          <span className="text-xs text-gray-400">
            {binding.modifiers.map(m => MODIFIER_LABELS[m] || m).join(' + ')}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700">{binding.description || '无描述'}</p>
      <BindingActionLabel binding={binding} />
    </div>
  );
}

function BindingActionLabel({ binding }: { binding: KeyBinding }) {
  const action = binding.action;
  switch (action.type) {
    case 'app-toggle':
      return (
        <span className="text-xs text-green-600">
          ⚡ {action.appName || action.bundleId}
        </span>
      );
    case 'key-remap':
      return (
        <span className="text-xs text-blue-600">
          → {action.toKey.toUpperCase()}
        </span>
      );
    case 'shortcut':
      return (
        <span className="text-xs text-purple-600">
          {action.modifiers.map(m => MODIFIER_LABELS[m]?.charAt(0) || m).join('')}{action.key}
        </span>
      );
    case 'shell-command':
      return (
        <span className="text-xs text-orange-600" title={action.command}>
          🖥 {action.command.slice(0, 40)}...
        </span>
      );
    default:
      return <span className="text-xs text-gray-400">{action.type}</span>;
  }
}

function findBindingForMods(bindings: KeyBinding[], mods: string[]): KeyBinding | undefined {
  return bindings.find(b => {
    const bMods = [...b.modifiers].sort();
    const qMods = [...mods].sort();
    return bMods.length === qMods.length && bMods.every((m, i) => m === qMods[i]);
  });
}
