import type { KeyBinding } from '../../types/editor';
import { CATEGORIES } from '../../types/editor';
import { searchApps, findAppByBundleId } from '../../lib/apps';

import { useState } from 'react';

interface AppManagerProps {
  bindings: KeyBinding[];
  onAddApp: (appName: string, bundleId: string, key: string, mods: string[]) => void;
  onRemoveBinding: (id: string) => void;
  onSelectBinding: (id: string) => void;
}

export function AppManager({ bindings, onAddApp, onRemoveBinding, onSelectBinding }: AppManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [newApp, setNewApp] = useState({ name: '', bundleId: '', key: '', mods: '' });

  const appBindings = bindings.filter(b => b.category === 'application');

  // 按 app 分组
  const appGroups = new Map<string, KeyBinding[]>();
  for (const b of appBindings) {
    const appKey = getAppKey(b);
    if (!appGroups.has(appKey)) appGroups.set(appKey, []);
    appGroups.get(appKey)!.push(b);
  }

  const suggestions = search ? searchApps(search).slice(0, 10) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">应用快捷键</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
        >
          + 添加应用
        </button>
      </div>

      {/* 应用列表 */}
      <div className="space-y-2">
        {Array.from(appGroups.entries()).map(([appKey, group]) => {
          const first = group[0];
          const appName = getActionAppName(first);
          return (
            <div key={appKey} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{appName}</span>
                  <span className="text-xs text-gray-400 ml-2">{getKeyLabel(first)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectBinding(first.id)}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => group.forEach(b => onRemoveBinding(b.id))}
                    className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    删除
                  </button>
                </div>
              </div>
              {/* 修饰键变体 */}
              <div className="flex flex-wrap gap-1 mt-2">
                {group.map(b => (
                  <span key={b.id} className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                    {b.modifiers.map(m => MOD_LABELS[m] || m).join('') + b.key.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 添加应用弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-96 space-y-4">
            <h3 className="font-bold text-lg">添加应用快捷键</h3>

            <div>
              <label className="block text-sm text-gray-600 mb-1">应用名称</label>
              <input
                value={newApp.name}
                onChange={e => {
                  setNewApp({ ...newApp, name: e.target.value });
                  setSearch(e.target.value);
                }}
                placeholder="如: Safari"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              {suggestions.length > 0 && (
                <div className="mt-1 border rounded-lg max-h-40 overflow-y-auto">
                  {suggestions.map(app => (
                    <button
                      key={app.bundleId}
                      onClick={() => {
                        setNewApp({ ...newApp, name: app.name, bundleId: app.bundleId });
                        setSearch('');
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b last:border-0"
                    >
                      <span className="font-medium">{app.name}</span>
                      <span className="text-gray-400 ml-2 text-xs">{app.bundleId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Bundle ID</label>
              <input
                value={newApp.bundleId}
                onChange={e => setNewApp({ ...newApp, bundleId: e.target.value })}
                placeholder="如: com.apple.Safari"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">绑定键</label>
                <input
                  value={newApp.key}
                  onChange={e => setNewApp({ ...newApp, key: e.target.value })}
                  placeholder="如: g"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">修饰键</label>
                <select
                  value={newApp.mods}
                  onChange={e => setNewApp({ ...newApp, mods: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">无</option>
                  <option value="command">⌘ Cmd</option>
                  <option value="option">⌥ Option</option>
                  <option value="control">⌃ Ctrl</option>
                  <option value="shift">⇧ Shift</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (newApp.name && newApp.bundleId && newApp.key) {
                    onAddApp(newApp.name, newApp.bundleId, newApp.key, newApp.mods ? [newApp.mods] : []);
                    setShowAdd(false);
                    setNewApp({ name: '', bundleId: '', key: '', mods: '' });
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
              >
                确认添加
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MOD_LABELS: Record<string, string> = {
  command: '⌘',
  option: '⌥',
  control: '⌃',
  shift: '⇧',
};

function getAppKey(b: KeyBinding): string {
  if (b.action.type === 'app-toggle') return b.action.bundleId || b.action.appName;
  return b.id;
}

function getActionAppName(b: KeyBinding): string {
  if (b.action.type === 'app-toggle') return b.action.appName || b.action.bundleId;
  return b.description;
}

function getKeyLabel(b: KeyBinding): string {
  const mods = b.modifiers.map(m => MOD_LABELS[m] || m).join('');
  return `${mods}${b.key.toUpperCase()}`;
}
