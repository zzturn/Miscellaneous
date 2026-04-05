import { create } from 'zustand';
import type { KarabinerConfig } from '../types/karabiner';
import type { KeyBinding, BindingCategory, KeyCode } from '../types/editor';
import { parseConfig, groupByKey, findConflicts } from '../lib/parser';

type ViewMode = 'keyboard' | 'matrix' | 'apps';

interface EditorStore {
  // 配置数据
  rawConfig: KarabinerConfig | null;
  bindings: KeyBinding[];
  groupedBindings: Map<string, KeyBinding[]>;
  conflicts: Map<string, KeyBinding[]>;

  // UI 状态
  selectedKeyId: string | null;
  selectedBindingId: string | null;
  activeCategory: BindingCategory | 'all';
  activeView: ViewMode;
  activeFile: string;
  searchQuery: string;

  // Actions
  importConfig: (config: KarabinerConfig, fileName: string) => void;
  selectKey: (keyId: string | null) => void;
  selectBinding: (bindingId: string | null) => void;
  setCategory: (category: BindingCategory | 'all') => void;
  setView: (view: ViewMode) => void;
  setSearch: (query: string) => void;
  updateBinding: (id: string, updates: Partial<KeyBinding>) => void;
  addBinding: (binding: KeyBinding) => void;
  removeBinding: (id: string) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  rawConfig: null,
  bindings: [],
  groupedBindings: new Map(),
  conflicts: new Map(),
  selectedKeyId: null,
  selectedBindingId: null,
  activeCategory: 'all',
  activeView: 'keyboard',
  activeFile: '',
  searchQuery: '',

  importConfig: (config, fileName) => {
    const bindings = parseConfig(config);
    const groupedBindings = groupByKey(bindings);
    const conflicts = findConflicts(bindings);
    set({
      rawConfig: config,
      bindings,
      groupedBindings,
      conflicts,
      activeFile: fileName,
      selectedKeyId: null,
      selectedBindingId: null,
    });
  },

  selectKey: (keyId) => set({ selectedKeyId: keyId, selectedBindingId: null }),

  selectBinding: (bindingId) => set({ selectedBindingId: bindingId }),

  setCategory: (category) => set({ activeCategory: category }),

  setView: (view) => set({ activeView: view }),

  setSearch: (query) => set({ searchQuery: query }),

  updateBinding: (id, updates) => {
    const bindings = get().bindings.map(b =>
      b.id === id ? { ...b, ...updates } : b
    );
    set({
      bindings,
      groupedBindings: groupByKey(bindings),
      conflicts: findConflicts(bindings),
    });
  },

  addBinding: (binding) => {
    const bindings = [...get().bindings, binding];
    set({
      bindings,
      groupedBindings: groupByKey(bindings),
      conflicts: findConflicts(bindings),
    });
  },

  removeBinding: (id) => {
    const bindings = get().bindings.filter(b => b.id !== id);
    set({
      bindings,
      groupedBindings: groupByKey(bindings),
      conflicts: findConflicts(bindings),
    });
  },
}));
