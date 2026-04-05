import type { KeyBinding, BindingCategory } from '../../types/editor';

interface ModifierMatrixProps {
  bindings: KeyBinding[];
  selectedKeyId: string;
  onSelectBinding: (id: string) => void;
}

const MODIFIER_COMBOS = [
  { label: '无修饰', mods: [] },
  { label: '⌘ Cmd', mods: ['command'] },
  { label: '⌥ Option', mods: ['option'] },
  { label: '⌃ Ctrl', mods: ['control'] },
  { label: '⇧ Shift', mods: ['shift'] },
  { label: '⌘⌥', mods: ['command', 'option'] },
  { label: '⌘⌃', mods: ['command', 'control'] },
  { label: '⌘⇧', mods: ['command', 'shift'] },
  { label: '⌥⌃', mods: ['option', 'control'] },
  { label: '⌥⇧', mods: ['option', 'shift'] },
  { label: '⌃⇧', mods: ['control', 'shift'] },
];

const CATEGORY_COLORS: Record<BindingCategory, string> = {
  navigation: 'bg-blue-50 border-blue-200 text-blue-700',
  selection: 'bg-sky-50 border-sky-200 text-sky-700',
  deletion: 'bg-orange-50 border-orange-200 text-orange-700',
  application: 'bg-green-50 border-green-200 text-green-700',
  window: 'bg-purple-50 border-purple-200 text-purple-700',
  input: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  variable: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  custom: 'bg-gray-200 border-gray-300 text-gray-700',
};

export function ModifierMatrix({ bindings, selectedKeyId, onSelectBinding }: ModifierMatrixProps) {
  if (!selectedKeyId) return null;

  const keyBindings = bindings.filter(b => b.key === selectedKeyId);

  if (keyBindings.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold uppercase">{selectedKeyId}</h3>
        <span className="text-sm text-gray-500">{keyBindings.length} 个绑定</span>
      </div>
      <div className="grid gap-1">
        {/* Header */}
        <div className="text-xs text-gray-400 font-medium px-2 py-1">修饰键</div>
        <div className="text-xs text-gray-400 font-medium px-2 py-1">动作</div>
        <div className="text-xs text-gray-400 font-medium px-2 py-1">分类</div>

        {MODIFIER_COMBOS.map(({ label, mods }) => {
          const binding = findBinding(keyBindings, mods);
          return (
            <MatrixRow
              key={label}
              modifier={label}
              binding={binding}
              isSelected={binding?.id === undefined}
              onClick={() => binding && onSelectBinding(binding.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function MatrixRow({
  modifier,
  binding,
  isSelected,
  onClick,
}: {
  modifier: string;
  binding?: KeyBinding;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`
        contents grid grid-cols-[auto_1fr_2fr_auto] gap-1 cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${binding ? CATEGORY_COLORS[binding.category] : 'bg-gray-50'}
      `}
    >
      <div className="px-2 py-2 text-sm font-medium rounded-l">{modifier}</div>
      <div className="px-2 py-2 text-sm truncate rounded-r">
        {binding ? binding.description : '—'}
      </div>
      <div className="px-2 py-2 text-xs rounded-r">
        {binding?.category || ''}
      </div>
    </div>
  );
}

function findBinding(bindings: KeyBinding[], mods: string[]): KeyBinding | undefined {
  return bindings.find(b => {
    const bMods = [...b.modifiers].sort();
    const qMods = [...mods].sort();
    return bMods.length === qMods.length && bMods.every((m, i) => m === qMods[i]);
  });
}
